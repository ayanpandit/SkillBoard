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
      // Fetch user, repos, and contributions in parallel
      const [user, repos, contributions] = await Promise.all([
        githubApiRequest(`/users/${username}`, username),
        githubApiRequest(`/users/${username}/repos?per_page=100&sort=updated`, username),
        fetchContributionGraph(username)
      ]);
      
      // Calculate basic stats
      const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
      const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
      const languageStats = calculateLanguageStats(repos);
      const totalContributions = contributions?.contributionCalendar?.totalContributions || 0;
      
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
        totalContributions,
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

// Route: Get single repository details
app.get('/api/github/repo/:owner/:repo', async (req, res) => {
  const { owner, repo } = req.params;
  
  try {
    console.log(`Fetching repository: ${owner}/${repo}`);
    
    // Fetch all repo data in parallel
    const [repoData, languages, contributors, commits, issues, pulls, releases, topics, readme] = await Promise.all([
      githubApiRequest(`/repos/${owner}/${repo}`, owner),
      githubApiRequest(`/repos/${owner}/${repo}/languages`, owner).catch(() => ({})),
      githubApiRequest(`/repos/${owner}/${repo}/contributors?per_page=100`, owner).catch(() => []),
      githubApiRequest(`/repos/${owner}/${repo}/commits?per_page=100`, owner).catch(() => []),
      githubApiRequest(`/repos/${owner}/${repo}/issues?state=all&per_page=100`, owner).catch(() => []),
      githubApiRequest(`/repos/${owner}/${repo}/pulls?state=all&per_page=100`, owner).catch(() => []),
      githubApiRequest(`/repos/${owner}/${repo}/releases?per_page=100`, owner).catch(() => []),
      githubApiRequest(`/repos/${owner}/${repo}/topics`, owner).catch(() => ({ names: [] })),
      githubApiRequest(`/repos/${owner}/${repo}/readme`, owner).catch(() => null)
    ]);

    // Check if repo is private
    if (repoData.private) {
      return res.json({
        success: true,
        isPrivate: true,
        owner,
        repo,
        message: 'This is a private repository. Limited information available.',
        basic: {
          name: repoData.name,
          fullName: repoData.full_name,
          private: true,
          url: repoData.html_url
        }
      });
    }

    // Calculate language percentages
    const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    const languageBreakdown = Object.entries(languages).map(([lang, bytes]) => ({
      language: lang,
      bytes,
      percentage: ((bytes / totalBytes) * 100).toFixed(2)
    })).sort((a, b) => b.bytes - a.bytes);

    // Process contributors
    const topContributors = contributors.slice(0, 20).map(c => ({
      username: c.login,
      contributions: c.contributions,
      avatar: c.avatar_url,
      profile: c.html_url
    }));

    // Process commit activity
    const commitActivity = commits.slice(0, 50).map(c => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url
    }));

    // Separate issues and PRs
    const openIssues = issues.filter(i => !i.pull_request && i.state === 'open');
    const closedIssues = issues.filter(i => !i.pull_request && i.state === 'closed');
    const openPRs = pulls.filter(p => p.state === 'open');
    const closedPRs = pulls.filter(p => p.state === 'closed' || p.state === 'merged');

    // Build comprehensive response
    const repoAnalysis = {
      success: true,
      isPrivate: false,
      basic: {
        name: repoData.name,
        fullName: repoData.full_name,
        owner: repoData.owner.login,
        ownerAvatar: repoData.owner.avatar_url,
        description: repoData.description || 'No description',
        url: repoData.html_url,
        homepage: repoData.homepage || null,
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,
        size: repoData.size,
        defaultBranch: repoData.default_branch,
        license: repoData.license?.name || 'No license'
      },
      stats: {
        stars: repoData.stargazers_count,
        watchers: repoData.watchers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        subscribers: repoData.subscribers_count,
        networkCount: repoData.network_count,
        totalCommits: commits.length,
        totalContributors: contributors.length,
        totalReleases: releases.length
      },
      features: {
        hasIssues: repoData.has_issues,
        hasProjects: repoData.has_projects,
        hasDownloads: repoData.has_downloads,
        hasWiki: repoData.has_wiki,
        hasPages: repoData.has_pages,
        hasDiscussions: repoData.has_discussions,
        archived: repoData.archived,
        disabled: repoData.disabled,
        fork: repoData.fork,
        template: repoData.is_template
      },
      languages: languageBreakdown,
      topics: topics.names || [],
      contributors: topContributors,
      recentCommits: commitActivity,
      issues: {
        open: openIssues.length,
        closed: closedIssues.length,
        recentOpen: openIssues.slice(0, 10).map(i => ({
          number: i.number,
          title: i.title,
          user: i.user.login,
          createdAt: i.created_at,
          url: i.html_url,
          labels: i.labels.map(l => l.name)
        }))
      },
      pullRequests: {
        open: openPRs.length,
        closed: closedPRs.length,
        recentOpen: openPRs.slice(0, 10).map(p => ({
          number: p.number,
          title: p.title,
          user: p.user.login,
          createdAt: p.created_at,
          url: p.html_url
        }))
      },
      releases: releases.slice(0, 10).map(r => ({
        name: r.name || r.tag_name,
        tagName: r.tag_name,
        publishedAt: r.published_at,
        author: r.author?.login,
        url: r.html_url,
        downloads: r.assets.reduce((sum, a) => sum + a.download_count, 0)
      })),
      readme: readme ? {
        content: Buffer.from(readme.content, 'base64').toString('utf-8').substring(0, 5000),
        size: readme.size,
        url: readme.html_url
      } : null
    };
    
    res.json(repoAnalysis);
    
  } catch (error) {
    console.error(`Error fetching repository ${owner}/${repo}:`, error);
    if (error.response?.status === 404) {
      return res.json({
        success: false,
        error: 'Repository not found',
        owner,
        repo
      });
    }
    res.json({
      success: false,
      error: error.message || 'Failed to fetch repository data',
      owner,
      repo
    });
  }
});

