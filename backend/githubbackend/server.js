const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Configure axios with connection pooling for extreme speed
const httpAgent = new http.Agent({ 
  keepAlive: true, 
  maxSockets: 500,
  maxFreeSockets: 100,
  timeout: 60000,
  keepAliveMsecs: 30000
});

const httpsAgent = new https.Agent({ 
  keepAlive: true, 
  maxSockets: 500,
  maxFreeSockets: 100,
  timeout: 60000,
  keepAliveMsecs: 30000,
  rejectUnauthorized: true
});

axios.defaults.httpAgent = httpAgent;
axios.defaults.httpsAgent = httpsAgent;
axios.defaults.timeout = 10000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://skillboard-nit5.onrender.com', 'https://skillboard.vercel.app', 'https://skillboard.netlify.app']
    : '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// GitHub API Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = 'https://api.github.com';

// In-memory cache with TTL
class TTLCache {
  constructor(ttl = 300000) { // 5 minutes default
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

// Make GitHub API request with caching
const githubApiRequest = async (endpoint, username) => {
  const cacheKey = `${username}:${endpoint}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached;
  }
  
  try {
    const response = await axios.get(`${GITHUB_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SkillBoard-GitHub-Analyzer'
      },
      timeout: 10000
    });
    
    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error(`GitHub API Error (${endpoint}):`, error.message);
    if (error.response?.status === 404) {
      throw new Error('User not found');
    }
    if (error.response?.status === 403) {
      throw new Error('API rate limit exceeded or access forbidden');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch data');
  }
};

// GraphQL query for contribution data
const fetchContributionGraph = async (username) => {
  const cacheKey = `${username}:contributions`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                weekday
              }
            }
          }
          contributionYears
        }
      }
    }
  `;

  try {
    const response = await axios.post('https://api.github.com/graphql', {
      query,
      variables: { username }
    }, {
      headers: {
        'Authorization': `bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const data = response.data.data?.user?.contributionsCollection;
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching contribution graph:', error.message);
    return null;
  }
};

// Helper to calculate language stats
const calculateLanguageStats = (repos) => {
  const languageBytes = {};
  let totalBytes = 0;

  repos.forEach(repo => {
    if (repo.language) {
      languageBytes[repo.language] = (languageBytes[repo.language] || 0) + (repo.size || 0);
      totalBytes += repo.size || 0;
    }
  });

  return Object.entries(languageBytes)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(2) : 0,
      repos: repos.filter(r => r.language === language).length
    }))
    .sort((a, b) => b.bytes - a.bytes);
};

// Helper to get repo topics
const getRepoTopics = async (username, repoName) => {
  try {
    const data = await githubApiRequest(`/repos/${username}/${repoName}/topics`, username);
    return data.names || [];
  } catch (error) {
    return [];
  }
};

