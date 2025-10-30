# 🚀 CodeChef Bulk Search System - Quick Start

## ✨ What You Have Now

A professional parallel bulk search system that:
- ✅ Processes multiple users simultaneously (4 workers by default)
- ✅ Maintains 1.5-second delays to avoid rate limiting
- ✅ Automatically retries failed requests
- ✅ Provides real-time progress tracking
- ✅ Easy to configure and scale

---

## 📁 Files Created

1. **`src/utils/codechefBulkManager.js`** - Main bulk search engine
2. **`src/utils/codechefBulkConfig.js`** - Easy configuration file (⭐ START HERE)
3. **`src/utils/CODECHEF_BULK_SEARCH_README.md`** - Detailed documentation
4. **`.env`** - Updated with API endpoints

---

## ⚡ How to Change Number of Workers

### 🎯 EASIEST WAY (Recommended):

**Step 1:** Open `src/utils/codechefBulkConfig.js`

**Step 2:** Change this line:
```javascript
NUM_WORKERS: 4,  // ← Change this number (e.g., to 6, 8, etc.)
```

**Step 3:** Add corresponding API URLs to `.env`:
```properties
# Add these for worker 5
VITE_CODECHEF_API_URL_5_DEV=https://your-api-url.com/api/codechef
VITE_CODECHEF_API_URL_5_PROD=https://your-api-url.com/api/codechef

# Add these for worker 6
VITE_CODECHEF_API_URL_6_DEV=https://your-api-url.com/api/codechef
VITE_CODECHEF_API_URL_6_PROD=https://your-api-url.com/api/codechef
```

**Step 4:** Restart your dev server
```bash
npm run dev
```

**That's it!** 🎉

---

## 🎛️ Configuration Options

All settings are in `src/utils/codechefBulkConfig.js`:

```javascript
export const CONFIG = {
  NUM_WORKERS: 4,              // Number of parallel workers
  DELAY_BETWEEN_REQUESTS: 1500, // Delay in milliseconds
  MAX_RETRIES: 2,              // Retry attempts on failure
  RETRY_DELAY: 2000,           // Delay before retry
  REQUEST_TIMEOUT: 30000,      // Request timeout
  VERBOSE_LOGGING: true,       // Enable/disable logs
};
```

### 📊 Quick Presets Available:

```javascript
// Conservative (safest, slowest)
CONSERVATIVE: { NUM_WORKERS: 2, DELAY: 2500ms }

// Balanced (recommended)
BALANCED: { NUM_WORKERS: 4, DELAY: 1500ms }

// Aggressive (fastest, needs monitoring)
AGGRESSIVE: { NUM_WORKERS: 8, DELAY: 1000ms }

// Testing (for development)
TESTING: { NUM_WORKERS: 2, DELAY: 1000ms }
```

To use a preset, just copy its values to `CONFIG`.

---

## 📈 Performance Examples

### Example 1: 20 Users
```
Current Setup (4 workers):
├─ Each worker: 5 users
├─ Time per worker: ~7.5 seconds
└─ Total time: ~7.5 seconds ⚡

Without parallel (1 worker):
└─ Total time: ~30 seconds 🐌
```

### Example 2: 100 Users
```
With 8 workers:
├─ Each worker: 12-13 users
├─ Time per worker: ~18-19 seconds
└─ Total time: ~19 seconds ⚡

With 4 workers:
└─ Total time: ~38 seconds 🚶

Without parallel:
└─ Total time: ~2.5 minutes 🐌
```

---

## 🔧 Common Adjustments

### Getting Rate Limited?
```javascript
// Increase delay
DELAY_BETWEEN_REQUESTS: 2000,  // Change from 1500 to 2000

// OR reduce workers
NUM_WORKERS: 2,  // Change from 4 to 2
```

### Too Slow?
```javascript
// Increase workers (ensure you have API URLs!)
NUM_WORKERS: 8,  // Change from 4 to 8

// OR decrease delay (carefully!)
DELAY_BETWEEN_REQUESTS: 1000,  // Change from 1500 to 1000
```

### Many Failures?
```javascript
// Increase retries
MAX_RETRIES: 3,  // Change from 2 to 3

// AND increase retry delay
RETRY_DELAY: 3000,  // Change from 2000 to 3000
```

---

## 🎓 Understanding the System

### How Distribution Works:
```
20 users with 4 workers:

Worker 1: user1, user5, user9,  user13, user17  (5 users)
Worker 2: user2, user6, user10, user14, user18  (5 users)
Worker 3: user3, user7, user11, user15, user19  (5 users)
Worker 4: user4, user8, user12, user16, user20  (5 users)

All process at the same time! ⚡
```

### Timeline:
```
Worker 1: [user1] wait 1.5s [user5] wait 1.5s [user9] ...
Worker 2: [user2] wait 1.5s [user6] wait 1.5s [user10] ...
Worker 3: [user3] wait 1.5s [user7] wait 1.5s [user11] ...
Worker 4: [user4] wait 1.5s [user8] wait 1.5s [user12] ...

Total: ~7.5 seconds instead of ~30 seconds!
```

---

## 📝 Testing Your Setup

1. **Start with small batch** (5-10 users)
2. **Monitor console logs** - they're very detailed
3. **Check success rate** - should be >90%
4. **Look for warnings** - adjust if you see many retries
5. **Scale up gradually** - 20 → 50 → 100 users

---

## 🔍 Console Output Example

```
═══════════════════════════════════════════════════════
🎯 CodeChef Bulk Search Started
═══════════════════════════════════════════════════════
📊 Total usernames: 20
👷 Number of workers: 4
⏱️ Delay between requests: 1500ms
🌍 Environment: Development
═══════════════════════════════════════════════════════

👷 Worker 1: 5 users
👷 Worker 2: 5 users
👷 Worker 3: 5 users
👷 Worker 4: 5 users

🚀 Worker 1 started: Processing 5 users
⏳ Worker 1: Fetching [1/5] - user1
✅ Worker 1: Fetching [2/5] - user5
...

✨ CodeChef Bulk Search Completed
✅ Successful: 19/20
❌ Failed: 1/20
⏱️ Total time: 8.3 seconds
```

---

## 🆘 Need Help?

1. **Read the logs** - They explain everything!
2. **Check README** - `src/utils/CODECHEF_BULK_SEARCH_README.md`
3. **Validate config** - Use `validateConfig()` function
4. **Test with small batch** - Start with 5 users

---

## ✅ Checklist

- [ ] `NUM_WORKERS` is set in `codechefBulkConfig.js`
- [ ] All API URLs are in `.env` (1 per worker)
- [ ] Dev server has been restarted
- [ ] Tested with small batch first
- [ ] Monitored console logs
- [ ] Adjusted delays if needed

---

**You're all set!** 🎉 The system is organized, well-commented, and easy to modify. Happy coding! 🚀
