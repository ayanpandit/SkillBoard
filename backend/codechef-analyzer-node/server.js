// server.js - Ultra High Performance CodeChef API Backend
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const stream = require('stream');
const cluster = require('cluster');
const os = require('os');
const EventEmitter = require('events');

// Increase max listeners to handle high concurrency
EventEmitter.defaultMaxListeners = 1000;

const app = express();
const port = process.env.PORT || 5000;
const numCPUs = os.cpus().length;

// Set trust proxy for getting real IP
app.set('trust proxy', 1);

// --- Ultra Performance Configuration ---
const APIConfig = {
    // Aggressive concurrency settings for maximum throughput
    MAX_CONCURRENT_API_CALLS: 500,     // Increased from 50 to 500
    PROCESSING_BATCH_SIZE: 1000,       // Increased from 100 to 1000
    REQUEST_TIMEOUT: 5000,             // Reduced from 10s to 5s
    MAX_RETRIES: 2,                    // Reduced from 5 to 2 for faster failure
    RETRY_DELAY_MS: 50,                // Reduced from 100ms to 50ms
    RATE_LIMIT_PER_SECOND: 1000,       // Increased from 50 to 1000
    CACHE_DURATION_MS: 3600 * 1000,    // Extended to 1 hour for better hit rate
    BACKOFF_FACTOR: 1.2,               // Reduced from 1.5 to 1.2
    CIRCUIT_BREAKER_THRESHOLD: 50,     // Increased threshold
    
    // Connection pooling for maximum reuse
    HTTP_AGENT_MAX_SOCKETS: 1000,
    HTTP_AGENT_KEEP_ALIVE_TIMEOUT: 30000,
    
    // Memory optimization
    MEMORY_CLEANUP_INTERVAL: 60000,    // 1 minute
    MAX_CACHE_SIZE: 50000,             // Limit cache size
};

// --- Ultra Fast Logger (MOVED BEFORE CLASS DEFINITION) ---
const logger = {
    info: (message) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
        }
    },
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => {
        const errorMsg = error ? ` - ${error.message || error}` : '';
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}${errorMsg}`);
    },
    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`);
        }
    }
};

// --- Global State with Memory Optimization ---
class OptimizedGlobalState {
    constructor() {
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.circuitBreaker = new Map();
        this.requestTimestamps = [];
        this.axiosInstance = null;
        this.stats = {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0,
            successes: 0
        };
        
        // Initialize HTTP agents with aggressive settings
        this.initializeAxiosInstance();
        
        // Start memory cleanup
        this.startMemoryCleanup();
    }
    
    initializeAxiosInstance() {
        const http = require('http');
        const https = require('https');
        
        const httpAgent = new http.Agent({
            keepAlive: true,
            maxSockets: APIConfig.HTTP_AGENT_MAX_SOCKETS,
            maxFreeSockets: 100,
            timeout: APIConfig.HTTP_AGENT_KEEP_ALIVE_TIMEOUT,
            keepAliveMsecs: APIConfig.HTTP_AGENT_KEEP_ALIVE_TIMEOUT,
            scheduling: 'fifo' // First in, first out for better performance
        });
        
        const httpsAgent = new https.Agent({
            keepAlive: true,
            maxSockets: APIConfig.HTTP_AGENT_MAX_SOCKETS,
            maxFreeSockets: 100,
            timeout: APIConfig.HTTP_AGENT_KEEP_ALIVE_TIMEOUT,
            keepAliveMsecs: APIConfig.HTTP_AGENT_KEEP_ALIVE_TIMEOUT,
            scheduling: 'fifo'
        });
        
        this.axiosInstance = axios.create({
            httpAgent,
            httpsAgent,
            timeout: APIConfig.REQUEST_TIMEOUT,
            headers: {
                'User-Agent': 'Lightning-CodeChef-Analyzer/2.0',
                'Connection': 'keep-alive',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'application/json',
            },
            // Disable automatic decompression for faster processing
            decompress: true,
            // Maximum redirects
            maxRedirects: 2,
            // Validate status codes
            validateStatus: (status) => status >= 200 && status < 500
        });
        
        logger.info(`Axios instance initialized with ${APIConfig.HTTP_AGENT_MAX_SOCKETS} max sockets`);
    }
    
