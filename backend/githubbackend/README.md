# GitHub Profile Analyzer Backend

Backend API server for fetching comprehensive GitHub profile data for SkillBoard.

## Features

- 🚀 Fast and efficient GitHub data fetching
- 🔒 Secure token-based authentication
- 💾 In-memory caching with TTL
- ⚡ Rate limiting to prevent API abuse
- 📊 Comprehensive statistics and analytics
- 🎯 Bulk user processing support

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your GitHub Personal Access Token to `.env`:
   - Go to https://github.com/settings/tokens
   - Create a new token with scopes: `public_repo`, `read:user`
   - Add the token to your `.env` file

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Get Single User Profile
```
GET /api/github/:username
```

Returns comprehensive user data including:
- Profile information
- Repository statistics
- Language breakdown
- Contribution graph
- Recent activity
- Popular repositories

### Bulk User Fetch
```
POST /api/github/bulk
Content-Type: application/json

{
  "usernames": ["user1", "user2", "user3"]
}
```

Returns basic stats for multiple users.

### Health Check
```
GET /health
```

Returns server status and cache information.

### Clear Cache
```
POST /api/cache/clear
```

Clears the in-memory cache.

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3003)
- `GITHUB_TOKEN` - GitHub Personal Access Token

## Deployment

Deploy to Render.com:
```bash
# Push to GitHub
git push origin main

# Render will auto-deploy using render.yaml
```

## Rate Limiting

- GitHub API: 5000 requests/hour with token
- Internal rate limiting: 100ms between requests
- Cache TTL: 5 minutes

## Author

Ayan Pandey - SkillBoard 2025
