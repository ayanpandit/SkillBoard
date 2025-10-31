# Environment Variables Quick Reference

## Required for Production

### Render Dashboard → Your Service → Environment

Add these environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Sets environment mode |
| `CODEFORCES_API_KEY` | `6e5d3593af8f27d2e56780f93a9632d30e62fefe` | Your CF API key |
| `CODEFORCES_API_SECRET` | `0e1659f1f6806f751f6c2791c8236096674fb493` | Your CF API secret |

## Port Configuration

- **Automatic:** Render sets `PORT` environment variable automatically
- **Default Fallback:** 10000 (if PORT not set)
- **Local Development:** 3002

## Frontend Configuration

After deploying backend, update **Frontend/.env**:

```env
# Replace YOUR-APP-NAME with your Render service name
VITE_CODEFORCES_API_URL=https://YOUR-APP-NAME.onrender.com/api/codeforces
VITE_CODEFORCES_API_BULK_URL=https://YOUR-APP-NAME.onrender.com/api/codeforces/bulk
```

## Security Notes

- ✅ Never commit `.env` file
- ✅ Use Render's environment variable interface
- ✅ Keep API keys secret
- ✅ Rotate keys if compromised

## Testing Your Deployment

```bash
# Health Check
curl https://YOUR-APP-NAME.onrender.com/health

# Test API
curl https://YOUR-APP-NAME.onrender.com/api/codeforces/tourist
```

## Common Issues

### "API Key not configured"
→ Add `CODEFORCES_API_KEY` in Render Environment Variables

### "CORS Error"
→ Add your frontend URL to CORS whitelist in server.js

### "Service won't start"
→ Check Render logs for missing dependencies or env vars
