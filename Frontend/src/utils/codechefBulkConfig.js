/**
 * ============================================================================
 * CODECHEF BULK SEARCH - QUICK CONFIGURATION
 * ============================================================================
 * 
 * This file provides an easy way to configure the bulk search system.
 * Simply modify the values below and restart your dev server.
 * 
 * IMPORTANT: After changing NUM_WORKERS, ensure you have corresponding
 * API URLs in your .env file (VITE_CODECHEF_API_URL_1_DEV, etc.)
 */

// ============================================================================
// MAIN CONFIGURATION - MODIFY THESE VALUES
// ============================================================================

export const CONFIG = {
  
  /**
   * 🎯 NUMBER OF PARALLEL WORKERS
   * 
   * How many API endpoints to use simultaneously.
   * Each worker processes a portion of usernames.
   * 
   * Guidelines:
   * - 2-3 workers: Conservative (good for testing)
   * - 4-6 workers: Balanced (recommended for production)
   * - 8-10 workers: Aggressive (maximum speed, needs monitoring)
   * 
   * REMEMBER: Add corresponding API URLs to .env file!
   * Example: If NUM_WORKERS = 7, you need:
   * - VITE_CODECHEF_API_URL_1_DEV/PROD
   * - VITE_CODECHEF_API_URL_2_DEV/PROD
   * - VITE_CODECHEF_API_URL_3_DEV/PROD
   * - VITE_CODECHEF_API_URL_4_DEV/PROD
   * - VITE_CODECHEF_API_URL_5_DEV/PROD
   * - VITE_CODECHEF_API_URL_6_DEV/PROD
   */
  NUM_WORKERS: 6,
  
  /**
   * ⏱️ DELAY BETWEEN REQUESTS (milliseconds)
   * 
   * Time to wait between consecutive requests from each worker.
   * This prevents rate limiting from CodeChef.
   * 
   * Guidelines:
   * - 2000ms (2s): Very safe, minimal risk of rate limiting
   * - 1500ms (1.5s): Balanced (default, recommended)
   * - 1000ms (1s): Fast, but monitor for rate limiting
   * - <1000ms: Not recommended, high risk of blocking
   * 
   * ⚠️ If you see frequent errors, INCREASE this value
   */
  DELAY_BETWEEN_REQUESTS: 2000,
  
  /**
   * 🔄 MAXIMUM RETRY ATTEMPTS
   * 
   * How many times to retry a failed request before giving up.
   * 
   * Guidelines:
   * - 1-2: Fast failures, good for testing
   * - 2-3: Balanced (default)
   * - 4-5: Maximum resilience, slower on failures
   */
  MAX_RETRIES: 2,
  
  /**
   * ⏸️ DELAY BEFORE RETRY (milliseconds)
   * 
   * Time to wait before retrying a failed request.
   * 
   * Guidelines:
   * - 2000ms (2s): Quick retry (default)
   * - 3000ms (3s): Balanced
   * - 5000ms (5s): Conservative, gives server time to recover
   */
  RETRY_DELAY: 2000,
  
  /**
   * ⏳ REQUEST TIMEOUT (milliseconds)
   * 
   * Maximum time to wait for a single request to complete.
   * 
   * Guidelines:
   * - 20000ms (20s): Quick timeout
   * - 30000ms (30s): Balanced (default)
   * - 60000ms (60s): Patient, for slow connections
   */
  REQUEST_TIMEOUT: 30000,
  
  /**
   * 🔊 VERBOSE LOGGING
   * 
   * Enable detailed console logging.
   * Useful for debugging and monitoring.
   * 
   * true: Show all logs (recommended during setup)
   * false: Minimal logs (recommended for production)
   */
  VERBOSE_LOGGING: true,
  
};

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * Use these presets for common scenarios.
 * Copy the values to CONFIG above or import directly.
 */

