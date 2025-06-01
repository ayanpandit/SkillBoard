// server.js - Optimized for high throughput
const express = require('express');
const https = require('https');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

const app = express();
const PORT = 3000;

// Configuration for optimization
const CONFIG = {
    MAX_CONCURRENT_REQUESTS: 50, // Concurrent requests to LeetCode
    WORKER_COUNT: Math.min(os.cpus().length, 8), // Worker threads for CPU-bound tasks
    REQUEST_TIMEOUT: 5000, // 5 second timeout
    RETRY_ATTEMPTS: 2,
    BATCH_SIZE: 100, // Process users in batches
    CACHE_TTL: 300000, // 5 minutes cache
    CONNECTION_POOL_SIZE: 20 // HTTP connection pool
};

// In-memory cache with TTL
class TTLCache {
    constructor(ttl = CONFIG.CACHE_TTL) {
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            expires: Date.now() + this.ttl
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    clear() {
        this.cache.clear();
    }
}

const cache = new TTLCache();

// Connection pool for HTTPS requests
class ConnectionPool {
    constructor(maxConnections = CONFIG.CONNECTION_POOL_SIZE) {
        this.agents = [];
        this.currentIndex = 0;
        
        // Create multiple agents for connection pooling
        for (let i = 0; i < maxConnections; i++) {
            this.agents.push(new https.Agent({
                keepAlive: true,
                maxSockets: 5,
                maxFreeSockets: 2,
                timeout: CONFIG.REQUEST_TIMEOUT,
                freeSocketTimeout: 30000
            }));
        }
    }

    getAgent() {
        const agent = this.agents[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.agents.length;
        return agent;
    }
}

const connectionPool = new ConnectionPool();

// CORS Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json({ limit: '10mb' })); // Increased limit for bulk requests

// Rate limiting and request queue
class RequestQueue {
    constructor(maxConcurrent = CONFIG.MAX_CONCURRENT_REQUESTS) {
        this.maxConcurrent = maxConcurrent;
        this.running = 0;
        this.queue = [];
    }

    async add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.running >= this.maxConcurrent || this.queue.length === 0) {
            return;
        }

        this.running++;
        const { requestFn, resolve, reject } = this.queue.shift();

        try {
            const result = await requestFn();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.running--;
            this.process();
        }
    }
}

const requestQueue = new RequestQueue();

// Optimized GraphQL request function with connection pooling and retry logic
async function makeGraphQLRequest(queryObject, retries = CONFIG.RETRY_ATTEMPTS) {
    const cacheKey = JSON.stringify(queryObject);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    return requestQueue.add(async () => {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const result = await performRequest(queryObject);
                cache.set(cacheKey, result);
                return result;
            } catch (error) {
                if (attempt === retries) throw error;
                await sleep(100 * Math.pow(2, attempt)); // Exponential backoff
            }
        }
    });
}

