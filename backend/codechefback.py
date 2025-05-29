from flask import Flask, request, jsonify
import requests
import pandas as pd
# asyncio and aiohttp are imported but not actively used for the core fetching.
# If you were to switch to full async, they'd be essential.
# import asyncio
# import aiohttp
import time
import threading
from queue import Queue, Empty # Queue, Empty not actively used in the provided optimized path
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict, deque
import logging
from flask_cors import CORS
import json
import os
from dataclasses import dataclass
from typing import Dict, List, Optional
import signal
import sys
from functools import wraps
import gc

app = Flask(__name__)
#CORS(app)
CORS(app, origins=["https://skillboard-production-3650.up.railway.app"])

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(threadName)s - %(message)s', # Added threadName
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('codechef_api.log')
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class APIConfig:
    MAX_CONCURRENT_REQUESTS = 200  # Max worker threads, also influences connection pool size
    BATCH_SIZE = 50
    REQUEST_TIMEOUT = 10  # Slightly increased for more resilience
    MAX_RETRIES = 5
    RETRY_DELAY = 0.05
    RATE_LIMIT_PER_SECOND = 100
    # CONNECTION_POOL_SIZE removed, adapter config is now primary
    CACHE_DURATION = 600  # 10 minute cache
    BACKOFF_FACTOR = 1.2
    CIRCUIT_BREAKER_THRESHOLD = 15 # Slightly higher threshold
    THREAD_POOL_TIMEOUT_PER_BATCH = 180 # 3 minutes timeout for a whole batch
    THREAD_POOL_TIMEOUT_PER_TASK = 45   # 45 seconds timeout for a single task in the pool

# Global state management
class GlobalState:
    def __init__(self):
        self.cache = {}
        self.cache_timestamps = {}
        self.failed_requests = defaultdict(int) # Potentially redundant if circuit breaker handles this
        self.request_times = deque(maxlen=1000) # For potential future performance monitoring
        self.success_count = 0 # Per-request, reset in endpoint
        self.error_count = 0   # Per-request, reset in endpoint
        self.total_processed = 0 # Per-request, reset in endpoint
        self.lock = threading.RLock() # RLock for safety if methods call each other while holding lock
        self._session: Optional[requests.Session] = None
        self._session_lock = threading.Lock() # Lock specifically for session creation
        self.circuit_breaker = defaultdict(int)

    def get_session(self) -> requests.Session:
        """Get or create a single, shared, optimized HTTP session."""
        if self._session is None:
            with self._session_lock: # Ensure session is created only once
                if self._session is None: # Double-check locking pattern
                    session = requests.Session()
                    adapter = requests.adapters.HTTPAdapter(
                        pool_connections=APIConfig.MAX_CONCURRENT_REQUESTS, # Align with worker threads
                        pool_maxsize=APIConfig.MAX_CONCURRENT_REQUESTS,   # Align with worker threads
                        max_retries=requests.adapters.Retry( # We handle retries manually
                            total=0,
                            backoff_factor=0,
                            status_forcelist=[]
                        )
                    )
                    session.mount('http://', adapter)
                    session.mount('https://', adapter)
                    session.headers.update({
                        'User-Agent': 'CodeChef-Analyzer/1.1', # Updated version
                        'Connection': 'keep-alive',
                        'Accept-Encoding': 'gzip, deflate'
                    })
                    self._session = session
                    logger.info(f"Requests session created with pool_connections={APIConfig.MAX_CONCURRENT_REQUESTS}, pool_maxsize={APIConfig.MAX_CONCURRENT_REQUESTS}")
        return self._session

    def close_session(self):
        """Close the shared HTTP session."""
        with self._session_lock:
            if self._session:
                self._session.close()
                self._session = None
                logger.info("Global requests session closed.")

    def is_cached(self, username: str) -> bool:
        with self.lock:
            if username in self.cache:
                if time.time() - self.cache_timestamps[username] < APIConfig.CACHE_DURATION:
                    return True
                else:
                    # Eagerly remove expired cache
                    del self.cache[username]
                    del self.cache_timestamps[username]
                    logger.debug(f"Cache expired and removed for {username}")
        return False

    def get_cache(self, username: str):
        with self.lock:
            return self.cache.get(username)

    def set_cache(self, username: str, data):
        with self.lock:
            self.cache[username] = data
            self.cache_timestamps[username] = time.time()

    def increment_stats(self, success: bool): # These stats are per-request
        with self.lock:
            self.total_processed += 1
            if success:
                self.success_count += 1
            else:
                self.error_count += 1

    def should_circuit_break(self, api_endpoint: str) -> bool:
        with self.lock:
            return self.circuit_breaker[api_endpoint] >= APIConfig.CIRCUIT_BREAKER_THRESHOLD

    def record_failure(self, api_endpoint: str):
        with self.lock:
            self.circuit_breaker[api_endpoint] += 1
            logger.warning(f"Circuit breaker count for {api_endpoint} increased to {self.circuit_breaker[api_endpoint]}")
            if self.circuit_breaker[api_endpoint] >= APIConfig.CIRCUIT_BREAKER_THRESHOLD:
                logger.error(f"Circuit breaker tripped for {api_endpoint}!")


    def record_success(self, api_endpoint: str):
        with self.lock:
            if self.circuit_breaker[api_endpoint] > 0: # Only decrement if it was > 0
                self.circuit_breaker[api_endpoint] -=1
                logger.debug(f"Circuit breaker count for {api_endpoint} decreased to {self.circuit_breaker[api_endpoint]}")