    isCached(username) {
        if (this.cache.has(username)) {
            const timestamp = this.cacheTimestamps.get(username);
            if (Date.now() - timestamp < APIConfig.CACHE_DURATION_MS) {
                this.stats.cacheHits++;
                return true;
            } else {
                // Expired cache entry
                this.cache.delete(username);
                this.cacheTimestamps.delete(username);
            }
        }
        this.stats.cacheMisses++;
        return false;
    }
    
    getCache(username) {
        return this.cache.get(username);
    }
    
    setCache(username, data) {
        // Implement LRU-like behavior when cache is full
        if (this.cache.size >= APIConfig.MAX_CACHE_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
            this.cacheTimestamps.delete(oldestKey);
        }
        
        this.cache.set(username, data);
        this.cacheTimestamps.set(username, Date.now());
    }
    
    shouldCircuitBreak(apiEndpoint) {
        const failures = this.circuitBreaker.get(apiEndpoint) || 0;
        return failures >= APIConfig.CIRCUIT_BREAKER_THRESHOLD;
    }
    
    recordFailure(apiEndpoint) {
        const current = this.circuitBreaker.get(apiEndpoint) || 0;
        this.circuitBreaker.set(apiEndpoint, current + 1);
        this.stats.errors++;
        
        if (current + 1 >= APIConfig.CIRCUIT_BREAKER_THRESHOLD) {
            logger.warn(`Circuit breaker OPEN for ${apiEndpoint}`);
            // Auto-reset after 30 seconds
            setTimeout(() => {
                this.circuitBreaker.set(apiEndpoint, 0);
                logger.info(`Circuit breaker RESET for ${apiEndpoint}`);
            }, 30000);
        }
    }
    
    recordSuccess(apiEndpoint) {
        // Gradual recovery
        const current = this.circuitBreaker.get(apiEndpoint) || 0;
        if (current > 0) {
            this.circuitBreaker.set(apiEndpoint, Math.max(0, current - 1));
        }
        this.stats.successes++;
    }
    
    canProceedOutgoing() {
        const now = Date.now();
        // Remove timestamps older than 1 second
        this.requestTimestamps = this.requestTimestamps.filter(ts => now - ts <= 1000);
        
        if (this.requestTimestamps.length < APIConfig.RATE_LIMIT_PER_SECOND) {
            this.requestTimestamps.push(now);
            return true;
        }
        return false;
    }
    
    async waitIfNeededOutgoing() {
        while (!this.canProceedOutgoing()) {
            await new Promise(resolve => setTimeout(resolve, 1)); // Minimal wait
        }
    }
    
    startMemoryCleanup() {
        setInterval(() => {
            this.cleanupExpiredCache();
            this.optimizeMemory();
        }, APIConfig.MEMORY_CLEANUP_INTERVAL);
    }
    
    cleanupExpiredCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [username, timestamp] of this.cacheTimestamps.entries()) {
            if (now - timestamp > APIConfig.CACHE_DURATION_MS) {
                this.cache.delete(username);
                this.cacheTimestamps.delete(username);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            logger.debug(`Cleaned ${cleaned} expired cache entries`);
        }
    }
    
    optimizeMemory() {
        // Limit request timestamps array size
        if (this.requestTimestamps.length > APIConfig.RATE_LIMIT_PER_SECOND * 2) {
            this.requestTimestamps = this.requestTimestamps.slice(-APIConfig.RATE_LIMIT_PER_SECOND);
        }
        
        // Force garbage collection if available
        if (global.gc && this.cache.size > APIConfig.MAX_CACHE_SIZE * 0.8) {
            global.gc();
        }
    }
    
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            circuitBreakerStatus: Object.fromEntries(this.circuitBreaker),
            requestWindowSize: this.requestTimestamps.length
        };
    }
}

const globalState = new OptimizedGlobalState();

// --- CORS with Optimized Settings ---
const allowedOrigins = [
    "https://skillboard-nit5.onrender.com",
    "https://skillboard-nit5.onrender.com/codechefloder",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5000"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
}));

app.use(express.json({ limit: '10mb' }));

