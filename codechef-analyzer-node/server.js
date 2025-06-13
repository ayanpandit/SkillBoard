// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const stream = require('stream');
const pLimit = require('p-limit');
const fs = require('fs');
const http = require('http');
const https = require('https');

const app = express();
const port = process.env.PORT || 5000;

// Trust proxy to get correct client IP behind services like Render/Heroku
app.set('trust proxy', 1);

// --- Configuration ---
// These values are critical for performance. They are set aggressively but can be
// tuned based on the external API's tolerance and server resources.
const APIConfig = {
    // How many API calls can be IN-FLIGHT simultaneously. A higher value increases parallelism.
    // Limited by server's file descriptors and external API's concurrent connection limit.
    MAX_CONCURRENT_API_CALLS: 150,

    // The TARGET number of requests to initiate per second. This prevents flooding the API
    // even if individual calls are very fast. Set based on known rate limits.
    RATE_LIMIT_PER_SECOND: 75,

    // How many usernames to group for the internal processing loop. Does not affect API concurrency.
    // A moderate size is good for logging and managing loop overhead.
    PROCESSING_BATCH_SIZE: 100,

    REQUEST_TIMEOUT: 15000,       // 15 seconds, increased for potentially slower API responses under load.
    MAX_RETRIES: 3,               // Max retries for a failing request to a single user.
    RETRY_DELAY_MS: 150,          // Initial retry delay.
    BACKOFF_FACTOR: 1.5,          // Exponential backoff factor.
    CACHE_DURATION_MS: 600 * 1000, // 10 minutes.
    CIRCUIT_BREAKER_THRESHOLD: 15, // Number of consecutive failures to trip the breaker.
};