// Route: Get single user profile
app.get('/api/github/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    console.log(`Fetching GitHub data for user: ${username}`);
    
    // Fetch user profile
    const user = await githubApiRequest(`/users/${username}`, username);
    
    // Fetch repositories (public only, max 100)
    const repos = await githubApiRequest(`/users/${username}/repos?per_page=100&sort=updated`, username);
    
    // Fetch contribution graph
    const contributions = await fetchContributionGraph(username);
    
    // Fetch events (recent activity)
    const events = await githubApiRequest(`/users/${username}/events/public?per_page=30`, username);
    
    // Calculate statistics
    const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
    const languageStats = calculateLanguageStats(repos);
    
    // Get popular repos (by stars)
    const popularRepos = repos
      .filter(r => !r.fork)
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, 10)
      .map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        openIssues: repo.open_issues_count,
        url: repo.html_url,
        homepage: repo.homepage,
        topics: repo.topics || [],
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        size: repo.size,
        defaultBranch: repo.default_branch,
        isPrivate: repo.private,
        isFork: repo.fork,
        isArchived: repo.archived
      }));
    
    // Get recent repos
    const recentRepos = repos
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 10)
      .map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        updatedAt: repo.updated_at,
        createdAt: repo.created_at
      }));

    // Parse recent activity
    const recentActivity = events.slice(0, 20).map(event => ({
      type: event.type,
      repo: event.repo?.name,
      createdAt: event.created_at,
      payload: {
        action: event.payload?.action,
        refType: event.payload?.ref_type,
        ref: event.payload?.ref,
        size: event.payload?.size,
        commits: event.payload?.commits?.length || 0,
        issue: event.payload?.issue ? {
          title: event.payload.issue.title,
          number: event.payload.issue.number
        } : null,
        pullRequest: event.payload?.pull_request ? {
          title: event.payload.pull_request.title,
          number: event.payload.pull_request.number
        } : null
      }
    }));

    // Build contribution heatmap
    let contributionHeatmap = {};
    let currentStreak = 0;
    let longestStreak = 0;
    let totalContributions = 0;

    if (contributions?.contributionCalendar) {
      const weeks = contributions.contributionCalendar.weeks;
      let streak = 0;
      let dates = [];

      weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          contributionHeatmap[day.date] = day.contributionCount;
          totalContributions += day.contributionCount;
          dates.push({ date: day.date, count: day.contributionCount });
        });
      });

      // Calculate streaks
      dates.sort((a, b) => new Date(b.date) - new Date(a.date));
      for (let i = 0; i < dates.length; i++) {
        if (dates[i].count > 0) {
          streak++;
          if (i === 0) currentStreak = streak;
          longestStreak = Math.max(longestStreak, streak);
        } else {
          streak = 0;
        }
      }
    }

    // Build response
    const profileData = {
      success: true,
      username: user.login,
      profile: {
        name: user.name || user.login,
        bio: user.bio || '',
        avatar: user.avatar_url,
        company: user.company || 'N/A',
        location: user.location || 'N/A',
        email: user.email || 'N/A',
        blog: user.blog || '',
        twitter: user.twitter_username || '',
        hireable: user.hireable,
        publicRepos: user.public_repos,
        publicGists: user.public_gists,
        followers: user.followers,
        following: user.following,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        profileUrl: user.html_url
      },
      stats: {
        totalStars: totalStars,
        totalForks: totalForks,
        totalRepos: repos.length,
        originalRepos: repos.filter(r => !r.fork).length,
        forkedRepos: repos.filter(r => r.fork).length,
        totalContributions: totalContributions,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        contributionYears: contributions?.contributionYears || []
      },
      languages: languageStats.slice(0, 10),
      popularRepos,
      recentRepos,
      recentActivity,
      contributionHeatmap,
      contributionGraph: contributions?.contributionCalendar || null
    };
    
    res.json(profileData);
    
  } catch (error) {
    console.error(`Error fetching user ${username}:`, error);
    res.json({
      success: false,
      error: error.message || 'Failed to fetch user data',
      username
    });
  }
});

// Route: Bulk user fetch
app.post('/api/github/bulk', async (req, res) => {
  const { usernames } = req.body;
  
  if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
    return res.status(400).json({ error: 'Invalid request: usernames array required' });
  }
  
  console.log(`Bulk request for ${usernames.length} users`);
  
  // Process all users in parallel for maximum speed
  const results = await Promise.all(usernames.map(async (username) => {
    try {
      // Fetch user and repos in parallel
      const [user, repos] = await Promise.all([
        githubApiRequest(`/users/${username}`, username),
        githubApiRequest(`/users/${username}/repos?per_page=100&sort=updated`, username)
      ]);
      
      // Calculate basic stats
      const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
      const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
      const languageStats = calculateLanguageStats(repos);
      
      return {
        success: true,
        username: user.login,
        name: user.name || user.login,
        avatar: user.avatar_url,
        bio: user.bio || '',
        company: user.company || 'N/A',
        location: user.location || 'N/A',
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        totalStars,
        totalForks,
        topLanguage: languageStats[0]?.language || 'N/A',
        profileUrl: user.html_url
      };
    } catch (error) {
      console.error(`Error fetching user ${username}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user data',
        username
      };
    }
  }));
  
  res.json({ results });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'GitHub API', 
    timestamp: new Date().toISOString(),
    cacheSize: cache.cache.size
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'GitHub Profile Analyzer API',
    version: '1.0.0',
    endpoints: {
      single: 'GET /api/github/:username',
      bulk: 'POST /api/github/bulk (body: { usernames: [] })',
      health: 'GET /health'
    }
  });
});

// Cache management
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GitHub API server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 GitHub Token configured: ${GITHUB_TOKEN ? 'Yes' : 'No'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    cache.clear();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    cache.clear();
    process.exit(0);
  });
});
