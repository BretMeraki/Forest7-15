import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';
import { promises as fs } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let sqlite3;
try {
  const require = createRequire(import.meta.url);
  sqlite3 = require('sqlite3').verbose();
} catch (error) {
  console.warn('[SQLiteCacheManager] SQLite3 not available, using in-memory Map');
}

export class SQLiteCacheManager {
  constructor(dbPath = null) {
    this.dbPath = dbPath || path.join(__dirname, 'cache.db');
    this.db = null;
    this.usingSQLite = false;
    this.initialized = false;
    this.initPromise = null;
    
    // Fallback in-memory storage
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
    this.metadata = new Map();
    
    this.initPromise = this.initializeDatabase();
  }

  async initializeDatabase() {
    if (sqlite3) {
      try {
        // Ensure directory exists
        await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
        
        return new Promise((resolve) => {
          this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
              console.warn('[SQLiteCacheManager] SQLite initialization failed, using Map:', err.message);
              this.usingSQLite = false;
              this.initialized = true;
              resolve();
            } else {
              this.usingSQLite = true;
              this._createTables(() => {
                console.log(`[SQLiteCacheManager] SQLite database initialized: ${this.dbPath}`);
                this.initialized = true;
                resolve();
              });
            }
          });
        });
      } catch (error) {
        console.warn('[SQLiteCacheManager] SQLite setup failed, using Map:', error.message);
        this.usingSQLite = false;
        this.initialized = true;
      }
    } else {
      console.log(`[SQLiteCacheManager] Using in-memory Map cache`);
      this.usingSQLite = false;
      this.initialized = true;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  _createTables(callback) {
    if (!this.db || !this.usingSQLite) {
      if (callback) callback();
      return;
    }
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS cache_entries (
        key TEXT PRIMARY KEY,
        value TEXT,
        timestamp INTEGER,
        expires_at INTEGER
      )
    `;
    
    const createStatsSQL = `
      CREATE TABLE IF NOT EXISTS cache_stats (
        key TEXT PRIMARY KEY,
        value INTEGER DEFAULT 0
      )
    `;
    
    this.db.serialize(() => {
      this.db.run(createTableSQL);
      this.db.run(createStatsSQL);
      
      // Initialize stats
      this.db.run('INSERT OR IGNORE INTO cache_stats (key, value) VALUES (?, ?)', ['hits', 0]);
      this.db.run('INSERT OR IGNORE INTO cache_stats (key, value) VALUES (?, ?)', ['misses', 0], () => {
        if (callback) callback();
      });
    });
  }

  async get(key) {
    await this.ensureInitialized();
    
    if (this.usingSQLite && this.db) {
      return new Promise((resolve) => {
        this.db.get(
          'SELECT value, expires_at FROM cache_entries WHERE key = ?',
          [key],
          async (err, row) => {
            if (err || !row) {
              await this._incrementStat('misses');
              resolve(undefined);
              return;
            }
            
            // Check expiration
            if (row.expires_at && Date.now() > row.expires_at) {
              await this.delete(key);
              await this._incrementStat('misses');
              resolve(undefined);
              return;
            }
            
            await this._incrementStat('hits');
            try {
              resolve(JSON.parse(row.value));
            } catch (parseErr) {
              resolve(row.value);
            }
          }
        );
      });
    } else {
      // Fallback to Map
      const entry = this.cache.get(key);
      const meta = this.metadata.get(key);
      
      if (entry && meta) {
        if (meta.expires_at && Date.now() > meta.expires_at) {
          await this.delete(key);
          this.misses++;
          return undefined;
        }
        
        this.hits++;
        return entry;
      } else {
        this.misses++;
        return undefined;
      }
    }
  }

  async set(key, value, ttlMs = null) {
    await this.ensureInitialized();
    
    const timestamp = Date.now();
    const expires_at = ttlMs ? timestamp + ttlMs : null;
    
    if (this.usingSQLite && this.db) {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      this.db.run(
        'INSERT OR REPLACE INTO cache_entries (key, value, timestamp, expires_at) VALUES (?, ?, ?, ?)',
        [key, valueStr, timestamp, expires_at]
      );
    } else {
      // Fallback to Map
      this.cache.set(key, value);
      this.metadata.set(key, {
        timestamp,
        expires_at
      });
    }
  }

  async delete(key) {
    await this.ensureInitialized();
    
    if (this.usingSQLite && this.db) {
      this.db.run('DELETE FROM cache_entries WHERE key = ?', [key]);
      return true;
    } else {
      // Fallback to Map
      const hadKey = this.cache.has(key);
      this.cache.delete(key);
      this.metadata.delete(key);
      return hadKey;
    }
  }

  async _incrementStat(statName) {
    await this.ensureInitialized();
    
    if (this.usingSQLite && this.db) {
      this.db.run(
        'UPDATE cache_stats SET value = value + 1 WHERE key = ?',
        [statName]
      );
    } else {
      if (statName === 'hits') {
        this.hits++;
      } else if (statName === 'misses') {
        this.misses++;
      }
    }
  }

  async clear() {
    await this.ensureInitialized();
    
    if (this.usingSQLite && this.db) {
      this.db.run('DELETE FROM cache_entries');
      this.db.run('UPDATE cache_stats SET value = 0');
    } else {
      this.cache.clear();
      this.metadata.clear();
      this.hits = 0;
      this.misses = 0;
    }
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  get size() {
    return this.cache.size;
  }

  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  async getMemoryUsage() {
    // Estimate memory usage based on cache size
    try {
      const entriesSize = this.cache.size;
      const metadataSize = this.metadata.size;
      // Rough estimate: each entry ~1KB, metadata ~100 bytes
      return entriesSize * 1024 + metadataSize * 100;
    } catch (error) {
      console.error('Error calculating memory usage:', error);
      return this.size * 1024; // Fallback estimate
    }
  }

  // Additional methods for cache-specific functionality
  cleanupExpiredEntries() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, meta] of this.metadata.entries()) {
      if (meta.expires_at && now > meta.expires_at) {
        this.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }

  getCacheStats() {
    const totalEntries = this.size;
    const hitRate = this.getHitRate();
    const memoryUsage = this.getMemoryUsage();
    
    // Count expired entries
    const now = Date.now();
    let expiredEntries = 0;
    for (const meta of this.metadata.values()) {
      if (meta.expires_at && now > meta.expires_at) {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      memoryUsage,
      expiredEntries,
      dbPath: this.dbPath
    };
  }

  // Method to compact the cache (cleanup expired entries)
  vacuum() {
    this.cleanupExpiredEntries();
  }

  // Method to get all entries (for debugging)
  getAllEntries() {
    const entries = [];
    for (const [key, meta] of this.metadata.entries()) {
      entries.push({
        key,
        timestamp: meta.timestamp,
        expires_at: meta.expires_at
      });
    }
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Close the connection (cleanup)
  close() {
    this.clear();
  }

  // Method to check if a key exists without affecting hit/miss counters
  has(key) {
    const meta = this.metadata.get(key);
    if (!meta) return false;
    
    // Check if expired
    if (meta.expires_at && Date.now() > meta.expires_at) {
      return false;
    }
    
    return this.cache.has(key);
  }

  // Method to get cache entry metadata
  getEntryMetadata(key) {
    const meta = this.metadata.get(key);
    
    if (meta) {
      return {
        timestamp: meta.timestamp,
        expires_at: meta.expires_at,
        isExpired: meta.expires_at && Date.now() > meta.expires_at
      };
    };
    
    return null;
  }

  // Method to get all cache entries (for Map compatibility)
  entries() {
    return this.cache.entries();
  }

  // Method to get all cache values (for Map compatibility)
  values() {
    return this.cache.values();
  }
}
