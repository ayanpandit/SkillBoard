// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const stream = require('stream');
const pLimit = require('p-limit'); // Ensure p-limit@^3.1.0 is in package.json and installed
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// If deployed behind a proxy like Railway, Heroku, etc., this helps req.ip get the correct client IP
// For local testing, it might not be strictly necessary.
app.set('trust proxy', 1);



// --- Configuration ---
const APIConfig = {
    MAX_CONCURRENT_API_CALLS: 50, // Max parallel calls to external CodeChef APIs.
                                  // Tune based on external API tolerance & server resources.
    PROCESSING_BATCH_SIZE: 100,   // How many usernames to group for internal batch processing loop.
                                  // Does not directly dictate API concurrency (p-limit does that).
    REQUEST_TIMEOUT: 10000,       // 10 seconds for each HTTP request
    MAX_RETRIES: 5,               // Max retries for a failing request to a single user
    RETRY_DELAY_MS: 100,          // Initial retry delay, will be increased by backoff
    // RATE_LIMIT_PER_SECOND is the target for our server's requests to the external API.
    // It's a best-effort rate limit. If MAX_CONCURRENT_API_CALLS is high and API calls are very fast,
    // the actual RPS could temporarily exceed this. It's a delicate balance.
    // Set this based on known/estimated limits of the target API. 100 might be too aggressive
    // for an unofficial proxy; 10-25 might be safer.
    RATE_LIMIT_PER_SECOND: 50,    // Target max outgoing requests per second to CodeChef API (more conservative)
    CACHE_DURATION_MS: 600 * 1000, // 10 minutes
    BACKOFF_FACTOR: 1.5,          // Increased backoff for more spacing on retries
    CIRCUIT_BREAKER_THRESHOLD: 10, // Lowered threshold to trip circuit breaker sooner
};