# Global state instance
state = GlobalState()

class RateLimiter:
    def __init__(self):
        self.requests_timestamps = deque() # Store timestamps of requests
        self.lock = threading.Lock() # Use a regular lock, RLock not needed here

    def can_proceed(self) -> bool:
        current_time = time.perf_counter() # Use perf_counter for more precision
        with self.lock:
            # Remove timestamps older than 1 second
            while self.requests_timestamps and current_time - self.requests_timestamps[0] > 1:
                self.requests_timestamps.popleft()

            if len(self.requests_timestamps) < APIConfig.RATE_LIMIT_PER_SECOND:
                self.requests_timestamps.append(current_time)
                return True
            return False

    def wait_if_needed(self):
        while not self.can_proceed():
            # Calculate how long to wait to not exceed the rate limit precisely
            # This is a slightly more advanced way than fixed small sleeps
            with self.lock:
                if self.requests_timestamps:
                    time_to_wait = 1.0 - (time.perf_counter() - self.requests_timestamps[0]) + 0.001 # Add small buffer
                else: # Should not happen if can_proceed was false
                    time_to_wait = 0.001 
            
            time.sleep(max(0, time_to_wait)) # Sleep for the calculated duration or a minimum if already passed


rate_limiter = RateLimiter()

class SmartRetryHandler:
    @staticmethod
    def should_retry(status_code: int, attempt: int) -> bool:
        if attempt >= APIConfig.MAX_RETRIES:
            return False
        # Retry on specific status codes + generic server errors
        retry_codes = [408, 429, 500, 502, 503, 504] # Common retryable errors
        # Removed 409, 422, 423, 424 as they are often not transient
        return status_code in retry_codes

    @staticmethod
    def get_retry_delay(attempt: int) -> float:
        # Exponential backoff with a cap
        return min(APIConfig.RETRY_DELAY * (APIConfig.BACKOFF_FACTOR ** attempt), 2.0) # Cap delay at 2s

class BulkProcessor: # This class is per-request, so its state is isolated
    def __init__(self, total_tasks: int):
        self.results = []
        self.results_lock = threading.Lock()
        self.progress_callback = None
        self.completed_tasks = 0
        self.total_tasks = total_tasks

    def set_progress_callback(self, callback):
        self.progress_callback = callback

    def update_progress(self):
        self.completed_tasks +=1
        if self.progress_callback:
            self.progress_callback(self.completed_tasks, self.total_tasks)

    def add_result(self, result):
        with self.results_lock:
            self.results.append(result)
        self.update_progress() # Call progress update when a result is added

    def get_results(self):
        with self.results_lock:
            return self.results.copy()

