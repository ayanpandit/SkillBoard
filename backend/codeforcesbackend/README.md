# CodeForces API Backend

Backend service for fetching and processing CodeForces profile data with official API authentication.

## Features

- ✅ Real CodeForces API integration with SHA-512 authentication
- ✅ Rate limiting (1 request per 2 seconds) - CF API compliance
- ✅ Single user profile fetch with comprehensive data
- ✅ Bulk user profile fetch (multiple users)
- ✅ Statistics calculation and aggregation
- ✅ Production-ready with error handling
- ✅ CORS configured for production deployment
- ✅ Health check endpoint for monitoring

## Local Development Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**

Create a `.env` file (use `.env.example` as template):
```env
NODE_ENV=development
PORT=3002
CODEFORCES_API_KEY=your_api_key_here
CODEFORCES_API_SECRET=your_api_secret_here
```

3. **Start the development server:**
```bash
npm start
```

Server will run on `http://localhost:3002`

## API Endpoints

### `GET /api/codeforces/:handle`
Fetch complete profile data for a single user.

**Response:**
```json
{
  "success": true,
  "username": "tourist",
  "rating": 3900,
  "rank": "Legendary Grandmaster",
  "problemsSolved": 2500,
  "contestsParticipated": 150,
  "ratingHistory": [...],
  "languages": [...],
  "recentSubmissions": [...]
}
```

### `POST /api/codeforces/bulk`
Fetch profile data for multiple users.

**Request Body:**
```json
{
  "usernames": ["tourist", "Benq", "ecnerwala"]
}
```

**Response:**
```json
{
  "results": [
    { "success": true, "username": "tourist", ... },
    { "success": true, "username": "Benq", ... }
  ]
}
```

### `GET /health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "service": "CodeForces API",
  "timestamp": "2025-10-31T10:00:00.000Z"
}
```

## CodeForces API Information

- **Base URL:** `https://codeforces.com/api`
- **Rate Limit:** Maximum 1 request per 2 seconds
- **Authentication:** SHA-512 signature with API key/secret
- **Documentation:** https://codeforces.com/apiHelp

### API Methods Used:
- `user.info` - Get user profile information
- `user.status` - Get user submissions
- `user.rating` - Get contest rating history

## Deployment to Render

### Option 1: Deploy via Dashboard

1. **Create New Web Service** on Render.com
2. **Connect Repository:** Link your GitHub repository
3. **Configure Service:**
   - **Name:** `codeforces-api`
   - **Environment:** `Node`
   - **Region:** Choose nearest
   - **Branch:** `main`
   - **Root Directory:** `backend/codeforcesbackend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   CODEFORCES_API_KEY=your_api_key
   CODEFORCES_API_SECRET=your_api_secret
   ```

5. **Deploy!**

### Option 2: Deploy via render.yaml

1. Ensure `render.yaml` is configured (already included)
2. Push to GitHub
3. Import from Render Dashboard using "Blueprint"
4. Add environment variables in Render Dashboard
5. Deploy automatically

### Post-Deployment

1. **Test Health Endpoint:**
   ```bash
   curl https://your-app.onrender.com/health
   ```

2. **Test API:**
   ```bash
   curl https://your-app.onrender.com/api/codeforces/tourist
   ```

3. **Update Frontend .env:**
   ```env
   VITE_CODEFORCES_API_URL=https://your-app.onrender.com/api/codeforces
   VITE_CODEFORCES_API_BULK_URL=https://your-app.onrender.com/api/codeforces/bulk
   ```

## Production Considerations

### Rate Limiting
- Automatic 2-second delay between requests
- Prevents CF API ban
- Handles bulk requests sequentially

### Error Handling
- Comprehensive try-catch blocks
- Graceful error responses
- User-friendly error messages

### CORS Configuration
- Production origins whitelisted
- Development allows all origins
- Credentials support enabled

### Performance
- Efficient data processing
- Minimal memory footprint
- Fast response times

## Monitoring

- Use `/health` endpoint for uptime monitoring
- Monitor response times
- Check error rates in Render logs

## Troubleshooting

### "Call limit exceeded" Error
- CF API rate limit hit
- Wait 2 seconds between requests
- Check rate limiting implementation

### "FAILED" Status from CF API
- Check API key/secret validity
- Verify signature generation
- Check CF API status

### CORS Errors
- Verify frontend URL in CORS whitelist
- Check credentials configuration
- Ensure proper headers

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | Environment (development/production) |
| `PORT` | No | Server port (default: 10000) |
| `CODEFORCES_API_KEY` | Yes | CF API key from settings |
| `CODEFORCES_API_SECRET` | Yes | CF API secret from settings |

## Data Structure

### User Profile Response
```javascript
{
  success: boolean,
  username: string,
  handle: string,
  firstName: string,
  lastName: string,
  country: string,
  city: string,
  organization: string,
  rating: number,
  maxRating: number,
  rank: string,
  maxRank: string,
  rankColor: string,
  contribution: number,
  friendOfCount: number,
  avatar: string,
  registrationTimeSeconds: number,
  lastOnlineTimeSeconds: number,
  problemsSolved: number,
  solvedByDifficulty: object,
  contestsParticipated: number,
  ratingHistory: array,
  languages: array,
  totalSubmissions: number,
  recentSubmissions: array
}
```

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **HTTP Client:** Axios
- **Crypto:** SHA-512 for signatures
- **Environment:** dotenv

## License

MIT

## Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ for SkillBoard