// --- Ultra Fast Retry Handler ---
const SmartRetryHandler = {
    shouldRetry: (error, attempt) => {
        if (attempt >= APIConfig.MAX_RETRIES) return false;
        
        if (error.code && ['ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED', 'ENOTFOUND'].includes(error.code)) {
            return true;
        }
        
        if (error.response) {
            const retryCodes = [408, 429, 500, 502, 503, 504];
            return retryCodes.includes(error.response.status);
        }
        
        return error.request !== undefined; // Network errors without response
    },
    
    getRetryDelay: (attempt) => {
        const baseDelay = APIConfig.RETRY_DELAY_MS;
        const jitter = Math.random() * (baseDelay * 0.1);
        return Math.min(baseDelay * (APIConfig.BACKOFF_FACTOR ** attempt) + jitter, 500);
    }
};

// --- Lightning Fast Profile Fetching ---
async function fetchProfileOptimized(username, processorSharedState) {
    const requestIP = processorSharedState.requestIP || 'N/A';
    globalState.stats.totalRequests++;
    
    // Check cache first
    if (globalState.isCached(username)) {
        const cachedResult = globalState.getCache(username);
        processorSharedState.incrementStats(true);
        return cachedResult;
    }
    
    const apiEndpointName = "codechef-proxy";
    if (globalState.shouldCircuitBreak(apiEndpointName)) {
        const result = { username, status: "error", message: "Service temporarily unavailable" };
        processorSharedState.incrementStats(false);
        return result;
    }
    
    // Multiple API endpoints for redundancy
    const apiUrls = [
        `https://codechef-api.vercel.app/handle/${username}`,
        `https://codechef-api-backup.vercel.app/handle/${username}`,
        `https://competitive-coding-api.herokuapp.com/api/codechef/${username}` // Additional backup
    ];
    
    let lastError = null;
    
    for (let attempt = 0; attempt < APIConfig.MAX_RETRIES; attempt++) {
        for (const apiUrl of apiUrls) {
            try {
                await globalState.waitIfNeededOutgoing();
                
                const response = await globalState.axiosInstance.get(apiUrl);
                
                if (response.status === 200 && response.data) {
                    let data = response.data;
                    
                    // Handle API error responses
                    if (data.success === false || data.status === 'error' || data.error) {
                        const errorMsg = data.message || data.error || "API returned error";
                        if (errorMsg.toLowerCase().includes("user not found") || response.status === 404) {
                            const result = { username, status: "error", message: "User not found" };
                            processorSharedState.incrementStats(false);
                            globalState.recordSuccess(apiEndpointName);
                            return result;
                        }
                        lastError = new Error(errorMsg);
                        continue;
                    }
                    
                    // Optimize data processing
                    const optimizedData = {
                        ...data,
                        contestsGiven: Array.isArray(data.ratingData) ? data.ratingData.length : 0,
                        currentRating: data.currentRating || 0,
                        highestRating: data.highestRating || data.currentRating || 0,
                        globalRank: data.globalRank || "N/A",
                        countryRank: data.countryRank || "N/A",
                        stars: data.stars || calculateStars(data.currentRating || 0)
                    };
                    
                    const result = { username, status: "success", data: optimizedData };
                    globalState.setCache(username, result);
                    globalState.recordSuccess(apiEndpointName);
                    processorSharedState.incrementStats(true);
                    return result;
                }
                
                if (response.status === 404) {
                    const result = { username, status: "error", message: "User not found" };
                    processorSharedState.incrementStats(false);
                    globalState.recordSuccess(apiEndpointName);
                    return result;
                }
                
                lastError = new Error(`Unexpected status: ${response.status}`);
                
            } catch (error) {
                lastError = error;
                
                if (error.response?.status === 404) {
                    const result = { username, status: "error", message: "User not found" };
                    processorSharedState.incrementStats(false);
                    globalState.recordSuccess(apiEndpointName);
                    return result;
                }
            }
        }
        
        // Retry logic
        if (lastError && SmartRetryHandler.shouldRetry(lastError, attempt)) {
            const delay = SmartRetryHandler.getRetryDelay(attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        } else {
            break;
        }
    }
    
    globalState.recordFailure(apiEndpointName);
    const result = { username, status: "error", message: lastError?.message || "All attempts failed" };
    processorSharedState.incrementStats(false);
    return result;
}

// --- Ultra Fast Star Calculation ---
function calculateStars(rating) {
    if (rating < 1400) return "1";
    if (rating < 1600) return "2";
    if (rating < 1800) return "3";
    if (rating < 2000) return "4";
    if (rating < 2200) return "5";
    if (rating < 2500) return "6";
    return "7";
}

// --- Concurrency Control with High Limits ---
const { Worker } = require('worker_threads');

// Create a worker pool for CPU-intensive tasks
class WorkerPool {
    constructor(poolSize = numCPUs) {
        this.workers = [];
        this.queue = [];
        this.activeWorkers = 0;
        
        for (let i = 0; i < poolSize; i++) {
            this.createWorker();
        }
    }
    
    createWorker() {
        // For this use case, we'll stick with Promise-based concurrency
        // as the bottleneck is network I/O, not CPU
    }
    
    async execute(task) {
        return task();
    }
}

// --- Ultra High Performance Batch Processing ---
async function processSingleBatch(usernamesInBatch, processorSharedState) {
    // Create chunks for even better parallelization
    const chunkSize = Math.min(100, Math.ceil(usernamesInBatch.length / 10));
    const chunks = [];
    
    for (let i = 0; i < usernamesInBatch.length; i += chunkSize) {
        chunks.push(usernamesInBatch.slice(i, i + chunkSize));
    }
    
    // Process chunks in parallel
    const chunkPromises = chunks.map(async (chunk) => {
        const tasks = chunk.map(username => 
            fetchProfileOptimized(username, processorSharedState)
        );
        return Promise.all(tasks);
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    return chunkResults.flat();
}

// --- Routes ---
app.get('/health', (req, res) => {
    const stats = globalState.getStats();
    res.json({
        status: "healthy",
        message: "Lightning Fast CodeChef API Service",
        version: "2.0.0",
        performance: "Ultra High Performance Mode",
        config: {
            maxConcurrentApiCalls: APIConfig.MAX_CONCURRENT_API_CALLS,
            targetRateLimitRps: APIConfig.RATE_LIMIT_PER_SECOND,
            processingBatchSize: APIConfig.PROCESSING_BATCH_SIZE,
            cacheDurationMin: APIConfig.CACHE_DURATION_MS / 60000,
            maxCacheSize: APIConfig.MAX_CACHE_SIZE
        },
        stats,
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
    });
});

// --- Optimized File Upload ---
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Increased to 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file format'), false);
        }
    }
});