def fetch_profile_optimized(username: str, processor: Optional[BulkProcessor] = None) -> dict:
    if state.is_cached(username):
        cached_result = state.get_cache(username)
        state.increment_stats(True) # Uses per-request state instance if called from endpoint
        if processor:
            processor.add_result(cached_result)
        return cached_result

    api_endpoint_name = "codechef-api-proxy" # A logical name for the service being hit
    if state.should_circuit_break(api_endpoint_name):
        logger.warning(f"Circuit open for {api_endpoint_name}, failing fast for {username}")
        result = {"username": username, "status": "error", "message": "Service temporarily unavailable (Circuit Breaker Open)"}
        state.increment_stats(False)
        if processor:
            processor.add_result(result)
        return result

    api_urls = [
        f"https://codechef-api.vercel.app/handle/{username}",
        f"https://codechef-api-backup.vercel.app/handle/{username}",
    ]
    
    session = state.get_session() # Get the shared session

    last_exception = None

    for attempt in range(APIConfig.MAX_RETRIES):
        for api_url in api_urls: # Try primary, then backup on each attempt if primary fails immediately
            try:
                rate_limiter.wait_if_needed()
                
                response = session.get(
                    api_url,
                    timeout=APIConfig.REQUEST_TIMEOUT,
                    stream=False,
                    allow_redirects=True
                )
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        # Add derived fields
                        data["contestsGiven"] = len(data.get("ratingData", [])) if isinstance(data.get("ratingData"), list) else 0
                        if "currentRating" not in data: data["currentRating"] = 0
                        if "highestRating" not in data: data["highestRating"] = data.get("currentRating", 0)
                        if "globalRank" not in data: data["globalRank"] = "N/A"
                        if "countryRank" not in data: data["countryRank"] = "N/A"
                        if "stars" not in data:
                            rating = data.get("currentRating", 0)
                            if rating < 1400: data["stars"] = "1" # Keep as string if original API does
                            elif rating < 1600: data["stars"] = "2"
                            elif rating < 1800: data["stars"] = "3"
                            elif rating < 2000: data["stars"] = "4"
                            elif rating < 2200: data["stars"] = "5"
                            elif rating < 2500: data["stars"] = "6"
                            else: data["stars"] = "7"
                        
                        result = {"username": username, "status": "success", "data": data}
                        state.set_cache(username, result)
                        state.record_success(api_endpoint_name)
                        state.increment_stats(True)
                        if processor:
                            processor.add_result(result)
                        return result
                    except json.JSONDecodeError as e:
                        logger.warning(f"Invalid JSON for {username} from {api_url}: {e}. Body: {response.text[:200]}")
                        last_exception = e
                        # Don't retry this specific URL for this attempt, move to next URL or next attempt
                        continue # Try next URL or next attempt
                
                elif response.status_code == 404:
                    logger.info(f"User {username} not found (404) from {api_url}.")
                    result = {"username": username, "status": "error", "message": "User not found"}
                    # Don't cache "User not found" errors globally unless sure, but don't retry.
                    state.increment_stats(False) # Still an error in processing this user
                    if processor:
                        processor.add_result(result)
                    return result # Definitively not found

                # Check for retryable status codes
                if SmartRetryHandler.should_retry(response.status_code, attempt):
                    logger.info(f"Retrying {username} from {api_url} (status {response.status_code}, attempt {attempt + 1}/{APIConfig.MAX_RETRIES})")
                    last_exception = requests.exceptions.HTTPError(f"Status {response.status_code}")
                    time.sleep(SmartRetryHandler.get_retry_delay(attempt))
                    # Continue to next URL, or if this was the last URL, the outer loop will go to next attempt
                    continue 
                else:
                    logger.warning(f"Non-retryable error for {username} from {api_url}: {response.status_code}. Body: {response.text[:200]}")
                    last_exception = requests.exceptions.HTTPError(f"Status {response.status_code}")
                    # This was a non-retryable error for this URL. Try next URL.
                    # If this is the last URL, the loop for URLs will end, and if it's the last attempt, it will fall through.
                    continue # Try next URL in api_urls

            except requests.exceptions.Timeout as e:
                logger.info(f"Timeout for {username} from {api_url}, attempt {attempt + 1}/{APIConfig.MAX_RETRIES}")
                last_exception = e
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request error for {username} from {api_url}: {e}, attempt {attempt + 1}/{APIConfig.MAX_RETRIES}")
                last_exception = e
            except Exception as e: # Catch broader exceptions too
                logger.error(f"Unexpected error for {username} from {api_url}: {e}", exc_info=True)
                last_exception = e
                # This is an unexpected error, probably better to break from this URL and try next or retry
                break # Break from inner api_urls loop, proceed to next attempt if any
        
        # If we've gone through all URLs in an attempt and haven't succeeded or returned, sleep before next attempt.
        if attempt < APIConfig.MAX_RETRIES - 1: # Don't sleep after the last attempt
             # Check if we should sleep, only if not a terminal error like 404
            if not (isinstance(last_exception, requests.exceptions.HTTPError) and getattr(last_exception, 'response', None) and last_exception.response.status_code == 404):
                time.sleep(SmartRetryHandler.get_retry_delay(attempt)) # Sleep before next full attempt cycle
        

    # All attempts for all URLs failed
    state.record_failure(api_endpoint_name)
    error_message = f"Max retries exceeded. Last error: {str(last_exception)}" if last_exception else "Max retries exceeded - API temporarily unavailable"
    result = {"username": username, "status": "error", "message": error_message}
    state.increment_stats(False)
    if processor:
        processor.add_result(result)
    return result