// Route: Bulk repository analysis
app.post('/api/github/repos/bulk', async (req, res) => {
  const { repositories } = req.body;
  
  if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
    return res.status(400).json({ error: 'Invalid request: repositories array required' });
  }
  
  console.log(`Bulk repository request for ${repositories.length} repos`);
  
  // Process all repos in parallel
  const results = await Promise.all(repositories.map(async (repoUrl) => {
    try {
      // Parse GitHub URL or owner/repo format
      let owner, repo;
      
      if (repoUrl.includes('github.com')) {
        const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
        if (match) {
          owner = match[1];
          repo = match[2].replace(/\.git$/, '');
        }
      } else if (repoUrl.includes('/')) {
        [owner, repo] = repoUrl.split('/');
      }
      
      if (!owner || !repo) {
        return {
          success: false,
          error: 'Invalid repository format',
          input: repoUrl
        };
      }

      // Fetch basic repo data
      const repoData = await githubApiRequest(`/repos/${owner}/${repo}`, owner);
      
      if (repoData.private) {
        return {
          success: true,
          isPrivate: true,
          name: repoData.full_name,
          owner,
          repo,
          url: repoData.html_url
        };
      }

      // Fetch languages for breakdown
      const languages = await githubApiRequest(`/repos/${owner}/${repo}/languages`, owner).catch(() => ({}));
      const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
      const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0];

      return {
        success: true,
        isPrivate: false,
        name: repoData.full_name,
        owner,
        repo,
        description: repoData.description || 'No description',
        url: repoData.html_url,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        openIssues: repoData.open_issues_count,
        language: topLanguage ? topLanguage[0] : 'N/A',
        license: repoData.license?.name || 'No license',
        createdAt: repoData.created_at,
        updatedAt: repoData.updated_at,
        size: repoData.size,
        archived: repoData.archived,
        fork: repoData.fork
      };
    } catch (error) {
      console.error(`Error fetching repository ${repoUrl}:`, error);
      return {
        success: false,
        error: error.response?.status === 404 ? 'Repository not found' : error.message,
        input: repoUrl
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
