/**
 * CodeChef Bulk Search Manager
 * 
 * This utility manages parallel bulk searching of CodeChef profiles with rate limiting.
 * It splits usernames across multiple API endpoints to speed up processing while
 * maintaining delays to avoid getting blocked by CodeChef.
 * 
 * Features:
 * - Parallel processing across N API endpoints
 * - Configurable delay between requests (default: 1.5 seconds)
 * - Progress tracking for each worker
 * - Error handling and retry logic
 * - Easy configuration of number of parallel workers
 */

import axios from 'axios';
import { CONFIG } from './codechefBulkConfig';

// ============================================================================
// CONFIGURATION - Now loaded from codechefBulkConfig.js
// ============================================================================

const NUM_WORKERS = CONFIG.NUM_WORKERS;
const DELAY_BETWEEN_REQUESTS = CONFIG.DELAY_BETWEEN_REQUESTS;
const MAX_RETRIES = CONFIG.MAX_RETRIES;
const RETRY_DELAY = CONFIG.RETRY_DELAY;
const REQUEST_TIMEOUT = CONFIG.REQUEST_TIMEOUT;
const VERBOSE_LOGGING = CONFIG.VERBOSE_LOGGING;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get API URLs from environment variables based on NUM_WORKERS
 * @param {boolean} isProduction - Whether running in production mode
 * @returns {Array<string>} Array of API URLs
 */
const getApiUrls = (isProduction) => {
  const urls = [];
  
  for (let i = 1; i <= NUM_WORKERS; i++) {
    const envKey = isProduction 
      ? `VITE_CODECHEF_API_URL_${i}_PROD`
      : `VITE_CODECHEF_API_URL_${i}_DEV`;
    
    const url = import.meta.env[envKey];
    
    if (!url) {
      console.warn(`⚠️ Missing environment variable: ${envKey}`);
      console.warn(`Using fallback URL for worker ${i}`);
      // Fallback to default API if specific worker URL is not found
      const fallbackKey = isProduction 
        ? 'VITE_CODECHEF_API_URL_PROD'
        : 'VITE_CODECHEF_API_URL_DEV';
      urls.push(import.meta.env[fallbackKey]);
    } else {
      urls.push(url);
    }
  }
  
  return urls;
};

/**
 * Delay/sleep function using Promises
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after specified delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch single user data with retry logic
 * @param {string} username - CodeChef username
 * @param {string} apiUrl - API endpoint URL
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<Object>} User data object
 */