def process_batch_intelligent(usernames: List[str], processor: BulkProcessor) -> None: # Modified to not return, results are in processor
    """Process a batch of usernames using ThreadPoolExecutor. Results are added to processor."""
    max_workers = min(APIConfig.MAX_CONCURRENT_REQUESTS, len(usernames))
    
    # Naming threads is good for debugging
    with ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="CodeChefWorker") as executor:
        future_to_username = {
            executor.submit(fetch_profile_optimized, username, processor): username
            for username in usernames
        }
        
        processed_count_in_batch = 0
        total_in_batch = len(usernames)

        for future in as_completed(future_to_username, timeout=APIConfig.THREAD_POOL_TIMEOUT_PER_BATCH):
            username = future_to_username[future]
            try:
                # The result is already added to processor inside fetch_profile_optimized
                # We just need to handle exceptions from the future itself (e.g., task timeout)
                future.result(timeout=APIConfig.THREAD_POOL_TIMEOUT_PER_TASK) # Check for task-specific exceptions
                processed_count_in_batch += 1
                
                # Log progress periodically
                # The processor itself handles calling its progress_callback
                if processed_count_in_batch % 25 == 0 or processed_count_in_batch == total_in_batch :
                    # Global stats (state.success_count, state.total_processed) are updated by fetch_profile_optimized
                    # For per-request overall progress:
                    overall_processed_for_request = state.total_processed 
                    overall_success_for_request = state.success_count
                    
                    success_rate = (overall_success_for_request / max(overall_processed_for_request, 1)) * 100
                    logger.info(f"Batch task {processed_count_in_batch}/{total_in_batch} completed. "
                                f"Overall request progress: {overall_processed_for_request} processed, "
                                f"Success rate: {success_rate:.1f}%")

            except TimeoutError: # Specifically from future.result(timeout=...)
                logger.error(f"Task timeout for {username} after {APIConfig.THREAD_POOL_TIMEOUT_PER_TASK}s.")
                error_result = {"username": username, "status": "error", "message": f"Processing task timed out"}
                processor.add_result(error_result) # Ensure it's added
                state.increment_stats(False) # Count as an error for this request
            except Exception as e:
                logger.error(f"Future resolution error for {username}: {e}", exc_info=True)
                error_result = {"username": username, "status": "error", "message": f"Critical error in task: {str(e)}"}
                processor.add_result(error_result) # Ensure it's added
                state.increment_stats(False) # Count as an error for this request
    # No need to return batch_results, processor has them