// --- Logger ---
// A simple, effective logger. For extreme performance, an async logger like Pino could be used.
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => {
        if (error?.stack) {
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

// --- Global State & Utilities ---
const globalState = {
    cache: new Map(),
    cacheTimestamps: new Map(),
    circuitBreaker: {},
    requestTimestamps: [], // For outgoing rate limiting
    axiosInstance: null, // Will be initialized at startup

    isCached: function(username) {
        if (this.cache.has(username) && (Date.now() - (this.cacheTimestamps.get(username) || 0) < APIConfig.CACHE_DURATION_MS)) {
            return true;
        }
        if (this.cache.has(username)) { // Expired
            this.cache.delete(username);
            this.cacheTimestamps.delete(username);
            logger.debug(`Cache expired and removed for ${username}`);
        }
        return false;
    },
    getCache: function(username) { return this.cache.get(username); },
    setCache: function(username, data) {
        this.cache.set(username, data);
        this.cacheTimestamps.set(username, Date.now());
    },
    shouldCircuitBreak: function(apiEndpoint) {
        return (this.circuitBreaker[apiEndpoint] || 0) >= APIConfig.CIRCUIT_BREAKER_THRESHOLD;
    },
    recordFailure: function(apiEndpoint) {
        const count = (this.circuitBreaker[apiEndpoint] || 0) + 1;
        this.circuitBreaker[apiEndpoint] = count;
        logger.warn(`Circuit breaker for ${apiEndpoint} count: ${count}/${APIConfig.CIRCUIT_BREAKER_THRESHOLD}`);
        if (count >= APIConfig.CIRCUIT_BREAKER_THRESHOLD) {
            logger.error(`CIRCUIT BREAKER TRIPPED for ${apiEndpoint}! Blocking requests for 60s.`);
            setTimeout(() => {
                this.circuitBreaker[apiEndpoint] = 0;
                logger.info(`Circuit breaker for ${apiEndpoint} RESET after timeout.`);
            }, 60000); // Reset after 1 minute
        }
    },
    recordSuccess: function(apiEndpoint) {
        if (this.circuitBreaker[apiEndpoint] > 0) {
            this.circuitBreaker[apiEndpoint] = 0; // Reset on any success
            logger.info(`Circuit breaker for ${apiEndpoint} count reset to 0 due to success.`);
        }
    },
    canProceedOutgoing: function() {
        const now = Date.now();
        // Evict timestamps older than 1 second
        this.requestTimestamps = this.requestTimestamps.filter(ts => now - ts <= 1000);
        if (this.requestTimestamps.length < APIConfig.RATE_LIMIT_PER_SECOND) {
            this.requestTimestamps.push(now);
            return true;
        }
        return false;
    },
    waitIfNeededOutgoing: async function() {
        while (!this.canProceedOutgoing()) {
            // Calculate precise wait time until the oldest request slot is free
            const timeToWait = (1000 - (Date.now() - this.requestTimestamps[0])) + 5; // +5ms buffer
            await new Promise(resolve => setTimeout(resolve, Math.max(10, timeToWait)));
        }
    }
};

const SmartRetryHandler = {
    shouldRetry: (error, attempt) => {
        if (attempt >= APIConfig.MAX_RETRIES) return false;
        if (error.isAxiosError) {
            // Network error or server overload/timeout
            if (error.response) { // Request returned an error status
                return [408, 429, 500, 502, 503, 504].includes(error.response.status);
            }
            return true; // Request failed to send (e.g., ECONNRESET, ETIMEDOUT)
        }
        return false;
    },
    getRetryDelay: (attempt) => {
        const jitter = Math.random() * (APIConfig.RETRY_DELAY_MS * 0.2);
        return Math.min(
            (APIConfig.RETRY_DELAY_MS * (APIConfig.BACKOFF_FACTOR ** attempt)) + jitter,
            5000 // Max delay 5 seconds
        );
    }
};

// --- Middleware ---
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        const allowedOrigins = [
            "https://skillboard-nit5.onrender.com",
            "http://localhost:5173",
        ];
        if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
            callback(null, true);
        } else {
            logger.warn(`CORS: Blocked origin - ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// --- Core Profile Fetching Logic ---
async function fetchProfileOptimized(username, processorSharedState) {
    const { requestIP } = processorSharedState;

    if (globalState.isCached(username)) {
        logger.debug(`[${requestIP}] CACHE HIT for ${username}`);
        processorSharedState.incrementStats(true);
        return globalState.getCache(username);
    }

    const apiEndpointName = "codechef-api-proxy";
    if (globalState.shouldCircuitBreak(apiEndpointName)) {
        const msg = "Service temporarily unavailable (Circuit Breaker Open)";
        logger.warn(`[${requestIP}] CIRCUIT OPEN for ${apiEndpointName}, failing fast for ${username}`);
        processorSharedState.incrementStats(false);
        return { username, status: "error", message: msg };
    }

    const apiUrls = [
        `https://codechef-api.vercel.app/handle/${username}`,
        `https://codechef-api-backup.vercel.app/handle/${username}`,
    ];
    let lastError = null;

    for (let attempt = 0; attempt < APIConfig.MAX_RETRIES; attempt++) {
        for (const apiUrl of apiUrls) {
            try {
                await globalState.waitIfNeededOutgoing();

                const response = await globalState.axiosInstance.get(apiUrl, { timeout: APIConfig.REQUEST_TIMEOUT });

                if (response.status === 200 && response.data?.success) {
                    const data = response.data;
                    data.contestsGiven = data.ratingData?.length ?? 0;
                    data.currentRating = data.currentRating ?? 0;
                    data.highestRating = data.highestRating ?? data.currentRating;
                    data.globalRank = data.globalRank || "N/A";
                    data.countryRank = data.countryRank || "N/A";
                    if (!data.stars) {
                        const r = data.currentRating;
                        if (r < 1400) data.stars = "1"; else if (r < 1600) data.stars = "2";
                        else if (r < 1800) data.stars = "3"; else if (r < 2000) data.stars = "4";
                        else if (r < 2200) data.stars = "5"; else if (r < 2500) data.stars = "6";
                        else data.stars = "7";
                    }

                    const result = { username, status: "success", data };
                    globalState.setCache(username, result);
                    globalState.recordSuccess(apiEndpointName);
                    processorSharedState.incrementStats(true);
                    return result;
                }
                
                // Handle cases where API returns 200 OK but with an error message inside
                const apiErrorMsg = response.data?.message || `API returned status ${response.status} with non-success payload.`;
                if (apiErrorMsg.toLowerCase().includes("not found")) {
                    const result = { username, status: "error", message: "User not found" };
                    globalState.recordSuccess(apiEndpointName); // API is healthy
                    processorSharedState.incrementStats(false);
                    return result;
                }
                lastError = new Error(apiErrorMsg);
                
            } catch (error) {
                lastError = error;
                if (error.response?.status === 404) {
                    const result = { username, status: "error", message: "User not found" };
                    globalState.recordSuccess(apiEndpointName); // API is healthy
                    processorSharedState.incrementStats(false);
                    return result;
                }
                logger.warn(`[${requestIP}] FAILED attempt ${attempt + 1} for ${username} on ${apiUrl}. Error: ${error.message}`);
            }
        }

        if (SmartRetryHandler.shouldRetry(lastError, attempt)) {
            const delay = SmartRetryHandler.getRetryDelay(attempt);
            logger.info(`[${requestIP}] Retrying for ${username} after ${delay.toFixed(0)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        } else {
            break; // Max retries or non-retryable error
        }
    }

    globalState.recordFailure(apiEndpointName);
    const finalMsg = `All attempts failed. Last error: ${lastError?.message || 'Unknown error'}`;
    logger.error(`[${requestIP}] FINAL FAILURE for ${username}: ${finalMsg}`);
    processorSharedState.incrementStats(false);
    return { username, status: "error", message: finalMsg };
}

// --- Concurrency Control ---
const limit = pLimit(APIConfig.MAX_CONCURRENT_API_CALLS);

// --- Routes ---
app.get('/health', (req, res) => {
    res.json({
        status: "healthy",
        config: {
             maxConcurrentApiCalls: APIConfig.MAX_CONCURRENT_API_CALLS,
             targetRateLimitRps: APIConfig.RATE_LIMIT_PER_SECOND,
             cacheDurationSec: APIConfig.CACHE_DURATION_MS / 1000
        },
        stats: {
            cacheSize: globalState.cache.size,
            circuitBreakers: globalState.circuitBreaker,
            currentOutgoingRPSWindowSize: globalState.requestTimestamps.length
        }
    });
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file format. Please upload CSV or Excel.'), false);
        }
    }
});

app.post('/fetch-profiles', upload.single('file'), async (req, res) => {
    const requestIP = req.ip || 'Unknown IP';
    const requestStartTime = Date.now();

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    logger.info(`[${requestIP}] Received /fetch-profiles request. File: ${req.file.originalname}, Size: ${req.file.size} bytes`);
    
    // NOTE FOR EXTREME SCALE (1M+ users): The current approach holds all results in memory before responding.
    // For massive datasets, this can cause high memory usage. A more scalable architecture would be to stream
    // newline-delimited JSON (NDJSON) back to the client as results are processed. This would require
    // changes on the frontend to parse the stream. Given the current constraints, we stick to a single JSON response.

    const perRequestSharedState = {
        successCount: 0, errorCount: 0, totalProcessed: 0, requestIP,
        incrementStats: function(success) {
            this.totalProcessed++;
            if (success) this.successCount++; else this.errorCount++;
        },
    };
    
    let usernamesRaw = [];
    try {
        const fileBuffer = req.file.buffer;
        if (req.file.mimetype === 'text/csv') {
            await new Promise((resolve, reject) => {
                const bufferStream = stream.Readable.from(fileBuffer);
                bufferStream.pipe(csv({ headers: false, mapValues: ({ value }) => value.trim() }))
                    .on('data', (row) => { if (row[0]) usernamesRaw.push(row[0]); })
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            usernamesRaw = jsonData.map(row => String(row[0] || "").trim()).filter(Boolean);
        }

        const uniqueUsernames = [...new Set(usernamesRaw.filter(u => u && u.length > 1 && u.length < 50))];
        if (uniqueUsernames.length === 0) {
            return res.status(400).json({ error: "No valid usernames found in the file." });
        }
        
        logger.info(`[${requestIP}] Parsed ${uniqueUsernames.length} unique usernames. Starting processing...`);

        const allResults = [];
        for (let i = 0; i < uniqueUsernames.length; i += APIConfig.PROCESSING_BATCH_SIZE) {
            const batchUsernames = uniqueUsernames.slice(i, i + APIConfig.PROCESSING_BATCH_SIZE);
            const tasks = batchUsernames.map(username => limit(() => fetchProfileOptimized(username, perRequestSharedState)));
            const batchResults = await Promise.all(tasks);
            allResults.push(...batchResults);
            logger.info(`[${requestIP}] Processed batch. Total processed for request: ${perRequestSharedState.totalProcessed}/${uniqueUsernames.length}`);
        }

        const durationSec = (Date.now() - requestStartTime) / 1000;
        logger.info(`[${requestIP}] === BULK COMPLETE ===
                     Usernames: ${uniqueUsernames.length}
                     Success: ${perRequestSharedState.successCount}, Errors: ${perRequestSharedState.errorCount}
                     Total Time: ${durationSec.toFixed(2)}s
                     Rate: ${(uniqueUsernames.length / durationSec).toFixed(1)} profiles/sec`);
        
        res.json(allResults);

    } catch (error) {
        logger.error(`[${requestIP}] CRITICAL ERROR in /fetch-profiles for file ${req.file?.originalname || 'N/A'}`, error);
        res.status(500).json({ error: `An unexpected server error occurred: ${error.message}.` });
    }
});

app.get('/fetch-profile', async (req, res) => {
    const requestIP = req.ip || 'Unknown IP';
    const username = req.query.username?.trim();

    if (!username) return res.status(400).json({ status: "error", message: "No username provided" });
    if (username.length > 50) return res.status(400).json({ status: "error", message: "Username too long" });

    logger.info(`[${requestIP}] Received /fetch-profile request for username: '${username}'`);
    
    const singleCallState = {
        successCount: 0, errorCount: 0, totalProcessed: 0, requestIP,
        incrementStats: function(s) { if(s) this.successCount++; else this.errorCount++; },
    };

    try {
        const result = await limit(() => fetchProfileOptimized(username, singleCallState));
        res.json(result);
    } catch (error) {
        logger.error(`[${requestIP}] Error in /fetch-profile for ${username}`, error);
        res.status(500).json({ username, status: "error", message: "Server error during single profile fetch." });
    }
});


// --- Server Initialization ---
let server;

const initializeServer = async () => {
    try {
        // Initialize a single, shared Axios instance with connection pooling
        const httpAgent = new http.Agent({ keepAlive: true, maxSockets: APIConfig.MAX_CONCURRENT_API_CALLS + 10 });
        const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: APIConfig.MAX_CONCURRENT_API_CALLS + 10 });
        globalState.axiosInstance = axios.create({
            httpAgent, httpsAgent,
            headers: { 'User-Agent': 'CodeChef-Analyzer-Node/2.0' }
        });
        logger.info('Axios instance with keep-alive created.');

        server = app.listen(port, '0.0.0.0', () => {
            logger.info(`🚀 Server listening on port ${port}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`API Config: Max Concurrent=${APIConfig.MAX_CONCURRENT_API_CALLS}, Target RPS=${API_CONFIG.RATE_LIMIT_PER_SECOND}`);
        });

    } catch (error) {
        logger.error('Failed to initialize and start server:', error);
        process.exit(1);
    }
};

const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
        server.close(() => {
            logger.info("HTTP server closed.");
            process.exit(0);
        });
        // Force shutdown after timeout
        setTimeout(() => {
            logger.error("Could not close connections in time, forcefully shutting down");
            process.exit(1);
        }, 10000);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

initializeServer();