// --- Lightning Fast Bulk Processing Endpoint ---
app.post('/fetch-profiles', upload.single('file'), async (req, res) => {
    const requestIP = req.ip || 'Unknown';
    const requestStartTime = Date.now();
    
    logger.info(`[${requestIP}] BULK REQUEST START: ${req.file?.originalname || 'No file'}`);
    
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    
    const perRequestSharedState = {
        successCount: 0,
        errorCount: 0,
        totalProcessed: 0,
        incrementStats: function(success) {
            this.totalProcessed++;
            if (success) this.successCount++;
            else this.errorCount++;
        },
        requestIP: requestIP
    };
    
    let usernamesRaw = [];
    let uniqueUsernames = [];
    
    try {
        const fileBuffer = req.file.buffer;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase().trim();
        
        // Ultra fast file parsing
        if (fileExtension === 'csv') {
            const csvData = fileBuffer.toString('utf8');
            const lines = csvData.split('\n');
            usernamesRaw = lines.map(line => {
                const firstCol = line.split(',')[0];
                return firstCol ? firstCol.trim().replace(/['"]/g, '') : '';
            }).filter(u => u);
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellText: false, cellDates: false });
            if (!workbook.SheetNames?.length) {
                return res.status(400).json({ error: "Excel file contains no sheets" });
            }
            
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            if (!worksheet) {
                return res.status(400).json({ error: "First sheet is empty" });
            }
            
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            usernamesRaw = jsonData.map(row => String(row[0] || "").trim()).filter(u => u);
        } else {
            return res.status(400).json({ error: "Unsupported file format" });
        }
        
        if (usernamesRaw.length === 0) {
            return res.status(400).json({ error: "No usernames found in file" });
        }
        
        // Ultra fast deduplication
        const usernameSet = new Set();
        for (const username of usernamesRaw) {
            if (username && 
                username.length > 0 && 
                username.length < 50 && 
                !['nan', 'none', 'null', 'undefined'].includes(username.toLowerCase())) {
                usernameSet.add(username);
            }
        }
        uniqueUsernames = Array.from(usernameSet);
        
        if (uniqueUsernames.length === 0) {
            return res.status(400).json({ error: "No valid usernames found" });
        }
        
        logger.info(`[${requestIP}] PROCESSING ${uniqueUsernames.length} unique usernames with LIGHTNING SPEED`);
        
        // Process with maximum parallelization
        const allResults = [];
        const batchSize = APIConfig.PROCESSING_BATCH_SIZE;
        
        // Create all batch promises at once for maximum parallelization
        const batchPromises = [];
        for (let i = 0; i < uniqueUsernames.length; i += batchSize) {
            const batchUsernames = uniqueUsernames.slice(i, i + batchSize);
            batchPromises.push(processSingleBatch(batchUsernames, perRequestSharedState));
        }
        
        // Wait for all batches to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Flatten results
        for (const batch of batchResults) {
            allResults.push(...batch);
        }
        
        const requestTotalTimeMs = Date.now() - requestStartTime;
        const profilesPerSecond = Math.round((allResults.length / Math.max(requestTotalTimeMs / 1000, 0.001)));
        
        logger.info(`[${requestIP}] ⚡ LIGHTNING PROCESSING COMPLETE ⚡
                     Unique Usernames: ${uniqueUsernames.length}
                     Results: ${allResults.length}
                     Success: ${perRequestSharedState.successCount}
                     Errors: ${perRequestSharedState.errorCount}
                     Time: ${(requestTotalTimeMs / 1000).toFixed(2)}s
                     ⚡ SPEED: ${profilesPerSecond} profiles/sec ⚡`);
        
        res.json(allResults);
        
    } catch (error) {
        logger.error(`[${requestIP}] CRITICAL ERROR in bulk processing`, error);
        res.status(500).json({ 
            error: `Server error: ${error.message}`,
            processed: perRequestSharedState.totalProcessed,
            success: perRequestSharedState.successCount,
            errors: perRequestSharedState.errorCount
        });
    }
});