export const PRESETS = {
  
  /**
   * 🐢 CONSERVATIVE - Slowest but safest
   * Good for: Testing, unstable networks, avoiding rate limits
   */
  CONSERVATIVE: {
    NUM_WORKERS: 2,
    DELAY_BETWEEN_REQUESTS: 2500,
    MAX_RETRIES: 3,
    RETRY_DELAY: 3000,
    REQUEST_TIMEOUT: 40000,
    VERBOSE_LOGGING: true,
  },
  
  /**
   * ⚖️ BALANCED - Recommended for most use cases
   * Good for: Production use, 20-100 users
   */
  BALANCED: {
    NUM_WORKERS: 4,
    DELAY_BETWEEN_REQUESTS: 1500,
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000,
    REQUEST_TIMEOUT: 30000,
    VERBOSE_LOGGING: true,
  },
  
  /**
   * 🚀 AGGRESSIVE - Fastest but needs monitoring
   * Good for: Large batches (100+ users), stable networks
   */
  AGGRESSIVE: {
    NUM_WORKERS: 8,
    DELAY_BETWEEN_REQUESTS: 1000,
    MAX_RETRIES: 2,
    RETRY_DELAY: 2000,
    REQUEST_TIMEOUT: 30000,
    VERBOSE_LOGGING: true,
  },
  
  /**
   * 🧪 TESTING - For development and testing
   * Good for: Debugging, development, quick tests
   */
  TESTING: {
    NUM_WORKERS: 2,
    DELAY_BETWEEN_REQUESTS: 1000,
    MAX_RETRIES: 1,
    RETRY_DELAY: 1000,
    REQUEST_TIMEOUT: 20000,
    VERBOSE_LOGGING: true,
  },
  
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate estimated time for bulk search
 * @param {number} totalUsers - Total number of users to process
 * @param {Object} config - Configuration object (optional, uses CONFIG if not provided)
 * @returns {Object} Estimation object with min and max time in seconds
 */
export const estimateTime = (totalUsers, config = CONFIG) => {
  const usersPerWorker = Math.ceil(totalUsers / config.NUM_WORKERS);
  const delayPerUser = config.DELAY_BETWEEN_REQUESTS / 1000; // Convert to seconds
  
  // Minimum time (all requests succeed)
  const minTimePerWorker = usersPerWorker * delayPerUser;
  
  // Maximum time (some requests fail and need retries)
  const maxTimePerWorker = usersPerWorker * (delayPerUser + (config.RETRY_DELAY / 1000) * config.MAX_RETRIES * 0.2); // Assume 20% failure rate
  
  return {
    minSeconds: Math.ceil(minTimePerWorker),
    maxSeconds: Math.ceil(maxTimePerWorker),
    minFormatted: formatTime(minTimePerWorker),
    maxFormatted: formatTime(maxTimePerWorker),
  };
};

/**
 * Format seconds into human-readable time
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
};

/**
 * Validate configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result with isValid and warnings array
 */
export const validateConfig = (config = CONFIG) => {
  const warnings = [];
  
  if (config.NUM_WORKERS < 1) {
    warnings.push('NUM_WORKERS must be at least 1');
  }
  if (config.NUM_WORKERS > 20) {
    warnings.push('NUM_WORKERS > 20 may cause rate limiting issues');
  }
  if (config.DELAY_BETWEEN_REQUESTS < 500) {
    warnings.push('DELAY_BETWEEN_REQUESTS < 500ms is risky (rate limiting)');
  }
  if (config.DELAY_BETWEEN_REQUESTS > 5000) {
    warnings.push('DELAY_BETWEEN_REQUESTS > 5s will be very slow');
  }
  if (config.MAX_RETRIES > 5) {
    warnings.push('MAX_RETRIES > 5 may cause long wait times on failures');
  }
  if (config.REQUEST_TIMEOUT < 10000) {
    warnings.push('REQUEST_TIMEOUT < 10s may cause premature timeouts');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
  };
};

/**
 * Apply a preset configuration
 * @param {string} presetName - Name of preset (CONSERVATIVE, BALANCED, AGGRESSIVE, TESTING)
 * @returns {Object} Preset configuration
 */
export const applyPreset = (presetName) => {
  const preset = PRESETS[presetName.toUpperCase()];
  if (!preset) {
    console.error(`❌ Unknown preset: ${presetName}. Available: CONSERVATIVE, BALANCED, AGGRESSIVE, TESTING`);
    return CONFIG;
  }
  console.log(`✅ Applied preset: ${presetName.toUpperCase()}`);
  return preset;
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default CONFIG;