// --- Global State ---
const globalState = {
    cache: new Map(),
    cacheTimestamps: new Map(),
    circuitBreaker: {},
    requestTimestamps: [], // For outgoing rate limiting
    axiosInstance: null,
    _axiosInstancePromise: null, // To handle concurrent requests for instance creation

    getAxiosInstance: async function() { // Made async to handle promise
        if (this.axiosInstance) {
            return this.axiosInstance;
        }
        if (this._axiosInstancePromise) {
            return this._axiosInstancePromise; // Return existing promise if creation is in progress
        }

        // Create a promise that will resolve with the instance
        this._axiosInstancePromise = (async () => {
            try {
                const http = require('http');
                const https = require('https');
                const httpAgent = new http.Agent({ keepAlive: true, maxSockets: APIConfig.MAX_CONCURRENT_API_CALLS + 5, keepAliveMsecs: 5000 }); // Slightly more sockets for agent
                const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: APIConfig.MAX_CONCURRENT_API_CALLS + 5, keepAliveMsecs: 5000 });

                const instance = axios.create({
                    httpAgent,
                    httpsAgent,
                    headers: {
                        'User-Agent': 'CodeChef-Analyzer-Node/1.1', // Updated version
                        'Connection': 'keep-alive', // Handled by agent
                        'Accept-Encoding': 'gzip, deflate',
                    },
                });
                logger.info(`Axios instance created with maxSockets (agent)=${APIConfig.MAX_CONCURRENT_API_CALLS + 5}`);
                this.axiosInstance = instance;
                return instance;
            } catch (err) {
                logger.error('Failed to create Axios instance', err);
                this._axiosInstancePromise = null; // Reset promise on failure to allow retry
                throw err; // Re-throw error
            }
        })();
        return this._axiosInstancePromise;
    },
    // ... (isCached, getCache, setCache, stats methods remain mostly the same) ...
    isCached: function(username) {
        if (this.cache.has(username)) {
            if (Date.now() - (this.cacheTimestamps.get(username) || 0) < APIConfig.CACHE_DURATION_MS) {
                return true;
            } else {
                this.cache.delete(username);
                this.cacheTimestamps.delete(username);
                logger.debug(`Cache expired and removed for ${username}`);
            }
        }
        return false;
    },
    getCache: function(username) { return this.cache.get(username); },
    setCache: function(username, data) {
        this.cache.set(username, data);
        this.cacheTimestamps.set(username, Date.now());
    },
    successCount: 0,
    errorCount: 0,
    totalProcessed: 0,
    resetPerRequestStats: function() {
        this.successCount = 0;
        this.errorCount = 0;
        this.totalProcessed = 0;
    },
    incrementStats: function(success) {
        this.totalProcessed++;
        if (success) this.successCount++;
        else this.errorCount++;
    },
    shouldCircuitBreak: function(apiEndpoint) {
        return (this.circuitBreaker[apiEndpoint] || 0) >= APIConfig.CIRCUIT_BREAKER_THRESHOLD;
    },
    recordFailure: function(apiEndpoint) {
        this.circuitBreaker[apiEndpoint] = (this.circuitBreaker[apiEndpoint] || 0) + 1;
        logger.warn(`Circuit breaker for ${apiEndpoint} count: ${this.circuitBreaker[apiEndpoint]}/${APIConfig.CIRCUIT_BREAKER_THRESHOLD}`);
        if (this.circuitBreaker[apiEndpoint] >= APIConfig.CIRCUIT_BREAKER_THRESHOLD) {
            logger.error(`CIRCUIT BREAKER TRIPPED for ${apiEndpoint}! Further requests blocked for a while.`);
            // Implement a timeout for the circuit breaker to reset
            setTimeout(() => {
                this.circuitBreaker[apiEndpoint] = 0;
                logger.info(`Circuit breaker for ${apiEndpoint} RESET after timeout.`);
            }, 60000); // Reset after 1 minute
        }
    },
    recordSuccess: function(apiEndpoint) {
        // Gradual recovery for circuit breaker
        if (this.circuitBreaker[apiEndpoint] > 0) {
            this.circuitBreaker[apiEndpoint] = Math.max(0, this.circuitBreaker[apiEndpoint] - 0.5); // Slower recovery
            if (this.circuitBreaker[apiEndpoint] < APIConfig.CIRCUIT_BREAKER_THRESHOLD / 2) { // Fully reset if significantly recovered
                 this.circuitBreaker[apiEndpoint] = 0;
            }
            logger.debug(`Circuit breaker for ${apiEndpoint} count: ${this.circuitBreaker[apiEndpoint].toFixed(1)}`);
        }
    },
    canProceedOutgoing: function() {
        const currentTime = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter(ts => currentTime - ts <= 1000); // Keep timestamps from last second

        if (this.requestTimestamps.length < APIConfig.RATE_LIMIT_PER_SECOND) {
            this.requestTimestamps.push(currentTime);
            return true;
        }
        return false;
    },
    waitIfNeededOutgoing: async function() {
        while (!this.canProceedOutgoing()) {
            let timeToWait = 10; // Default small wait
            if (this.requestTimestamps.length >= APIConfig.RATE_LIMIT_PER_SECOND) {
                 // Wait until the oldest request in the window is older than 1s
                timeToWait = Math.max(10, 1000 - (Date.now() - this.requestTimestamps[0]) + 10);
            }
            await new Promise(resolve => setTimeout(resolve, timeToWait));
        }
    }
};

// --- Logger ---
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => {
        // Log full error object if available, for more details (e.g., stack trace)
        if (error && error.stack) {
            console.error(`[ERROR] ${new Date().toISOString()} - ${message} - Details: ${error.message}\nStack: ${error.stack}`);
        } else if (error) {
            console.error(`[ERROR] ${new Date().toISOString()} - ${message} - Details: ${JSON.stringify(error)}`);
        } else {
            console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
        }
    },
    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
        }
    },
};