function performRequest(queryObject) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(queryObject);
        const options = {
            hostname: 'leetcode.com',
            port: 443,
            path: '/graphql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://leetcode.com/',
                'Origin': 'https://leetcode.com'
            },
            agent: connectionPool.getAgent(),
            timeout: CONFIG.REQUEST_TIMEOUT
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.errors) {
                        console.warn(`GraphQL errors for ${queryObject?.variables?.username}:`, parsedData.errors);
                    }
                    if (res.statusCode >= 400 && !parsedData.errors) {
                        reject(new Error(`HTTP error: ${res.statusCode}`));
                        return;
                    }
                    resolve(parsedData);
                } catch (error) {
                    reject(new Error('Parse error: ' + error.message));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Optimized queries - combined into fewer requests
const getOptimizedQueries = (username) => ({
    main: {
        query: `
            query getMainUserData($username: String!, $year: Int, $limit: Int) {
                matchedUser(username: $username) {
                    username
                    profile {
                        realName
                        location
                        school
                        reputation
                        ranking
                        userAvatar
                    }
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                            submissions
                        }
                    }
                    userCalendar(year: $year) {
                        activeYears
                        streak
                        totalActiveDays
                        submissionCalendar
                    }
                    languageProblemCount {
                        languageName
                        problemsSolved
                    }
                    tagProblemCounts {
                        advanced { tagName tagSlug problemsSolved }
                        intermediate { tagName tagSlug problemsSolved }
                        fundamental { tagName tagSlug problemsSolved }
                    }
                    badges {
                        id
                        displayName
                        icon
                        creationDate
                        hoverText
                        category
                        medal {
                            slug
                            config {
                                iconGif
                                iconGifBackground
                            }
                        }
                    }
                    upcomingBadges {
                        name
                        icon
                        progress
                    }
                }
                allQuestionsCount {
                    difficulty
                    count
                }
                recentSubmissionList(username: $username, limit: $limit) {
                    title
                    titleSlug
                    timestamp
                    statusDisplay
                    lang
                }
            }
        `,
        variables: { 
            username, 
            year: new Date().getFullYear(),
            limit: 20
        }
    },
    contests: {
        query: `
            query getContestData($username: String!) {
                userContestRankingHistory(username: $username) {
                    attended
                    contest {
                        title
                        startTime
                    }
                    problemsSolved
                    totalProblems
                    ranking
                }
            }
        `,
        variables: { username }
    }
});

// Optimized data fetching
async function fetchUserDataOptimized(username) {
    const queries = getOptimizedQueries(username);
    
    try {
        // Fetch main data and contests in parallel
        const [mainResult, contestResult] = await Promise.all([
            makeGraphQLRequest(queries.main),
            makeGraphQLRequest(queries.contests)
        ]);

        return {
            main: mainResult,
            contests: contestResult
        };
    } catch (error) {
        console.error(`Error fetching data for ${username}:`, error.message);
        return {
            main: { errors: [{ message: error.message }], data: null },
            contests: { errors: [{ message: error.message }], data: null }
        };
    }
}

// Badge processing functions (kept from original)
function getBadgeDescription(displayName) {
    const descriptions = {
        'Annual Badge 2024': 'Awarded for active participation throughout 2024',
        'Annual Badge 2023': 'Awarded for active participation throughout 2023',
        'Annual Badge 2022': 'Awarded for active participation throughout 2022',
        'Knight': 'Solved 1000+ problems',
        'Guardian': 'Solved 500+ problems',
        'Warrior': 'Solved 100+ problems',
        'Study Plan': 'Completed a study plan',
        'DCC': 'Daily Coding Challenge participant',
        'Contest': 'Participated in contests',
        '50 Days Badge': 'Solved problems for 50 consecutive days',
        '100 Days Badge': 'Solved problems for 100 consecutive days',
        'Premium': 'LeetCode Premium subscriber'
    };
    
    for (const [key, desc] of Object.entries(descriptions)) {
        if (displayName.toLowerCase().includes(key.toLowerCase())) return desc;
    }
    return 'Special achievement badge';
}

function formatBadgesForAPI(user, username) {
    const badges = {
        username: username,
        earned: [],
        upcoming: [],
        summary: { totalEarned: 0, totalUpcoming: 0, categories: {}, level: 'Future Badge Earner 🚀', totalPossible: 0 },
        error: null
    };

    if (!user) {
        badges.error = `User "${username}" not found or no badge data available.`;
        return badges;
    }

    const earnedBadges = user.badges || [];
    const upcomingBadges = user.upcomingBadges || [];

    badges.earned = earnedBadges.map(b => ({
        id: b.id,
        name: b.displayName,
        description: b.hoverText || getBadgeDescription(b.displayName),
        status: 'UNLOCKED',
        creationDate: b.creationDate ? new Date(b.creationDate * 1000).toLocaleDateString() : 'N/A',
        icon: b.icon || b.medal?.config?.iconGif || '',
        iconGifBackground: b.medal?.config?.iconGifBackground || '',
        medalSlug: b.medal?.slug || 'N/A',
        category: b.category || 'General'
    }));

    badges.upcoming = upcomingBadges.map(b => ({
        name: b.name,
        status: 'LOCKED',
        progress: b.progress || 'Not available',
        icon: b.icon || '',
        iconGifBackground: '',
        medalSlug: 'N/A'
    }));

    badges.summary.totalEarned = badges.earned.length;
    badges.summary.totalUpcoming = badges.upcoming.length;
    badges.summary.totalPossible = badges.summary.totalEarned + badges.summary.totalUpcoming;
    
    const categories = {};
    badges.earned.forEach(b => { 
        categories[b.category] = (categories[b.category] || 0) + 1; 
    });
    badges.summary.categories = categories;

    const count = badges.summary.totalEarned;
    if (count >= 10) badges.summary.level = 'Badge Master 🌟';
    else if (count >= 5) badges.summary.level = 'Badge Collector 🎖️';
    else if (count >= 1) badges.summary.level = 'Badge Beginner 🎯';

    return badges;
}

// Optimized data formatting
function formatUserDataOptimized(username, rawData) {
    const formatted = {
        username: username,
        profile: { realName: 'N/A', location: 'N/A', school: 'N/A', reputation: 0, ranking: 'N/A', userAvatar: '' },
        stats: { Easy: { solved: 0, total: 0, submissions: 0 }, Medium: { solved: 0, total: 0, submissions: 0 }, Hard: { solved: 0, total: 0, submissions: 0 }, All: { solved: 0, total: 0, submissions: 0 } },
        activity: { streak: 0, totalActiveDays: 0, activeYears: 'N/A' },
        submissions: [],
        languages: [],
        tags: [],
        badges: { username: username, earned: [], upcoming: [], summary: {}, error: "Badge data structure missing." },
        contests: { summary: { totalAttended: 0, weeklyAttended: 0, biweeklyAttended: 0 }, history: [] },
        heatmap: {},
        error: null
    };

    // Check for errors
    if (rawData.main?.errors && (!rawData.main?.data || !rawData.main?.data?.matchedUser)) {
        formatted.error = rawData.main.errors[0].message;
        return formatted;
    }

    const user = rawData.main?.data?.matchedUser;
    const allQ = rawData.main?.data?.allQuestionsCount;
    const recentSubs = rawData.main?.data?.recentSubmissionList;

    if (!user) {
        formatted.error = `User "${username}" does not exist.`;
        return formatted;
    }

    // Profile
    if (user.profile) {
        formatted.profile = {
            realName: user.profile.realName || 'N/A',
            location: user.profile.location || 'N/A',
            school: user.profile.school || 'N/A',
            reputation: user.profile.reputation || 0,
            ranking: user.profile.ranking > 0 ? user.profile.ranking : 'N/A',
            userAvatar: user.profile.userAvatar || ''
        };
    }

    // Stats
    if (user.submitStats?.acSubmissionNum && allQ) {
        let totalS = 0, totalSub = 0, totalO = 0;
        user.submitStats.acSubmissionNum.forEach(s => {
            const t = allQ.find(q => q.difficulty === s.difficulty)?.count || 0;
            formatted.stats[s.difficulty] = { solved: s.count || 0, total: t, submissions: s.submissions || 0 };
            totalS += s.count || 0;
            totalSub += s.submissions || 0;
        });
        
        const aqd = allQ.find(q => q.difficulty === "All");
        let calcTotalO = 0;
        allQ.forEach(q => { if (q.difficulty !== "All") calcTotalO += (q.count || 0); });
        totalO = aqd ? aqd.count : calcTotalO;
        formatted.stats.All = { solved: totalS, total: totalO, submissions: totalSub };
    }

    // Activity & Heatmap
    if (user.userCalendar) {
        formatted.activity = {
            streak: user.userCalendar.streak || 0,
            totalActiveDays: user.userCalendar.totalActiveDays || 0,
            activeYears: user.userCalendar.activeYears?.join(', ') || 'N/A'
        };
        
        if (user.userCalendar.submissionCalendar) {
            try {
                formatted.heatmap = JSON.parse(user.userCalendar.submissionCalendar);
            } catch (e) {
                formatted.heatmap = { error: 'Parse error' };
            }
        }
    }

    // Submissions
    if (recentSubs) {
        formatted.submissions = recentSubs.map(s => ({
            title: s.title,
            titleSlug: s.titleSlug,
            status: s.statusDisplay,
            language: s.lang,
            timestamp: new Date(parseInt(s.timestamp) * 1000).toLocaleString()
        }));
    }

    // Languages
    if (user.languageProblemCount) {
        formatted.languages = user.languageProblemCount.map(l => ({
            name: l.languageName,
            solved: l.problemsSolved
        }));
    }

    // Tags
    if (user.tagProblemCounts) {
        const tagsRaw = user.tagProblemCounts;
        formatted.tags = [
            ...(tagsRaw.fundamental || []),
            ...(tagsRaw.intermediate || []),
            ...(tagsRaw.advanced || [])
        ]
        .map(t => ({ name: t.tagName, slug: t.tagSlug, solved: t.problemsSolved }))
        .filter(t => t.solved > 0)
        .sort((a, b) => b.solved - a.solved);
    }

    // Badges
    formatted.badges = formatBadgesForAPI(user, username);

    // Contests
    const contests = rawData.contests?.data?.userContestRankingHistory;
    if (contests) {
        const attended = contests.filter(c => c?.attended);
        formatted.contests.summary = {
            totalAttended: attended.length,
            weeklyAttended: attended.filter(c => c.contest?.title?.toLowerCase().includes('weekly')).length,
            biweeklyAttended: attended.filter(c => c.contest?.title?.toLowerCase().includes('biweekly')).length,
        };
        formatted.contests.history = attended
            .map(c => ({
                title: c.contest.title,
                solved: c.problemsSolved,
                total: c.totalProblems,
                rank: c.ranking,
                startTime: new Date(c.contest.startTime * 1000).toLocaleString()
            }))
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }

    return formatted;
}

// Batch processing for bulk requests
async function processBatch(usernames) {
    const results = {};
    const promises = usernames.map(async (username) => {
        try {
            const rawData = await fetchUserDataOptimized(username);
            results[username] = formatUserDataOptimized(username, rawData);
        } catch (error) {
            results[username] = {
                username,
                error: `Server error: ${error.message}`,
                profile: { realName: 'N/A', location: 'N/A', school: 'N/A', reputation: 0, ranking: 'N/A', userAvatar: '' },
                stats: { Easy: { solved: 0, total: 0, submissions: 0 }, Medium: { solved: 0, total: 0, submissions: 0 }, Hard: { solved: 0, total: 0, submissions: 0 }, All: { solved: 0, total: 0, submissions: 0 } },
                activity: { streak: 0, totalActiveDays: 0, activeYears: 'N/A' },
                submissions: [], languages: [], tags: [],
                badges: { username, earned: [], upcoming: [], summary: {}, error: "Error fetching badges" },
                contests: { summary: { totalAttended: 0, weeklyAttended: 0, biweeklyAttended: 0 }, history: [] },
                heatmap: {}
            };
        }
    });

    await Promise.all(promises);
    return results;
}

// API Routes
app.post('/api/leetcode', async (req, res) => {
    const { username } = req.body;
    
    if (!username || typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    const trimmedUsername = username.trim();
    const startTime = Date.now();

    try {
        const rawData = await fetchUserDataOptimized(trimmedUsername);
        const formattedData = formatUserDataOptimized(trimmedUsername, rawData);
        
        console.log(`Single user ${trimmedUsername} processed in ${Date.now() - startTime}ms`);
        res.json(formattedData);
    } catch (error) {
        console.error(`API error for ${trimmedUsername}:`, error);
        res.status(500).json({ 
            error: `Server error for ${trimmedUsername}. ${error.message}`, 
            username: trimmedUsername 
        });
    }
});

// Bulk processing endpoint
app.post('/api/leetcode/bulk', async (req, res) => {
    const { usernames } = req.body;
    
    if (!Array.isArray(usernames) || usernames.length === 0) {
        return res.status(400).json({ error: 'Usernames array is required.' });
    }

    if (usernames.length > 100000) {
        return res.status(400).json({ error: 'Maximum 100,000 usernames allowed per request.' });
    }

    const startTime = Date.now();
    const trimmedUsernames = usernames.map(u => String(u).trim()).filter(u => u);
    
    try {
        // Process in batches
        const results = {};
        const batches = [];
        
        for (let i = 0; i < trimmedUsernames.length; i += CONFIG.BATCH_SIZE) {
            batches.push(trimmedUsernames.slice(i, i + CONFIG.BATCH_SIZE));
        }

        console.log(`Processing ${trimmedUsernames.length} users in ${batches.length} batches`);

        // Process batches in parallel with controlled concurrency
        const batchPromises = batches.map(batch => processBatch(batch));
        const batchResults = await Promise.all(batchPromises);

        // Merge results
        batchResults.forEach(batchResult => {
            Object.assign(results, batchResult);
        });

        const processingTime = Date.now() - startTime;
        console.log(`Bulk processing completed: ${trimmedUsernames.length} users in ${processingTime}ms (${(trimmedUsernames.length / (processingTime / 1000)).toFixed(2)} users/sec)`);

        res.json({
            success: true,
            count: Object.keys(results).length,
            processing_time_ms: processingTime,
            users_per_second: Math.round(trimmedUsernames.length / (processingTime / 1000)),
            data: results
        });

    } catch (error) {
        console.error('Bulk processing error:', error);
        res.status(500).json({ 
            error: `Bulk processing error: ${error.message}`,
            processing_time_ms: Date.now() - startTime
        });
    }
});

// Cache management endpoints
app.post('/api/cache/clear', (req, res) => {
    cache.clear();
    res.json({ message: 'Cache cleared successfully' });
});

app.get('/api/cache/stats', (req, res) => {
    res.json({ 
        size: cache.cache.size,
        ttl: cache.ttl,
        config: CONFIG
    });
});

app.get('/api/test', (req, res) => res.json({ 
    message: 'Backend test OK!',
    config: CONFIG,
    cache_size: cache.cache.size
}));

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    cache.clear();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Optimized LeetCode server running at http://localhost:${PORT}`);
    console.log(`📊 Config: ${CONFIG.MAX_CONCURRENT_REQUESTS} concurrent, ${CONFIG.WORKER_COUNT} workers, ${CONFIG.CONNECTION_POOL_SIZE} connections`);
    console.log(`⚡ Ready for high-throughput processing!`);
});