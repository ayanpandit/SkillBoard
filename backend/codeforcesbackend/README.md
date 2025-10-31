# CodeForces API Backend

Backend service for fetching and processing CodeForces profile data.

## Features

- Real CodeForces API integration with authentication
- Rate limiting (1 request per 2 seconds)
- Single user profile fetch
- Bulk user profile fetch
- Comprehensive statistics calculation
- SHA-512 signature generation for authenticated requests

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
CODEFORCES_API_KEY=your_api_key
CODEFORCES_API_SECRET=your_api_secret
PORT=3002
```

3. Start the server:
```bash
npm start
```

## API Endpoints

### GET /api/codeforces/:handle
Fetch complete profile data for a single user.

### POST /api/codeforces/bulk
Fetch profile data for multiple users.
Body: `{ "usernames": ["handle1", "handle2", ...] }`

### GET /health
Health check endpoint.

## CodeForces API Rate Limit

- Maximum 1 request per 2 seconds
- Automatic rate limiting implemented

## Data Returned

- User info (name, country, organization, etc.)
- Rating and rank information
- Problems solved with difficulty breakdown
- Contest participation history
- Recent submissions
- Programming language statistics
