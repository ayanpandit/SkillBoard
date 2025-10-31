# CodeForces API - Render Deployment Guide

## 📋 Pre-Deployment Checklist

- [x] `.env` file is in `.gitignore`
- [x] `Procfile` created
- [x] `render.yaml` configured
- [x] CORS origins configured
- [x] Health check endpoint ready
- [x] Port configured via environment variable
- [x] Graceful shutdown implemented

## 🚀 Deployment Steps

### Step 1: Prepare Repository

1. Ensure all files are committed:
```bash
git add .
git commit -m "feat: CodeForces API ready for Render deployment"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (`SkillBoard`)

### Step 3: Configure Service

**Basic Settings:**
- **Name:** `codeforces-api` (or your preferred name)
- **Region:** Choose closest to your users (e.g., Oregon)
- **Branch:** `main`
- **Root Directory:** `backend/codeforcesbackend`
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- **Plan:** Free (or Starter for better performance)

### Step 4: Add Environment Variables

In the **Environment** section, add:

```
NODE_ENV=production
CODEFORCES_API_KEY=6e5d3593af8f27d2e56780f93a9632d30e62fefe
CODEFORCES_API_SECRET=0e1659f1f6806f751f6c2791c8236096674fb493
```

**⚠️ IMPORTANT:** Never commit these values to Git!

### Step 5: Configure Health Check

- **Health Check Path:** `/health`
- Leave other settings as default

### Step 6: Deploy!

Click **"Create Web Service"** and wait for deployment to complete (~2-3 minutes)

## ✅ Post-Deployment Verification

### 1. Test Health Endpoint

```bash
curl https://your-service-name.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "CodeForces API",
  "timestamp": "2025-10-31T10:00:00.000Z"
}
```

### 2. Test Single User Endpoint

```bash
curl https://your-service-name.onrender.com/api/codeforces/tourist
```

Should return user profile data.

### 3. Test Bulk Endpoint

```bash
curl -X POST https://your-service-name.onrender.com/api/codeforces/bulk \
  -H "Content-Type: application/json" \
  -d '{"usernames":["tourist","Benq"]}'
```

Should return array of user profiles.

## 🔧 Update Frontend Configuration

After successful deployment, update your Frontend `.env`:

```env
# Replace with your actual Render URL
VITE_CODEFORCES_API_URL=https://your-service-name.onrender.com/api/codeforces
VITE_CODEFORCES_API_BULK_URL=https://your-service-name.onrender.com/api/codeforces/bulk
```

## 📊 Monitoring

### View Logs

In Render Dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. Monitor real-time logs

### Set Up Alerts (Optional)

1. Go to **Settings** → **Alerts**
2. Configure email notifications for:
   - Deploy failures
   - Service downtime
   - High error rates

## 🐛 Troubleshooting

### Service Won't Start

**Check logs for:**
- Missing environment variables
- Port binding issues
- Dependency installation errors

**Solution:**
```bash
# Ensure all dependencies are in package.json
npm install --save express cors axios dotenv
```

### CORS Errors

**Problem:** Frontend can't connect to backend

**Solution:**
Add your frontend URL to CORS whitelist in `server.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend-url.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

### Rate Limiting Issues

**Problem:** Getting "Call limit exceeded" from CodeForces

**Solution:**
- Our rate limiting is already implemented (2 seconds between requests)
- Check if multiple instances are running
- Verify delay implementation in code

### Health Check Failing

**Problem:** Render shows service as unhealthy

**Solution:**
1. Verify `/health` endpoint works locally
2. Check if server is binding to `0.0.0.0` not `localhost`
3. Ensure PORT environment variable is used

## 🔄 Updating the Service

### Method 1: Auto-Deploy (Recommended)

Simply push to your repository:
```bash
git add .
git commit -m "update: Your changes"
git push origin main
```

Render will automatically deploy the changes.

### Method 2: Manual Deploy

1. Go to Render Dashboard
2. Select your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

## 💰 Pricing & Performance

### Free Tier
- ✅ 750 hours/month (enough for 1 service)
- ⏱️ Spins down after 15 minutes of inactivity
- 🐌 Cold start: ~30 seconds

### Starter Tier ($7/month)
- ✅ Always on
- ⚡ No cold starts
- 🚀 Better performance

## 🔒 Security Best Practices

1. **Never commit `.env` file**
2. **Rotate API keys periodically**
3. **Use environment variables for all secrets**
4. **Keep dependencies updated:**
   ```bash
   npm update
   npm audit fix
   ```
5. **Monitor access logs regularly**

## 📈 Performance Optimization

### Enable Caching (Future Enhancement)

Add Redis for caching frequently accessed profiles:
```javascript
// Cache user data for 10 minutes
const cacheKey = `user:${handle}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### Load Balancing (High Traffic)

For high traffic, deploy multiple instances:
- Use Render's **"Instance Count"** setting
- Add a CDN (Cloudflare) in front

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js Deployment Guide](https://render.com/docs/deploy-node-express-app)
- [CodeForces API Help](https://codeforces.com/apiHelp)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## 🎉 Your API is Now Live!

You now have a production-ready CodeForces API backend deployed on Render! 🚀

### Next Steps:
1. ✅ Update frontend to use production API URL
2. ✅ Test all features end-to-end
3. ✅ Set up monitoring and alerts
4. ✅ Share with your users!

---

**Need Help?** Check the logs in Render Dashboard or create an issue in the repository.
