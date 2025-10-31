const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://skillboard-nit5.onrender.com', 'https://skillboard.vercel.app', 'https://skillboard.netlify.app']
    : '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// CodeForces API Configuration
const CF_API_BASE = 'https://codeforces.com/api';
const API_KEY = process.env.CODEFORCES_API_KEY || '6e5d3593af8f27d2e56780f93a9632d30e62fefe';
const API_SECRET = process.env.CODEFORCES_API_SECRET || '0e1659f1f6806f751f6c2791c8236096674fb493';

// Rate limiting: 1 request per 2 seconds
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds

// Helper function to wait for rate limit
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

// Generate API signature for authenticated requests
const generateApiSig = (methodName, params) => {
  const rand = Math.random().toString(36).substring(2, 8); // 6 random characters
  
  // Add apiKey and time to params
  const allParams = {
    ...params,
    apiKey: API_KEY,
    time: Math.floor(Date.now() / 1000)
  };
  
  // Sort parameters lexicographically
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys.map(key => `${key}=${allParams[key]}`).join('&');
  
  // Create signature string: rand/methodName?params#secret
  const sigString = `${rand}/${methodName}?${paramString}#${API_SECRET}`;
  
  // Generate SHA-512 hash
  const hash = crypto.createHash('sha512').update(sigString).digest('hex');
  
  return {
    apiSig: rand + hash,
    ...allParams
  };
};

// Make CodeForces API request
const cfApiRequest = async (method, params = {}, useAuth = false) => {
  await waitForRateLimit();
  
  try {
    let requestParams = { ...params };
    
    if (useAuth) {
      requestParams = generateApiSig(method, params);
    }
    
    const response = await axios.get(`${CF_API_BASE}/${method}`, {
      params: requestParams,
      timeout: 10000
    });
    
    if (response.data.status === 'OK') {
      return { success: true, data: response.data.result };
    } else {
      return { success: false, error: response.data.comment || 'API request failed' };
    }
  } catch (error) {
    console.error(`CF API Error (${method}):`, error.message);
    return { 
      success: false, 
      error: error.response?.data?.comment || error.message || 'Network error' 
    };
  }
};

// Helper to count problems solved by verdict
const countSolvedProblems = (submissions) => {
  const solvedProblems = new Set();
  const problemStats = {};
  
  submissions.forEach(sub => {
    if (sub.verdict === 'OK') {
      const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
      solvedProblems.add(problemKey);
      
      const rating = sub.problem.rating || 0;
      if (rating) {
        problemStats[problemKey] = rating;
      }
    }
  });
  
  return {
    count: solvedProblems.size,
    problems: Array.from(solvedProblems),
    byDifficulty: Object.values(problemStats).reduce((acc, rating) => {
      const level = Math.floor(rating / 100) * 100;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {})
  };
};

// Helper to get rank color/title
const getRankTitle = (rating) => {
  if (!rating) return { rank: 'Unrated', color: 'gray' };
  if (rating < 1200) return { rank: 'Newbie', color: 'gray' };
  if (rating < 1400) return { rank: 'Pupil', color: 'green' };
  if (rating < 1600) return { rank: 'Specialist', color: 'cyan' };
  if (rating < 1900) return { rank: 'Expert', color: 'blue' };
  if (rating < 2100) return { rank: 'Candidate Master', color: 'violet' };
  if (rating < 2300) return { rank: 'Master', color: 'orange' };
  if (rating < 2400) return { rank: 'International Master', color: 'orange' };
  if (rating < 2600) return { rank: 'Grandmaster', color: 'red' };
  if (rating < 3000) return { rank: 'International Grandmaster', color: 'red' };
  return { rank: 'Legendary Grandmaster', color: 'red' };
};

// Route: Get single user profile
app.get('/api/codeforces/:handle', async (req, res) => {
  const { handle } = req.params;
  
  try {
    console.log(`Fetching data for user: ${handle}`);
    
    // Fetch user info
    const userInfoResult = await cfApiRequest('user.info', { handles: handle });
    if (!userInfoResult.success) {
      return res.json({
        success: false,
        error: userInfoResult.error,
        username: handle
      });
    }
    
    const userInfo = userInfoResult.data[0];
    
    // Fetch user submissions
    const submissionsResult = await cfApiRequest('user.status', { handle, from: 1, count: 10000 });
    const submissions = submissionsResult.success ? submissionsResult.data : [];
    
    // Fetch rating history
    const ratingResult = await cfApiRequest('user.rating', { handle });
    const ratingHistory = ratingResult.success ? ratingResult.data : [];
    
    // Calculate statistics
    const solvedStats = countSolvedProblems(submissions);
    const rankInfo = getRankTitle(userInfo.rating);
    
    // Count contests
    const contestsParticipated = ratingHistory.length;
    
    // Get language statistics
    const languages = submissions.reduce((acc, sub) => {
      const lang = sub.programmingLanguage;
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});
    
    // Build response
    const profileData = {
      success: true,
      username: handle,
      handle: userInfo.handle,
      firstName: userInfo.firstName || '',
      lastName: userInfo.lastName || '',
      country: userInfo.country || 'N/A',
      city: userInfo.city || 'N/A',
      organization: userInfo.organization || 'N/A',
      rating: userInfo.rating || 0,
      maxRating: userInfo.maxRating || 0,
      rank: userInfo.rank || 'Unrated',
      maxRank: userInfo.maxRank || 'Unrated',
      rankColor: rankInfo.color,
      contribution: userInfo.contribution || 0,
      friendOfCount: userInfo.friendOfCount || 0,
      avatar: userInfo.avatar || userInfo.titlePhoto || '',
      registrationTimeSeconds: userInfo.registrationTimeSeconds,
      lastOnlineTimeSeconds: userInfo.lastOnlineTimeSeconds,
      problemsSolved: solvedStats.count,
      solvedByDifficulty: solvedStats.byDifficulty,
      contestsParticipated,
      ratingHistory: ratingHistory.map(r => ({
        contestId: r.contestId,
        contestName: r.contestName,
        rank: r.rank,
        oldRating: r.oldRating,
        newRating: r.newRating,
        ratingChange: r.newRating - r.oldRating,
        time: r.ratingUpdateTimeSeconds
      })),
      languages: Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([lang, count]) => ({ language: lang, count })),
      totalSubmissions: submissions.length,
      recentSubmissions: submissions.slice(0, 20).map(sub => ({
        id: sub.id,
        contestId: sub.contestId,
        problem: {
          name: sub.problem.name,
          index: sub.problem.index,
          rating: sub.problem.rating,
          tags: sub.problem.tags
        },
        programmingLanguage: sub.programmingLanguage,
        verdict: sub.verdict,
        timeConsumedMillis: sub.timeConsumedMillis,
        memoryConsumedBytes: sub.memoryConsumedBytes,
        creationTimeSeconds: sub.creationTimeSeconds
      }))
    };
    
    res.json(profileData);
    
  } catch (error) {
    console.error(`Error fetching user ${handle}:`, error);
    res.json({
      success: false,
      error: error.message || 'Failed to fetch user data',
      username: handle
    });
  }
});