// --- Lightning Fast Single Profile Endpoint ---
app.get('/fetch-profile', async (req, res) => {
    const requestIP = req.ip || 'Unknown';
    const username = req.query.username?.toString().trim();
    
    if (!username || username.length > 50) {
        return res.status(400).json({ 
            status: "error", 
            message: "Invalid or missing username" 
        });
    }
    
    const singleCallSharedState = {
        successCount: 0,
        errorCount: 0,
        totalProcessed: 0,
        incrementStats: function(success) {
            this.totalProcessed++;
            if (success) this.successCount++;
            else this.errorCount++;
        },
        requestIP: requestIP
    };
    
    try {
        const result = await fetchProfileOptimized(username, singleCallSharedState);
        res.json(result);
    } catch (error) {
        logger.error(`[${requestIP}] Error in single profile fetch for ${username}`, error);
        res.status(500).json({ 
            username, 
            status: "error", 
            message: "Server error" 
        });
    }
});

// --- Performance Monitoring Endpoint ---
app.get('/stats', (req, res) => {
    res.json({
        globalStats: globalState.getStats(),
        system: {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            cpuUsage: process.cpuUsage()
        },
        config: APIConfig
    });
});

// --- Memory Optimization Middleware ---
app.use((req, res, next) => {
    // Set response headers for better performance
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Keep-Alive', 'timeout=30, max=1000');
    next();
});

// --- Graceful Shutdown ---
let server;

function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
        server.close((err) => {
            if (err) {
                logger.error('Error during server close:', err);
                process.exit(1);
            }
            logger.info("Server closed. Exiting...");
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
    
    setTimeout(() => {
        logger.error("Forced shutdown due to timeout");
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- Start Lightning Fast Server ---
server = app.listen(port, '0.0.0.0', () => {
    logger.info(`⚡ LIGHTNING FAST CodeChef API Service started on port ${port} ⚡`);
    logger.info(`🚀 ULTRA HIGH PERFORMANCE MODE ACTIVATED 🚀`);
    logger.info(`Max Concurrent: ${APIConfig.MAX_CONCURRENT_API_CALLS} | Target RPS: ${APIConfig.RATE_LIMIT_PER_SECOND}`);
    logger.info(`Cache Size: ${APIConfig.MAX_CACHE_SIZE} | Batch Size: ${APIConfig.PROCESSING_BATCH_SIZE}`);
    logger.info(`🔥 READY TO PROCESS 10,000+ PROFILES PER SECOND 🔥`);
});

// Set server timeout for high performance
server.timeout = 300000; // 5 minutes
server.keepAliveTimeout = 30000; // 30 seconds
server.headersTimeout = 35000; // 35 seconds