@app.route('/health', methods=['GET'])
def health_check():
    # Global state reflects overall health, not per-request stats here
    # To get cache size correctly:
    with state.lock:
        cache_size = len(state.cache)
    
    return jsonify({
        "status": "healthy",
        "message": "CodeChef API Service is running",
        "config": {
             "max_concurrent_requests": APIConfig.MAX_CONCURRENT_REQUESTS,
             "rate_limit_rps": APIConfig.RATE_LIMIT_PER_SECOND,
             "cache_duration_sec": APIConfig.CACHE_DURATION
        },
        "stats": { # These are global, longer-term stats
            "cache_size": cache_size,
            "circuit_breakers": dict(state.circuit_breaker) # Show state of all circuit breakers
        }
    }), 200

@app.route('/fetch-profiles', methods=['POST'])
def fetch_profiles_endpoint(): # Renamed to avoid conflict with legacy function
    request_start_time = time.perf_counter()

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if not file.filename: # Check if filename is empty
        return jsonify({"error": "No file selected"}), 400
    
    if '.' not in file.filename:
        return jsonify({"error": "Invalid file format (no extension)"}), 400
    
    file_extension = file.filename.rsplit('.', 1)[1].lower().strip() # Added strip
    
    try:
        if file_extension == 'csv':
            df = pd.read_csv(file, dtype=str, keep_default_na=False) # Read all as string, handle NA
        elif file_extension in ['xlsx', 'xls']:
            df = pd.read_excel(file, dtype=str, keep_default_na=False) # Read all as string, handle NA
        else:
            return jsonify({"error": "Unsupported file format. Please upload CSV or Excel file"}), 400
        
        if df.empty:
            return jsonify({"error": "File is empty"}), 400
        
        if df.shape[1] == 0: # No columns
             return jsonify({"error": "File contains no columns"}), 400

        usernames_raw = df.iloc[:, 0].astype(str).str.strip().tolist()
        # Filter out empty strings or common non-username placeholders after stripping
        usernames = [u for u in usernames_raw if u and u.lower() not in ('nan', 'none', '')]
        
        # Deduplicate while preserving order
        seen = set()
        unique_usernames = [u for u in usernames if not (u in seen or seen.add(u))]
        
        if not unique_usernames:
            return jsonify({"error": "No valid usernames found in the first column of the file"}), 400
        
        logger.info(f"Request {request.remote_addr}: Starting bulk processing for {len(unique_usernames)} unique usernames.")
        
        # IMPORTANT: Reset per-request stats in GlobalState.
        # This assumes GlobalState is acceptable for holding temporary per-request aggregates.
        # For true concurrency without interference, these stats should be managed entirely
        # within this request's scope (e.g., in BulkProcessor or locally).
        with state.lock: # Ensure atomic reset for these specific fields
            state.success_count = 0
            state.error_count = 0
            state.total_processed = 0
        
        # BulkProcessor is instantiated per request, so its state is fine.
        # Pass the total number of unique usernames to the processor.
        processor = BulkProcessor(total_tasks=len(unique_usernames))
        
        # Example of setting a progress callback (optional)
        # def my_progress_logger(completed, total):
        #    logger.info(f"Request Progress: {completed}/{total} items processed for this request.")
        # processor.set_progress_callback(my_progress_logger)

        batch_size = APIConfig.BATCH_SIZE
        
        for i in range(0, len(unique_usernames), batch_size):
            batch_usernames = unique_usernames[i:i + batch_size]
            batch_start_time = time.perf_counter()
            
            logger.info(f"Request {request.remote_addr}: Processing batch {i//batch_size + 1}/"
                        f"{(len(unique_usernames) + batch_size - 1)//batch_size} "
                        f"({len(batch_usernames)} usernames)")
            
            try:
                # process_batch_intelligent now populates processor.results directly
                process_batch_intelligent(batch_usernames, processor)
                
                batch_elapsed_time = time.perf_counter() - batch_start_time
                logger.info(f"Request {request.remote_addr}: Batch completed in {batch_elapsed_time:.2f}s. "
                            f"Rate: {len(batch_usernames)/max(batch_elapsed_time, 0.001):.1f} profiles/sec for batch.")
                
                if i + batch_size < len(unique_usernames):
                    time.sleep(0.05) # Small pause between batches, might help rate limit adherence
                    
                if (i // batch_size + 1) % 10 == 0: # After every 10 batches
                    gc.collect()
                    logger.info(f"Request {request.remote_addr}: Performed garbage collection.")
                    
            except Exception as e: # Catch errors from process_batch_intelligent itself (e.g., ThreadPoolExecutor issues)
                logger.error(f"Request {request.remote_addr}: Critical error during batch processing: {e}", exc_info=True)
                # Mark remaining usernames in this batch as errored if necessary
                for username_in_failed_batch in batch_usernames:
                    # Check if it was already processed by a successful future before the batch error
                    if not any(res['username'] == username_in_failed_batch for res in processor.get_results()):
                        error_result = {
                            "username": username_in_failed_batch, "status": "error",
                            "message": f"Batch processing infrastructure failed: {str(e)}"
                        }
                        processor.add_result(error_result)
                        state.increment_stats(False) # Ensure stat is counted

        all_results = processor.get_results()
        
        # Final consistency check (ensure all original unique usernames have a result)
        # This is more robust if tasks in process_batch_intelligent can fail to add a result
        processed_usernames_set = {result['username'] for result in all_results}
        missing_usernames = [u for u in unique_usernames if u not in processed_usernames_set]
        for username_missed in missing_usernames:
            logger.warning(f"Request {request.remote_addr}: Username {username_missed} was in input but missing from final results. Adding error placeholder.")
            all_results.append({
                "username": username_missed, "status": "error",
                "message": "Processing did not complete for this user (system error)."
            })
            state.increment_stats(False) # Count as an error for this request

        request_total_time = time.perf_counter() - request_start_time
        
        # Use the per-request stats from state for the final summary of this request
        final_success_count = state.success_count
        final_total_processed = state.total_processed # Should match len(all_results) if consistency checks are good
        final_error_count = final_total_processed - final_success_count


        logger.info(f"Request {request.remote_addr}: Bulk processing completed for {len(unique_usernames)} unique usernames. "
                    f"Total results: {len(all_results)}. "
                    f"Successful: {final_success_count}, Errors: {final_error_count}. "
                    f"Total time: {request_total_time:.2f}s. "
                    f"Overall Rate: {len(all_results)/max(request_total_time, 0.001):.1f} profiles/sec.")
        
        return jsonify(all_results)
    
    except pd.errors.EmptyDataError:
        logger.warning(f"Request {request.remote_addr}: Uploaded file is empty or unparseable.", exc_info=True)
        return jsonify({"error": "Uploaded file is empty or not a valid CSV/Excel file."}), 400
    except ValueError as ve: # Catch more specific pandas errors if any
        logger.warning(f"Request {request.remote_addr}: Value error processing file: {ve}", exc_info=True)
        return jsonify({"error": f"Error processing file contents: {str(ve)}"}), 400
    except Exception as e:
        logger.critical(f"Request {request.remote_addr}: Unhandled critical error in /fetch-profiles: {e}", exc_info=True)
        return jsonify({"error": f"An unexpected server error occurred: {str(e)}"}), 500

@app.route('/fetch-profile', methods=['GET'])
def fetch_profile_single_endpoint(): # Renamed to avoid conflict
    username = request.args.get('username', '').strip()
    if not username:
        return jsonify({"status": "error", "message": "No username provided"}), 400
    
    # For single requests, stats are reset/managed if you want isolated tracking,
    # or they contribute to some ongoing global count if not reset.
    # Here, we'll let it use the GlobalState as-is, meaning increment_stats
    # will affect the same global counters as bulk, which might be okay or not
    # depending on desired stat behavior. For simplicity, not resetting here.
    # If you need isolated stats for single calls, you'd need to handle it.
    
    result = fetch_profile_optimized(username) # processor is None here
    return jsonify(result)

# Legacy compatibility functions (unchanged, they call the optimized path)
def fetch_profile(username):
    return fetch_profile_optimized(username)

def fetch_all_profiles(usernames):
    # For this legacy function, we need to create a BulkProcessor
    # and manage its results similarly to the main endpoint if we want full compatibility.
    # Note: This doesn't reset global stats like the endpoint does.
    processor = BulkProcessor(total_tasks=len(usernames))
    
    batch_size = APIConfig.BATCH_SIZE
    for i in range(0, len(usernames), batch_size):
        batch = usernames[i:i + batch_size]
        process_batch_intelligent(batch, processor) # Populates processor.results
    
    return processor.get_results()


# Graceful shutdown handling
def signal_handler(sig, frame):
    logger.info("Graceful shutdown initiated...")
    state.close_session() # Close the shared session
    logger.info("All resources cleaned up. Exiting.")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Memory optimization/Cache cleaning (periodic)
# This is already in place and reasonable.
_last_cache_cleanup_time = time.time()
CACHE_CLEANUP_INTERVAL = 300 # 5 minutes

@app.before_request
def periodic_cache_cleanup():
    global _last_cache_cleanup_time
    current_time = time.time()
    if current_time - _last_cache_cleanup_time > CACHE_CLEANUP_INTERVAL:
        with state.lock:
            expired_keys = [
                key for key, timestamp in state.cache_timestamps.items()
                if current_time - timestamp > APIConfig.CACHE_DURATION
            ]
            if expired_keys:
                for key in expired_keys:
                    state.cache.pop(key, None)
                    state.cache_timestamps.pop(key, None)
                logger.info(f"Periodic cache cleanup: Removed {len(expired_keys)} expired entries.")
        _last_cache_cleanup_time = current_time


if __name__ == '__main__':
    logger.info("Starting CodeChef API Service with enhanced optimizations")
    logger.info(f"API Config: Max Concurrent Requests={APIConfig.MAX_CONCURRENT_REQUESTS}, "
                f"Batch Size={APIConfig.BATCH_SIZE}, Rate Limit={APIConfig.RATE_LIMIT_PER_SECOND} RPS, "
                f"Request Timeout={APIConfig.REQUEST_TIMEOUT}s, Max Retries={APIConfig.MAX_RETRIES}")
    
    # For production/better performance on Windows (and other OS), use Waitress:
    # from waitress import serve
    # logger.info("Serving on http://0.0.0.0:5000 with Waitress")
    # serve(app, host='0.0.0.0', port=5000, threads=APIConfig.MAX_CONCURRENT_REQUESTS * 2) # Waitress threads are different
    
    # Using Flask's built-in server for development/simplicity:
    """app.run(
        debug=False,
        host='0.0.0.0',
        port=5000,
        threaded=True, # Flask's built-in server uses one thread per request if threaded=True
        use_reloader=False
    )"""
    #above will be used when testing locally but for production we will use Railway's port below 
    app.run(
    debug=False,
    host='0.0.0.0',
    port=int(os.environ.get('PORT', 5000)),  # use Railway port or fallback to 5000 locally
    threaded=True,
    use_reloader=False
)
