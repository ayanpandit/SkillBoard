# CodeChef Bulk Search Configuration Guide

This guide explains how to configure and use the parallel bulk search system for CodeChef profiles.

## 📋 Table of Contents
- [Overview](#overview)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Increasing/Decreasing Workers](#increasingdecreasing-workers)
- [Troubleshooting](#troubleshooting)
- [Performance Tips](#performance-tips)

---

## 🎯 Overview

The CodeChef Bulk Search Manager splits username searches across multiple API endpoints (workers) to process them in parallel. Each worker:
- Processes its assigned batch of usernames
- Maintains a 1.5-second delay between requests
- Retries failed requests automatically
- Reports progress independently

**Benefits:**
- ⚡ Faster bulk searches (N times faster with N workers)
- 🛡️ Avoids rate limiting with built-in delays
- 📊 Real-time progress tracking
- 🔄 Automatic retry on failures

---

## 🔧 How It Works

### Example with 20 usernames and 4 workers:

```
Total Usernames: 20
Workers: 4

Distribution:
├─ Worker 1: Users 1, 5, 9, 13, 17    (5 users)
├─ Worker 2: Users 2, 6, 10, 14, 18   (5 users)
├─ Worker 3: Users 3, 7, 11, 15, 19   (5 users)
└─ Worker 4: Users 4, 8, 12, 16, 20   (5 users)

All workers process simultaneously!
Each worker waits 1.5s between requests.
```

### Timeline Visualization:
```
Without parallel processing:
[===== 30 seconds =====] (20 users × 1.5s = 30s)

With 4 parallel workers:
[== 7.5 seconds ==] (5 users × 1.5s = 7.5s per worker)
```

---

## ⚙️ Configuration

### 1. **Configure Number of Workers**

Open `src/utils/codechefBulkManager.js` and modify:

```javascript
/**
 * Number of parallel workers (API endpoints) to use
 */
const NUM_WORKERS = 4;  // ← Change this number
```

**Recommended values:**
- `2-3 workers` - Conservative (slower but safer)
- `4-6 workers` - Balanced (recommended)
- `8-10 workers` - Aggressive (faster but needs more API endpoints)

### 2. **Configure Request Delay**

```javascript
/**
 * Delay between consecutive requests (in milliseconds)
 */
const DELAY_BETWEEN_REQUESTS = 1500;  // ← Change this value
```

**Recommended values:**
- `2000ms` (2 seconds) - Very safe, slower
- `1500ms` (1.5 seconds) - Balanced (default)
- `1000ms` (1 second) - Fast, but monitor for rate limiting

### 3. **Configure Retry Settings**

```javascript
/**
 * Maximum number of retry attempts for failed requests
 */
const MAX_RETRIES = 2;  // ← Number of retry attempts

/**
 * Delay before retrying a failed request (in milliseconds)
 */
const RETRY_DELAY = 2000;  // ← Delay before retry
```

---

## 📈 Increasing/Decreasing Workers

### To INCREASE workers (e.g., from 4 to 6):

#### Step 1: Update `codechefBulkManager.js`
```javascript
const NUM_WORKERS = 6;  // Changed from 4 to 6
```

#### Step 2: Add API URLs to `.env`
Add these lines to your `.env` file:

```properties
# Worker 5
VITE_CODECHEF_API_URL_5_DEV=https://codechef-api-5.onrender.com/api/codechef
VITE_CODECHEF_API_URL_5_PROD=https://codechef-api-5.onrender.com/api/codechef

# Worker 6
VITE_CODECHEF_API_URL_6_DEV=https://codechef-api-6.onrender.com/api/codechef
VITE_CODECHEF_API_URL_6_PROD=https://codechef-api-6.onrender.com/api/codechef
```

#### Step 3: Restart your development server
```bash
npm run dev
```

### To DECREASE workers (e.g., from 4 to 2):

#### Step 1: Update `codechefBulkManager.js`
```javascript
const NUM_WORKERS = 2;  // Changed from 4 to 2
```

#### Step 2: No need to remove .env entries
The system will only use the first 2 workers.

#### Step 3: Restart your development server
```bash
npm run dev
```

---

## 🔍 Troubleshooting

### Problem: Getting Rate Limited / Blocked

**Solution 1:** Increase delay between requests
```javascript
const DELAY_BETWEEN_REQUESTS = 2500;  // Increase to 2.5 seconds
```

**Solution 2:** Decrease number of workers
```javascript
const NUM_WORKERS = 2;  // Use fewer workers
```

### Problem: Too Slow

**Solution 1:** Increase number of workers (ensure you have API endpoints)
```javascript
const NUM_WORKERS = 8;  // More parallel processing
```

**Solution 2:** Decrease delay (carefully!)
```javascript
const DELAY_BETWEEN_REQUESTS = 1000;  // Reduce to 1 second (monitor closely)
```

### Problem: Missing API URL Warning

```
⚠️ Missing environment variable: VITE_CODECHEF_API_URL_3_DEV
```

**Solution:** Add the missing API URL to `.env`:
```properties
VITE_CODECHEF_API_URL_3_DEV=https://your-api-url.com/api/codechef
VITE_CODECHEF_API_URL_3_PROD=https://your-api-url.com/api/codechef
```

### Problem: High Failure Rate

**Possible causes:**
1. API endpoints are down
2. Rate limiting is too aggressive
3. Network issues

**Solutions:**
- Increase `RETRY_DELAY` and `MAX_RETRIES`
- Check API endpoint health
- Increase `DELAY_BETWEEN_REQUESTS`

---

## 🚀 Performance Tips

### 1. **Optimal Worker Count**
```
Formula: NUM_WORKERS = (Total Users / 5) rounded up, capped at 10

Examples:
- 20 users → 4 workers optimal
- 50 users → 6-8 workers optimal
- 100 users → 8-10 workers optimal
```

### 2. **Balance Speed vs Safety**
```javascript
// Conservative (safest)
const NUM_WORKERS = 3;
const DELAY_BETWEEN_REQUESTS = 2000;

// Balanced (recommended)
const NUM_WORKERS = 4;
const DELAY_BETWEEN_REQUESTS = 1500;

// Aggressive (fastest)
const NUM_WORKERS = 8;
const DELAY_BETWEEN_REQUESTS = 1000;
```

### 3. **Monitor Console Logs**
Watch for these indicators:
- ✅ High success rate → System working well
- ❌ Many retries → Increase delays or reduce workers
- ⏸️ Long wait times → Can increase workers or decrease delay

### 4. **Time Estimation**
```
Estimated Time = (Users per Worker × Delay) + Buffer

Example with 20 users, 4 workers, 1.5s delay:
= (5 users × 1.5s) + 2s buffer
= 7.5s + 2s = 9.5s total
```

---

## 📊 Progress Tracking

The system provides two types of progress callbacks:

### Individual Worker Progress
```javascript
{
  workerId: 1,              // Which worker
  completed: 3,             // Users completed by this worker
  total: 5,                 // Total users for this worker
  currentUsername: "user3", // Current user being processed
  success: true            // Was the last request successful
}
```

### Overall Progress
```javascript
{
  completedTotal: 12,  // Total users completed across all workers
  totalCount: 20,      // Total users to process
  percentage: 60       // Percentage complete
}
```

---

## 📝 Quick Reference Card

| Configuration | Location | Default | Recommended Range |
|--------------|----------|---------|-------------------|
| Workers | `codechefBulkManager.js` → `NUM_WORKERS` | 4 | 2-10 |
| Request Delay | `codechefBulkManager.js` → `DELAY_BETWEEN_REQUESTS` | 1500ms | 1000-3000ms |
| Max Retries | `codechefBulkManager.js` → `MAX_RETRIES` | 2 | 2-5 |
| Retry Delay | `codechefBulkManager.js` → `RETRY_DELAY` | 2000ms | 2000-5000ms |
| API URLs | `.env` → `VITE_CODECHEF_API_URL_N_DEV/PROD` | N/A | 1 per worker |

---

## 🎓 Example Configurations

### Small Scale (10-30 users)
```javascript
const NUM_WORKERS = 3;
const DELAY_BETWEEN_REQUESTS = 1500;
```

### Medium Scale (30-100 users)
```javascript
const NUM_WORKERS = 6;
const DELAY_BETWEEN_REQUESTS = 1200;
```

### Large Scale (100+ users)
```javascript
const NUM_WORKERS = 10;
const DELAY_BETWEEN_REQUESTS = 1000;
```

---

## 🔗 Related Files

- **Bulk Manager:** `src/utils/codechefBulkManager.js`
- **Environment Config:** `.env`
- **Component:** `src/components/CodeChefProfileAnalyzer.jsx`
- **This Guide:** `src/utils/CODECHEF_BULK_SEARCH_README.md`

---

**Need help?** Check the console logs - they're verbose and will guide you! 🎯