// --- CORS Configuration ---
const allowedOrigins = [
    "https://codechefprofileanalyzerbackendnode.onrender.com",
    "http://localhost:5173", // Your React dev server
    // Add any other origins you need
];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`CORS: Blocked origin - ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json()); // For parsing application/json

// --- Smart Retry Handler ---
const SmartRetryHandler = {
    shouldRetry: (error, attempt) => { // Now takes the full error object
        if (attempt >= APIConfig.MAX_RETRIES) return false;

        // Network errors or specific server errors
        if (error.isAxiosError) {
            if (error.response) { // HTTP error
                const retryCodes = [408, 429, 500, 502, 503, 504]; // Retry these status codes
                return retryCodes.includes(error.response.status);
            } else if (error.request) { // Request made but no response received (network error, timeout)
                return true; // Retry network errors and timeouts
            }
        }
        // Could also check for specific error codes like 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'
        if (error.code && ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ENOTFOUND', 'EAI_AGAIN'].includes(error.code)) {
            return true;
        }
        return false; // Don't retry other types of errors by default
    },
    getRetryDelay: (attempt) => {
        // Exponential backoff with jitter and a cap
        const jitter = Math.random() * (APIConfig.RETRY_DELAY_MS * 0.2); // Add up to 20% jitter
        return Math.min(
            (APIConfig.RETRY_DELAY_MS * (APIConfig.BACKOFF_FACTOR ** attempt)) + jitter,
            5000 // Max delay 5 seconds
        );
    }
};

// --- Core Profile Fetching Logic ---
async function fetchProfileOptimized(username, processorSharedState) {
    const requestIPForLog = processorSharedState.requestIP || 'N/A'; // Get IP from shared state if passed
    if (globalState.isCached(username)) {
        const cachedResult = globalState.getCache(username);
        processorSharedState.incrementStats(true);
        logger.debug(`[${requestIPForLog}] CACHE HIT for ${username}`);
        return cachedResult;
    }
    logger.debug(`[${requestIPForLog}] CACHE MISS for ${username}. Fetching...`);

    const apiEndpointName = "codechef-proxy"; // More generic name for circuit breaker
    if (globalState.shouldCircuitBreak(apiEndpointName)) {
        logger.warn(`[${requestIPForLog}] CIRCUIT OPEN for ${apiEndpointName}, failing fast for ${username}`);
        const result = { username, status: "error", message: "Service temporarily unavailable (Circuit Breaker Open)" };
        processorSharedState.incrementStats(false);
        return result;
    }

    const apiUrls = [
        `https://codechef-api.vercel.app/handle/${username}`,
        `https://codechef-api-backup.vercel.app/handle/${username}`,
    ];
    
    let axiosInstance;
    try {
        axiosInstance = await globalState.getAxiosInstance();
    } catch (initError) {
        logger.error(`[${requestIPForLog}] Failed to get/create Axios instance for ${username}`, initError);
        const result = { username, status: "error", message: "Internal server error (Axios init failed)" };
        processorSharedState.incrementStats(false);
        return result;
    }

    let lastError = null;

    for (let attempt = 0; attempt < APIConfig.MAX_RETRIES; attempt++) {
        for (const apiUrl of apiUrls) {
            try {
                await globalState.waitIfNeededOutgoing(); // Adhere to outgoing rate limit
                logger.debug(`[${requestIPForLog}] Attempt ${attempt + 1}, URL: ${apiUrl} for ${username}`);

                const response = await axiosInstance.get(apiUrl, {
                    timeout: APIConfig.REQUEST_TIMEOUT,
                    // validateStatus: function (status) { // Consider handling all statuses and checking data
                    //   return status >= 200 && status < 500; // Don't throw for 4xx, check manually
                    // }
                });

                // Check for 200 OK and valid data
                if (response.status === 200 && response.data && typeof response.data === 'object') {
                    let data = response.data;
                    
                    // Check if API returned a success=false or error message in data despite 200 OK
                    if (data.success === false || data.status === 'error' || data.error) {
                        const apiErrorMessage = data.message || data.error || "API returned success:false";
                        logger.warn(`[${requestIPForLog}] API ${apiUrl} returned 200 OK but with error for ${username}: ${apiErrorMessage}. Body: ${JSON.stringify(data).substring(0,100)}`);
                        lastError = new Error(apiErrorMessage); // Treat as an error for retry
                        // Don't retry this specific URL *if the error seems definitive*
                        if (apiErrorMessage.toLowerCase().includes("user not found") || response.status === 404) {
                             const result = { username, status: "error", message: "User not found" };
                             processorSharedState.incrementStats(false); // Still an error for this user.
                             globalState.recordSuccess(apiEndpointName); // The API itself worked, just user not found.
                             return result;
                        }
                        continue; // Try next URL or let SmartRetryHandler decide if we loop again
                    }

                    // Add derived fields
                    data.contestsGiven = Array.isArray(data.ratingData) ? data.ratingData.length : 0;
                    if (data.currentRating === undefined) data.currentRating = 0;
                    if (data.highestRating === undefined) data.highestRating = data.currentRating || 0;
                    if (data.globalRank === undefined) data.globalRank = "N/A";
                    if (data.countryRank === undefined) data.countryRank = "N/A";
                    if (data.stars === undefined) {
                        const rating = data.currentRating || 0;
                        if (rating < 1400) data.stars = "1"; else if (rating < 1600) data.stars = "2";
                        else if (rating < 1800) data.stars = "3"; else if (rating < 2000) data.stars = "4";
                        else if (rating < 2200) data.stars = "5"; else if (rating < 2500) data.stars = "6";
                        else data.stars = "7";
                    }
                    
                    const result = { username, status: "success", data };
                    globalState.setCache(username, result);
                    globalState.recordSuccess(apiEndpointName);
                    processorSharedState.incrementStats(true);
                    logger.info(`[${requestIPForLog}] SUCCESS for ${username} from ${apiUrl} (attempt ${attempt+1})`);
                    return result;
                } else if (response.status === 404) { // Explicit 404
                     logger.info(`[${requestIPForLog}] User ${username} not found (404) from ${apiUrl}.`);
                     const result = { username, status: "error", message: "User not found" };
                     processorSharedState.incrementStats(false);
                     globalState.recordSuccess(apiEndpointName); // API is working
                     return result; // Definitively not found
                } else {
                    // Other non-200 status codes that weren't caught by Axios error
                    logger.warn(`[${requestIPForLog}] Unexpected status ${response.status} for ${username} from ${apiUrl}. Body: ${JSON.stringify(response.data).substring(0,200)}`);
                    lastError = new Error(`Unexpected status: ${response.status}`);
                }

            } catch (error) {
                lastError = error; // Store the most recent error
                const errorDetail = error.isAxiosError ? 
                    (error.response ? `status ${error.response.status}, data: ${JSON.stringify(error.response.data).substring(0,100)}` : `code ${error.code}, no response`) :
                    `code ${error.code || 'N/A'}, ${error.message}`;
                logger.warn(`[${requestIPForLog}] FAILED attempt ${attempt + 1} for ${username} from ${apiUrl}. Error: ${errorDetail}`);
                
                if (error.response && error.response.status === 404) {
                    logger.info(`[${requestIPForLog}] User ${username} not found (404 caught in error) from ${apiUrl}.`);
                    const result = { username, status: "error", message: "User not found" };
                    processorSharedState.incrementStats(false);
                    globalState.recordSuccess(apiEndpointName);
                    return result;
                }
                // The decision to break the inner loop (apiUrls) or continue is implicit.
                // If shouldRetry is false for this error, we'll naturally try the next URL or end attempts.
            }
        } // End of iterating apiUrls for one attempt

        // After trying all URLs for the current attempt, check if we should retry the whole attempt.
        if (lastError && SmartRetryHandler.shouldRetry(lastError, attempt)) {
            const delay = SmartRetryHandler.getRetryDelay(attempt);
            logger.info(`[${requestIPForLog}] All URLs failed for ${username} on attempt ${attempt + 1}. Retrying after ${delay.toFixed(0)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        } else if (lastError) { // Non-retryable error or max retries for attempts reached
            logger.warn(`[${requestIPForLog}] Exhausted retries or non-retryable error for ${username} after attempt ${attempt+1}. Last error: ${lastError.message}`);
            break; // Break from the outer attempts loop
        }
        // If no error in the last attempt (e.g. user not found from all URLs), it would have returned already.
    } // End of retries (attempts loop)

    // If loop finishes, it means all attempts/URLs failed for a retryable reason, or it broke due to non-retryable.
    globalState.recordFailure(apiEndpointName);
    const finalErrorMessage = lastError ? `All attempts failed. Last error: ${lastError.message}` : "All attempts failed (unknown reason)";
    const result = { username, status: "error", message: finalErrorMessage };
    processorSharedState.incrementStats(false);
    logger.error(`[${requestIPForLog}] FINAL FAILURE for ${username}: ${finalErrorMessage}`);
    return result;
}

// --- Concurrency Control ---
const limit = pLimit(APIConfig.MAX_CONCURRENT_API_CALLS);

// --- Batch Processing ---
// processorSharedState now includes requestIP for better logging context
async function processSingleBatch(usernamesInBatch, processorSharedState) {
    const tasks = usernamesInBatch.map(username => 
        limit(() => fetchProfileOptimized(username, processorSharedState))
    );
    // Promise.all will collect results. Errors are handled within fetchProfileOptimized to always return a status object.
    return Promise.all(tasks);
}


// --- Routes ---
app.get('/health', (req, res) => {
    res.json({
        status: "healthy",
        message: "CodeChef API Service (Node.js) is running",
        config: {
             maxConcurrentApiCalls: APIConfig.MAX_CONCURRENT_API_CALLS,
             targetRateLimitRps: APIConfig.RATE_LIMIT_PER_SECOND,
             processingBatchSize: APIConfig.PROCESSING_BATCH_SIZE,
             cacheDurationSec: APIConfig.CACHE_DURATION_MS / 1000
        },
        stats: {
            cacheSize: globalState.cache.size,
            circuitBreakers: globalState.circuitBreaker,
            currentOutgoingRPSWindowSize: globalState.requestTimestamps.length
        }
    });
});

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || 
            file.mimetype === 'application/vnd.ms-excel' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true);
        } else {
            logger.warn(`[${req.ip}] Multer: Rejected file upload. Type: ${file.mimetype}, Name: ${file.originalname}`);
            cb(new Error('Unsupported file format. Please upload CSV or Excel file.'), false);
        }
    }
});

app.post('/fetch-profiles', upload.single('file'), async (req, res) => {
    const requestIP = req.ip || req.connection?.remoteAddress || 'Unknown IP';
    const requestStartTime = Date.now();

    logger.info(`[${requestIP}] Received /fetch-profiles request. File: ${req.file ? req.file.originalname : 'No file'}`);

    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    // Create a shared state for this specific request, including its IP for logging
    const perRequestSharedState = {
        successCount: 0,
        errorCount: 0,
        totalProcessed: 0,
        incrementStats: function(success) {
            this.totalProcessed++;
            if (success) this.successCount++;
            else this.errorCount++;
        },
        requestIP: requestIP // Pass IP for logging context in deeper functions
    };


    let usernamesRaw = [];
    let uniqueUsernames = [];

    try {
        const fileBuffer = req.file.buffer;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase().trim();

        logger.info(`[${requestIP}] Parsing file: ${req.file.originalname}, type: ${fileExtension}`);
        if (fileExtension === 'csv') {
            const bufferStream = new stream.PassThrough();
            bufferStream.end(fileBuffer);
            await new Promise((resolve, reject) => {
                bufferStream
                    .pipe(csv({ headers: false, skipLines: 0, mapValues: ({ value }) => String(value || "").trim() }))
                    .on('data', (row) => {
                        if (row[0]) usernamesRaw.push(row[0]);
                     })
                    .on('end', () => { logger.debug(`[${requestIP}] CSV parsing finished.`); resolve();})
                    .on('error', (err) => {logger.error(`[${requestIP}] CSV parsing error`, err); reject(err);});
            });
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                logger.warn(`[${requestIP}] Excel file ${req.file.originalname} has no sheets.`);
                return res.status(400).json({ error: "Excel file contains no sheets." });
            }
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
             if (!worksheet) {
                logger.warn(`[${requestIP}] First sheet in ${req.file.originalname} is empty or unreadable.`);
                return res.status(400).json({ error: "First sheet in Excel file is empty or unreadable." });
            }
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            usernamesRaw = jsonData.map(row => String(row[0] || "").trim()).filter(u => u);
            logger.debug(`[${requestIP}] Excel parsing finished.`);
        } else {
            logger.warn(`[${requestIP}] Unsupported file format: ${fileExtension}`);
            return res.status(400).json({ error: "Unsupported file format. Please upload CSV or Excel file" });
        }

        if (usernamesRaw.length === 0) {
            logger.warn(`[${requestIP}] No usernames found in the file ${req.file.originalname}.`);
            return res.status(400).json({ error: "No usernames found in the file or file is empty" });
        }
        logger.info(`[${requestIP}] Raw usernames parsed: ${usernamesRaw.length}`);

        // Deduplicate and filter out common invalid entries
        uniqueUsernames = [...new Set(usernamesRaw.filter(u => u && u.toLowerCase() !== 'nan' && u.toLowerCase() !== 'none' && u.length > 0 && u.length < 50))]; // Added length sanity check

        if (uniqueUsernames.length === 0) {
            logger.warn(`[${requestIP}] No valid unique usernames after filtering from ${req.file.originalname}.`);
            return res.status(400).json({ error: "No valid usernames found in the first column of the file" });
        }
        logger.info(`[${requestIP}] Starting bulk processing for ${uniqueUsernames.length} unique usernames. External API target RPS: ${APIConfig.RATE_LIMIT_PER_SECOND}, Max Concurrent External Calls: ${APIConfig.MAX_CONCURRENT_API_CALLS}.`);
        // Warn about unrealistic expectations for 100k/sec
        if (uniqueUsernames.length > 10000) {
            logger.warn(`[${requestIP}] Large request: ${uniqueUsernames.length} users. Processing will take time. Target of 100k users/sec is dependent on external API capacity and unlikely to be achieved.`);
        }
        
        const allResults = [];
        // PROCESSING_BATCH_SIZE is for the outer loop here, actual concurrency controlled by p-limit
        const internalProcessingBatchSize = APIConfig.PROCESSING_BATCH_SIZE;

        for (let i = 0; i < uniqueUsernames.length; i += internalProcessingBatchSize) {
            const batchUsernamesSlice = uniqueUsernames.slice(i, i + internalProcessingBatchSize);
            const batchNumber = Math.floor(i / internalProcessingBatchSize) + 1;
            const totalBatches = Math.ceil(uniqueUsernames.length / internalProcessingBatchSize);
            const batchStartTime = Date.now();
            
            logger.info(`[${requestIP}] Processing internal batch ${batchNumber}/${totalBatches} (${batchUsernamesSlice.length} usernames)`);
            
            const batchResults = await processSingleBatch(batchUsernamesSlice, perRequestSharedState); // Pass per-request state
            allResults.push(...batchResults);

            const batchElapsedTimeMs = Date.now() - batchStartTime;
            logger.info(`[${requestIP}] Internal batch ${batchNumber} completed in ${(batchElapsedTimeMs / 1000).toFixed(2)}s. Processed ${perRequestSharedState.totalProcessed}/${uniqueUsernames.length} for this request.`);
            
            // Small pause between internal processing batches if needed, helps a bit with logging flow
            if (i + internalProcessingBatchSize < uniqueUsernames.length) {
                await new Promise(resolve => setTimeout(resolve, 75)); 
            }
        }

        const requestTotalTimeMs = Date.now() - requestStartTime;
        logger.info(`[${requestIP}] === BULK PROCESSING COMPLETE ===
                     Unique Usernames: ${uniqueUsernames.length}
                     Total Results Returned: ${allResults.length}
                     Successfully Fetched: ${perRequestSharedState.successCount}
                     Errors/Not Found: ${perRequestSharedState.errorCount}
                     Total Time: ${(requestTotalTimeMs / 1000).toFixed(2)}s
                     Overall Rate: ${(allResults.length / Math.max(requestTotalTimeMs / 1000, 0.001)).toFixed(1)} profiles/sec (Note: heavily dependent on external API performance)`);
        
        res.json(allResults);

    } catch (error) {
        logger.error(`[${requestIP}] CRITICAL ERROR in /fetch-profiles endpoint for file ${req.file?.originalname || 'N/A'}`, error);
        // Try to provide a meaningful error count if processing failed mid-way
        const totalToAccountFor = uniqueUsernames.length > 0 ? uniqueUsernames.length : usernamesRaw.length;
        if (totalToAccountFor > perRequestSharedState.totalProcessed && perRequestSharedState.errorCount + perRequestSharedState.successCount < totalToAccountFor) {
            perRequestSharedState.errorCount = totalToAccountFor - perRequestSharedState.successCount;
        }
        res.status(500).json({ error: `An unexpected server error occurred: ${error.message}. Processed: ${perRequestSharedState.totalProcessed}, Success: ${perRequestSharedState.successCount}, Errors: ${perRequestSharedState.errorCount}` });
    }
});

app.get('/fetch-profile', async (req, res) => {
    const requestIP = req.ip || req.connection?.remoteAddress || 'Unknown IP';
    const username = req.query.username ? String(req.query.username).trim() : '';

    logger.info(`[${requestIP}] Received /fetch-profile request for username: '${username}'`);

    if (!username) {
        logger.warn(`[${requestIP}] No username provided for /fetch-profile.`);
        return res.status(400).json({ status: "error", message: "No username provided" });
    }
     if (username.length > 50) { // Basic sanity check
        logger.warn(`[${requestIP}] Invalid username format for /fetch-profile: ${username}`);
        return res.status(400).json({ status: "error", message: "Username too long." });
    }

    const singleCallSharedState = { 
        successCount:0, errorCount:0, totalProcessed:0, 
        incrementStats: function(s) {this.totalProcessed++; if(s)this.successCount++; else this.errorCount++;},
        requestIP: requestIP
    };

    try {
        const result = await limit(() => fetchProfileOptimized(username, singleCallSharedState));
        res.json(result);
    } catch (error) {
        logger.error(`[${requestIP}] Error in /fetch-profile for ${username}`, error);
        res.status(500).json({ username, status: "error", message: "Server error processing single profile." });
    }
});

// --- Periodic Cache Cleanup ---
let lastCacheCleanupTime = Date.now();
const CACHE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
    const currentTime = Date.now();
    if (currentTime - lastCacheCleanupTime > CACHE_CLEANUP_INTERVAL_MS) {
        let expiredCount = 0;
        logger.debug("Running periodic cache cleanup...");
        for (const [key, timestamp] of globalState.cacheTimestamps.entries()) {
            if (currentTime - timestamp > APIConfig.CACHE_DURATION_MS) {
                globalState.cache.delete(key);
                globalState.cacheTimestamps.delete(key);
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            logger.info(`Periodic cache cleanup: Removed ${expiredCount} expired entries. Cache size: ${globalState.cache.size}`);
        } else {
            logger.debug("Periodic cache cleanup: No entries expired.");
        }
        lastCacheCleanupTime = currentTime;
        // Also, try to hint GC for memory, though V8 usually manages this well.
        if (typeof global.gc === 'function') {
            logger.debug("Triggering manual garbage collection hint.");
            global.gc();
        }
    }
}, 60000); // Check every minute

// --- Graceful Shutdown ---
function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Graceful shutdown initiated...`);
    if (server) {
        server.close((err) => {
            if (err) {
                logger.error('Error during server close:', err);
                process.exit(1);
            }
            logger.info("HTTP server closed. All resources should be cleaned up. Exiting.");
            process.exit(0);
        });
    } else {
         process.exit(0); // If server wasn't started yet
    }

    // Force exit after a timeout if server.close() hangs
    setTimeout(() => {
        logger.error("Could not close connections in time, forcefully shutting down");
        process.exit(1);
    }, 15000); // 15 seconds
}

let server; // Define server variable in a broader scope

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C

// --- Start Server ---
(async () => {
    try {
        await globalState.getAxiosInstance(); // Initialize axios instance at startup
        server = app.listen(port, '0.0.0.0', () => {
            logger.info(`🚀 CodeChef API Service (Node.js) started on port ${port}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`API Config: Max Concurrent External Calls=${APIConfig.MAX_CONCURRENT_API_CALLS}, External Target RPS=${APIConfig.RATE_LIMIT_PER_SECOND}`);
        });
    } catch (error) {
        logger.error('Failed to initialize and start server:', error);
        process.exit(1);
    }
})();