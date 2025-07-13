/**
 * Runtime Safety Wrapper
 * 
 * Ensures that diagnostic and verification operations don't interfere
 * with normal runtime operations by providing safe wrappers and fallbacks.
 */

/**
 * Wrap an async function with timeout and error handling
 * @param {Function} fn - The async function to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {*} fallbackValue - Value to return on error/timeout
 * @param {string} operationName - Name for logging
 */
export async function safeAsyncOperation(fn, timeoutMs = 5000, fallbackValue = null, operationName = 'operation') {
  const timeoutPromise = new Promise((resolve) => 
    setTimeout(() => resolve({ timeout: true, value: fallbackValue }), timeoutMs)
  );
  
  try {
    const result = await Promise.race([
      fn().then(value => ({ timeout: false, value })),
      timeoutPromise
    ]);
    
    if (result.timeout) {
      console.warn(`[RuntimeSafety] ${operationName} timed out after ${timeoutMs}ms`);
    }
    
    return result.value;
  } catch (error) {
    console.warn(`[RuntimeSafety] ${operationName} error:`, error.message);
    return fallbackValue;
  }
}

/**
 * Create a non-blocking wrapper for diagnostic operations
 * @param {Function} diagnosticFn - The diagnostic function to wrap
 * @param {string} operationName - Name for logging
 */
export function nonBlockingDiagnostic(diagnosticFn, operationName = 'diagnostic') {
  return async (...args) => {
    // Run diagnostic in background, don't wait for result
    setTimeout(async () => {
      try {
        await diagnosticFn(...args);
      } catch (error) {
        console.warn(`[RuntimeSafety] Non-blocking ${operationName} error:`, error.message);
      }
    });
    
    // Return immediately with a placeholder
    return {
      status: 'initiated',
      message: `${operationName} running in background`
    };
  };
}

/**
 * Cache wrapper with TTL for expensive operations
 */
export class SafeCache {
  constructor(ttlMs = 60000) { // 1 minute default TTL
    this.cache = new Map();
    this.ttlMs = ttlMs;
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // Prevent memory leaks by limiting cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  clear() {
    this.cache.clear();
  }
}

/**
 * Rate limiter for diagnostic operations
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  canProceed() {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

/**
 * Safe wrapper for file system operations
 */
export async function safeFileOperation(operation, fallback = null) {
  try {
    return await operation();
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('[RuntimeSafety] File not found:', error.path);
    } else if (error.code === 'EACCES') {
      console.warn('[RuntimeSafety] Permission denied:', error.path);
    } else {
      console.warn('[RuntimeSafety] File operation error:', error.message);
    }
    return fallback;
  }
}

/**
 * Create a safe wrapper for any class with automatic error handling
 */
export function createSafeWrapper(instance, className = 'Unknown') {
  return new Proxy(instance, {
    get(target, prop) {
      const original = target[prop];
      
      if (typeof original === 'function') {
        return async function(...args) {
          try {
            return await original.apply(target, args);
          } catch (error) {
            console.error(`[RuntimeSafety] ${className}.${prop} error:`, error.message);
            
            // Return safe default based on method name patterns
            if (prop.startsWith('get') || prop.startsWith('fetch')) {
              return null;
            } else if (prop.startsWith('is') || prop.startsWith('has')) {
              return false;
            } else if (prop.startsWith('verify')) {
              return { verified: false, error: error.message };
            }
            
            // For other methods, throw the error
            throw error;
          }
        };
      }
      
      return original;
    }
  });
}

export default {
  safeAsyncOperation,
  nonBlockingDiagnostic,
  SafeCache,
  RateLimiter,
  safeFileOperation,
  createSafeWrapper
};