// Route: Bulk user fetch
app.post('/api/codeforces/bulk', async (req, res) => {
  const { usernames } = req.body;
  
  if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
    return res.status(400).json({ error: 'Invalid request: usernames array required' });
  }
  
  console.log(`Bulk request for ${usernames.length} users`);
  
  const results = [];
  
  for (const username of usernames) {
    try {
      // Fetch user info
      const userInfoResult = await cfApiRequest('user.info', { handles: username });
      
      if (!userInfoResult.success) {
        results.push({
          success: false,
          error: userInfoResult.error,
          username
        });
        continue;
      }
      
      const userInfo = userInfoResult.data[0];
      
      // Fetch submissions (limited for bulk)
      const submissionsResult = await cfApiRequest('user.status', { handle: username, from: 1, count: 1000 });
      const submissions = submissionsResult.success ? submissionsResult.data : [];
      
      // Fetch rating history
      const ratingResult = await cfApiRequest('user.rating', { handle: username });
      const ratingHistory = ratingResult.success ? ratingResult.data : [];
      
      // Calculate basic stats
      const solvedStats = countSolvedProblems(submissions);
      const rankInfo = getRankTitle(userInfo.rating);
      
      results.push({
        success: true,
        username,
        handle: userInfo.handle,
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        country: userInfo.country || 'N/A',
        city: userInfo.city || 'N/A',
        organization: userInfo.organization || 'N/A',
        rating: userInfo.rating || 0,
        maxRating: userInfo.maxRating || 0,
        rank: userInfo.rank || 'Unrated',
        maxRank: userInfo.maxRank || 'Unrated',
        rankColor: rankInfo.color,
        contribution: userInfo.contribution || 0,
        problemsSolved: solvedStats.count,
        contestsParticipated: ratingHistory.length,
        avatar: userInfo.avatar || ''
      });
      
    } catch (error) {
      console.error(`Error fetching user ${username}:`, error);
      results.push({
        success: false,
        error: error.message || 'Failed to fetch user data',
        username
      });
    }
  }
  
  res.json({ results });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CodeForces API', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'CodeForces Profile Analyzer API',
    version: '1.0.0',
    endpoints: {
      single: 'GET /api/codeforces/:handle',
      bulk: 'POST /api/codeforces/bulk (body: { usernames: [] })',
      health: 'GET /health'
    }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CodeForces API server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 API Key configured: ${API_KEY ? 'Yes' : 'No'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
