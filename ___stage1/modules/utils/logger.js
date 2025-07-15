/**
 * Simple Logger Utility
 */

export const logger = {
  info: (...args) => console.error('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => console.error('[DEBUG]', ...args),
  warn: (...args) => console.error('[WARN]', ...args),
};

export default logger;