const fetchUserWithRetry = async (username, apiUrl, retryCount = 0) => {
  try {
    const response = await axios.get(`${apiUrl}?username=${encodeURIComponent(username)}`, {
      timeout: REQUEST_TIMEOUT
    });
    return { username, ...response.data, success: true };
  } catch (err) {
    if (VERBOSE_LOGGING) {
      console.error(`❌ Error fetching ${username} (Attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, err.message);
    }
    
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      if (VERBOSE_LOGGING) {
        console.log(`🔄 Retrying ${username} after ${RETRY_DELAY}ms...`);
      }
      await delay(RETRY_DELAY);
      return fetchUserWithRetry(username, apiUrl, retryCount + 1);
    }
    
    // Return error object after all retries exhausted
    return { 
      username, 
      error: err.response?.data?.error || err.message || 'Failed to fetch data',
      success: false
    };
  }
};

// ============================================================================
// WORKER FUNCTION
// ============================================================================

/**
 * Worker function that processes a batch of usernames
 * Each worker operates independently with its own API endpoint
 * 
 * @param {Array<string>} usernames - Array of usernames to process
 * @param {string} apiUrl - API endpoint URL for this worker
 * @param {number} workerId - Worker identifier (1-based)
 * @param {Function} onProgress - Callback function for progress updates
 * @returns {Promise<Array<Object>>} Array of user data objects
 */
const worker = async (usernames, apiUrl, workerId, onProgress) => {
  const results = [];
  const totalUsers = usernames.length;
  
  if (VERBOSE_LOGGING) {
    console.log(`🚀 Worker ${workerId} started: Processing ${totalUsers} users`);
    console.log(`📍 Worker ${workerId} API: ${apiUrl}`);
  }
  
  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    
    if (VERBOSE_LOGGING) {
      console.log(`⏳ Worker ${workerId}: Fetching [${i + 1}/${totalUsers}] - ${username}`);
    }
    
    // Fetch user data with retry logic
    const userData = await fetchUserWithRetry(username, apiUrl);
    results.push(userData);
    
    // Report progress
    if (onProgress) {
      onProgress({
        workerId,
        completed: i + 1,
        total: totalUsers,
        currentUsername: username,
        success: userData.success
      });
    }
    
    // Add delay between requests (except for the last request)
    if (i < usernames.length - 1) {
      if (VERBOSE_LOGGING) {
        console.log(`⏸️ Worker ${workerId}: Waiting ${DELAY_BETWEEN_REQUESTS}ms before next request...`);
      }
      await delay(DELAY_BETWEEN_REQUESTS);
    }
  }
  
  if (VERBOSE_LOGGING) {
    console.log(`✅ Worker ${workerId} completed: ${results.filter(r => r.success).length}/${totalUsers} successful`);
  }
  return results;
};

// ============================================================================
// MAIN BULK SEARCH FUNCTION
// ============================================================================

/**
 * Distribute usernames evenly across N workers
 * @param {Array<string>} usernames - All usernames to process
 * @returns {Array<Array<string>>} Array of username batches
 */
const distributeUsernames = (usernames) => {
  const batches = Array.from({ length: NUM_WORKERS }, () => []);
  
  // Distribute usernames in round-robin fashion for balanced load
  usernames.forEach((username, index) => {
    const workerIndex = index % NUM_WORKERS;
    batches[workerIndex].push(username);
  });
  
  return batches;
};

/**
 * Main function to perform bulk search across multiple workers
 * 
 * @param {Array<string>} usernames - Array of CodeChef usernames
 * @param {Function} onProgress - Optional callback for progress updates
 *   Receives: { workerId, completed, total, currentUsername, success }
 * @param {Function} onOverallProgress - Optional callback for overall progress
 *   Receives: { completedTotal, totalCount, percentage }
 * @returns {Promise<Array<Object>>} Array of all user data
 * 
 * @example
 * const results = await codechefBulkSearch(
 *   ['user1', 'user2', 'user3', ...],
 *   (progress) => console.log(`Worker ${progress.workerId}: ${progress.completed}/${progress.total}`),
 *   (overall) => console.log(`Overall: ${overall.percentage}% complete`)
 * );
 */
export const codechefBulkSearch = async (usernames, onProgress, onOverallProgress) => {
  const IS_PRODUCTION = import.meta.env.PROD;
  const startTime = Date.now();
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎯 CodeChef Bulk Search Started');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 Total usernames: ${usernames.length}`);
  console.log(`👷 Number of workers: ${NUM_WORKERS}`);
  console.log(`⏱️ Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log(`🌍 Environment: ${IS_PRODUCTION ? 'Production' : 'Development'}`);
  console.log('═══════════════════════════════════════════════════════');
  
  // Get API URLs for all workers
  const apiUrls = getApiUrls(IS_PRODUCTION);
  console.log('📍 API Endpoints:', apiUrls);
  
  // Distribute usernames across workers
  const usernameBatches = distributeUsernames(usernames);
  
  // Log distribution
  usernameBatches.forEach((batch, index) => {
    console.log(`👷 Worker ${index + 1}: ${batch.length} users`);
  });
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Track overall progress
  let completedCount = 0;
  const totalCount = usernames.length;
  
  // Create progress wrapper to track overall progress
  const progressWrapper = (progressData) => {
    completedCount++;
    
    // Call individual progress callback
    if (onProgress) {
      onProgress(progressData);
    }
    
    // Call overall progress callback
    if (onOverallProgress) {
      onOverallProgress({
        completedTotal: completedCount,
        totalCount: totalCount,
        percentage: Math.round((completedCount / totalCount) * 100)
      });
    }
  };
  
  // Start all workers in parallel
  const workerPromises = usernameBatches.map((batch, index) => 
    worker(batch, apiUrls[index], index + 1, progressWrapper)
  );
  
  // Wait for all workers to complete
  const workerResults = await Promise.all(workerPromises);
  
  // Flatten results from all workers
  const allResults = workerResults.flat();
  
  // Calculate statistics
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  const successCount = allResults.filter(r => r.success).length;
  const errorCount = allResults.filter(r => !r.success).length;
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✨ CodeChef Bulk Search Completed');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${errorCount}/${totalCount}`);
  console.log(`⏱️ Total time: ${totalTime} seconds`);
  console.log(`⚡ Average time per user: ${(totalTime / totalCount).toFixed(2)} seconds`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  return allResults;
};

// ============================================================================
// EXPORT CONFIGURATION (for external access/modification)
// ============================================================================

/**
 * Get current configuration
 * @returns {Object} Current configuration object
 */
export const getConfig = () => ({
  numWorkers: NUM_WORKERS,
  delayBetweenRequests: DELAY_BETWEEN_REQUESTS,
  maxRetries: MAX_RETRIES,
  retryDelay: RETRY_DELAY
});

/**
 * Export default
 */
export default {
  codechefBulkSearch,
  getConfig
};
