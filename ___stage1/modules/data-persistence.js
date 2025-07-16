/**
 * Data Persistence Module - Consolidated Data Management
 * Optimized from data-persistence.js - Preserves atomic operations, caching, and validation
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { FILE_NAMES, DEFAULT_PATHS } from './memory-sync.js';
import { SQLiteCacheManager } from './stubs/sqlite-cache-manager.js';
import { projectOperationManager } from './project-operation-manager.js';
// Use stderr for logging to avoid interfering with MCP JSON-RPC on stdout
const loggerModule = {
  getLogger: async () => ({
    debug: (...args) => console.error('[DEBUG]', ...args),
    info: (...args) => console.error('[INFO]', ...args),
    warn: (...args) => console.error('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
  }),
};

// Constants for data persistence operations
const DATA_PERSISTENCE_CONSTANTS = {
  UUID_LENGTH: 36,
  UUID_SEGMENT_START: 2,
  UUID_SEGMENT_LENGTH: 9,
  DEFAULT_DIFFICULTY: 3,
  MIN_DIFFICULTY: 1,
  MAX_DIFFICULTY: 10,
  DEFAULT_PRIORITY: 100,
  MIN_PRIORITY: 1,
  MAX_PRIORITY: 10000,  // Allow much higher priorities for task ordering
  JSON_INDENT: 2,
  STACK_TRACE_LIMIT: 1000,
};

// Use environment variable or default to home directory
const dataDirGlobal = process.env.FOREST_DATA_DIR || path.join(os.homedir(), '.forest-data');

export class DataPersistence {
  constructor(dataDir) {
    this.dataDir = dataDir || dataDirGlobal;
    this.cache = new SQLiteCacheManager();
    this.transactions = new Map(); // Active transactions
    this.logger = null; // Will be initialized lazily
  }

  async getLogger() {
    if (!this.logger) {
      this.logger = await loggerModule.getLogger();
    }
    return this.logger;
  }

  async _log(level, message, data) {
    const logger = await this.getLogger();
    logger[level](message, data);
  }


  /**
   * Validate and extract project ID from various input formats
   * @param {string|object} input - The input that should contain a project ID
   * @param {string} methodName - Name of the calling method for logging
   * @returns {string|null} - The extracted project ID or null if invalid
   */
  _extractProjectId(input, methodName) {
    // If already a string, return it
    if (typeof input === 'string' && input.trim() !== '') {
      return input;
    }
    
    // If it's an object, try to extract project_id or projectId
    if (typeof input === 'object' && input !== null) {
      const projectId = input.project_id || input.projectId || input.id;
      if (typeof projectId === 'string' && projectId.trim() !== '') {
        console.error(`[${methodName}] Extracted project ID from object: ${projectId}`);
        return projectId;
      }
      
      // Log the issue for debugging
      console.error(`[${methodName}] Received object without valid project ID:`, {
        keys: Object.keys(input).slice(0, 10),
        type: input.constructor.name
      });
    }
    
    return null;
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to create data directory: ${error.message}`);
      }
    }
  }

  // ===== PROJECT DATA OPERATIONS =====

  async saveProjectData(projectId, fileName, data, transaction = null) {
    // CRITICAL FIX: Validate and extract projectId
    const validProjectId = this._extractProjectId(projectId, 'saveProjectData');
    if (!validProjectId) {
      await this._log('error', '[DataPersistence] saveProjectData received invalid projectId', {
        projectIdType: typeof projectId,
        fileName,
      });
      throw new Error('projectId must be a non-empty string or object with project_id property');
    }
    projectId = validProjectId;

    return projectOperationManager.executeWithLock(projectId, async function() {
      try {
        await this.ensureDataDir();
        const projectDir = path.join(this.dataDir, projectId);
        await fs.mkdir(projectDir, { recursive: true });

        const filePath = path.join(projectDir, fileName);

        // Normalize data before saving
        let normalizedData = data;
        if (fileName === FILE_NAMES.HTA && data && typeof data === 'object') {
          normalizedData = this._normalizeHTAData(data);
        }

        // CRITICAL FIX: Invalidate cache BEFORE write to prevent stale reads
        const cacheKey = `project:${projectId}:${fileName}`;
        await this.cache.delete(cacheKey);
        await this.invalidateProjectCache(projectId);
        
        // Atomic write with validation
        await this._atomicWriteJSON(filePath, normalizedData, transaction);

        // Invalidate cache AFTER successful write as well
        await this.cache.delete(cacheKey);
        await this.invalidateProjectCache(projectId);
        
        const logger = await this.getLogger();
        logger.debug('[DataPersistence] Project data saved', {
          projectId,
          fileName,
          hasTransaction: !!transaction,
          dataSize: JSON.stringify(normalizedData).length,
        });

        return true;
      } catch (error) {
        await this._log('error', '[DataPersistence] Failed to save project data', {
          projectId,
          fileName,
          error: error.message,
        });
        throw error;
      }
    }.bind(this));
  }

  async loadProjectData(projectId, fileName) {
    try {
      // CRITICAL FIX: Validate and extract projectId
      const validProjectId = this._extractProjectId(projectId, 'loadProjectData');
      if (!validProjectId) {
        await this._log('warn', '[DataPersistence] loadProjectData received invalid projectId', {
          projectIdType: typeof projectId,
          fileName,
        });
        return null; // Return null for invalid projectId
      }
      projectId = validProjectId;

      const cacheKey = `project:${projectId}:${fileName}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        // Cache hit - no logging needed, this is normal behavior
        return cached;
      }

      const filePath = path.join(this.dataDir, projectId, fileName);
      const data = await this._readJSON(filePath);

      if (data) {
        await this.cache.set(cacheKey, data);
        await this._log('debug', '[DataPersistence] Project data loaded', { projectId, fileName });
      }

      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this._log('debug', '[DataPersistence] Project data file not found', {
          projectId,
          fileName,
        });
        return null;
      }
      await this._log('error', '[DataPersistence] Failed to load project data', {
        projectId,
        fileName,
        error: error.message,
      });
      throw error;
    }
  }


  // ===== PATH DATA OPERATIONS =====

  async savePathData(projectId, pathName, fileName, data, transaction = null) {
    // CRITICAL FIX: Validate and extract projectId
    const validProjectId = this._extractProjectId(projectId, 'savePathData');
    if (!validProjectId) {
      await this._log('error', '[DataPersistence] savePathData received invalid projectId', {
        projectIdType: typeof projectId,
        pathName,
        fileName,
      });
      throw new Error('projectId must be a non-empty string or object with project_id property');
    }
    projectId = validProjectId;

    return projectOperationManager.executeWithLock(projectId, async () => {
      try {
        await this.ensureDataDir();
        const pathDir = path.join(this.dataDir, projectId, 'paths', pathName);
        await fs.mkdir(pathDir, { recursive: true });

        const filePath = path.join(pathDir, fileName);

        // Normalize data before saving
        let normalizedData = data;
        if (fileName === FILE_NAMES.HTA && data && typeof data === 'object') {
          normalizedData = this._normalizeHTAData(data);
        }

        // CRITICAL FIX: Invalidate cache BEFORE write to prevent stale reads
        const cacheKey = `path:${projectId}:${pathName}:${fileName}`;
        await this.cache.delete(cacheKey);
        await this.invalidateProjectCache(projectId);
        
        // Atomic write with validation
        await this._atomicWriteJSON(filePath, normalizedData, transaction);

        // Invalidate cache AFTER successful write as well
        await this.cache.delete(cacheKey);
        await this.invalidateProjectCache(projectId);

        await this._log('debug', '[DataPersistence] Path data saved', {
          projectId,
          pathName,
          fileName,
          hasTransaction: !!transaction,
          dataSize: JSON.stringify(normalizedData).length,
        });

        return true;
      } catch (error) {
        await this._log('error', '[DataPersistence] Failed to save path data', {
          projectId,
          pathName,
          fileName,
          error: error.message,
        });
        throw error;
      }
    });
  }

  async loadPathData(projectId, pathName, fileName) {
    try {
      // CRITICAL FIX: Validate and extract projectId
      const validProjectId = this._extractProjectId(projectId, 'loadPathData');
      if (!validProjectId) {
        await this._log('warn', '[DataPersistence] loadPathData received invalid projectId', {
          projectIdType: typeof projectId,
          pathName,
          fileName,
        });
        return null; // Return null for invalid projectId
      }
      projectId = validProjectId;

      const cacheKey = `path:${projectId}:${pathName}:${fileName}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        // Cache hit - no logging needed, this is normal behavior
        return cached;
      }

      const filePath = path.join(this.dataDir, projectId, 'paths', pathName, fileName);
      const data = await this._readJSON(filePath);

      if (data) {
        await this.cache.set(cacheKey, data);
        await this._log('debug', '[DataPersistence] Path data loaded', {
          projectId,
          pathName,
          fileName,
        });
      }

      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this._log('debug', '[DataPersistence] Path data file not found', {
          projectId,
          pathName,
          fileName,
        });
        return null;
      }
      await this._log('error', '[DataPersistence] Failed to load path data', {
        projectId,
        pathName,
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // ===== GLOBAL DATA OPERATIONS =====

  async saveGlobalData(fileName, data, transaction = null) {
    // Use a global lock to serialize global writes
    return projectOperationManager.executeWithLock('GLOBAL', async () => {
      try {
        await this.ensureDataDir();
        const filePath = path.join(this.dataDir, fileName);

        // If transaction provided, record the operation
        if (transaction) {
          const tx = this.transactions.get(transaction);
          if (tx) {
            tx.operations.push({
              type: 'saveGlobal',
              fileName,
              data: JSON.parse(JSON.stringify(data)), // Deep clone
              timestamp: Date.now()
            });
          }
        }

        // Clear cache BEFORE write to prevent stale reads
        const cacheKey = `global:${fileName}`;
        await this.cache.delete(cacheKey);
        
        await this._atomicWriteJSON(filePath, data);
        
        // Clear cache after successful write as well
        await this.cache.delete(cacheKey);

        await this._log('debug', '[DataPersistence] Global data saved', { 
          fileName,
          hasTransaction: !!transaction 
        });
        return true;
      } catch (error) {
        await this._log('error', '[DataPersistence] Failed to save global data', {
          fileName,
          error: error.message,
        });
        throw error;
      }
    });
  }

  async loadGlobalData(fileName) {
    try {
      const cacheKey = `global:${fileName}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        // Cache hit - no logging needed, this is normal behavior
        return cached;
      }

      const filePath = path.join(this.dataDir, fileName);
      const data = await this._readJSON(filePath);

      if (data) {
        await this.cache.set(cacheKey, data);
        await this._log('debug', '[DataPersistence] Global data loaded', { fileName });
      }

      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this._log('debug', '[DataPersistence] Global data file not found', { fileName });
        return null;
      }
      await this._log('error', '[DataPersistence] Failed to load global data', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // ===== TRANSACTION SUPPORT =====

  beginTransaction() {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.transactions.set(transactionId, {
      id: transactionId,
      operations: [],
      startTime: Date.now(),
    });

    // Use stderr for logging to avoid interfering with MCP JSON-RPC
    console.error('[DEBUG] [DataPersistence] Transaction started', { transactionId });
    return transactionId;
  }

  async commitTransaction(transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      // All operations were already executed during the transaction
      // This is just cleanup
      this.transactions.delete(transactionId);

      await this._log('debug', '[DataPersistence] Transaction committed', {
        transactionId,
        operationCount: transaction.operations.length,
        duration: Date.now() - transaction.startTime,
      });

      return true;
    } catch (error) {
      await this._log('error', '[DataPersistence] Transaction commit failed', {
        transactionId,
        error: error.message,
      });
      throw error;
    }
  }

  async rollbackTransaction(transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    try {
      // Restore previous states for all operations in reverse order
      const operations = [...transaction.operations].reverse();
      
      for (const operation of operations) {
        try {
          if (operation.type === 'write' && operation.previousState !== undefined) {
            // Restore previous file state
            if (operation.previousState === null) {
              // File didn't exist before, delete it
              try {
                await fs.unlink(operation.filePath);
              } catch (unlinkError) {
                // File might not exist, which is fine
                if (unlinkError.code !== 'ENOENT') {
                  throw unlinkError;
                }
              }
            } else {
              // Restore previous content
              await this._atomicWriteJSON(operation.filePath, operation.previousState);
            }
          }
        } catch (restoreError) {
          await this._log('warn', '[DataPersistence] Failed to restore operation during rollback', {
            transactionId,
            operation: operation.type,
            filePath: operation.filePath,
            error: restoreError.message,
          });
        }
      }

      // Clear the transaction
      this.transactions.delete(transactionId);

      await this._log('debug', '[DataPersistence] Transaction rolled back', {
        transactionId,
        operationCount: transaction.operations.length,
      });

      return true;
    } catch (error) {
      await this._log('error', '[DataPersistence] Transaction rollback failed', {
        transactionId,
        error: error.message,
      });
      throw error;
    }
  }

  // ===== PROJECT DELETION =====

  async deleteProjectData(projectId) {
    try {
      // CRITICAL FIX: Validate and extract projectId
      const validProjectId = this._extractProjectId(projectId, 'deleteProjectData');
      if (!validProjectId) {
        throw new Error('projectId must be a non-empty string or object with project_id property');
      }
      projectId = validProjectId;

      const projectDir = path.join(this.dataDir, projectId);
      
      // Check if project directory exists
      try {
        await fs.access(projectDir);
      } catch (error) {
        // Project doesn't exist, which is fine
        await this._log('warn', '[DataPersistence] Project directory not found during deletion', {
          projectId,
          projectDir
        });
        return true;
      }

      // Remove entire project directory
      await fs.rm(projectDir, { recursive: true, force: true });

      // Invalidate all caches for this project
      await this.invalidateProjectCache(projectId);

      await this._log('debug', '[DataPersistence] Project data deleted', {
        projectId,
        projectDir
      });

      return true;
    } catch (error) {
      await this._log('error', '[DataPersistence] Failed to delete project data', {
        projectId,
        error: error.message,
      });
      throw error;
    }
  }

  // ===== CACHE MANAGEMENT =====

  async invalidateProjectCache(projectId) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`project:${projectId}:`) || key.startsWith(`path:${projectId}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      await this.cache.delete(key);
    }

    // Only log if there were actually keys to delete
    if (keysToDelete.length > 0) {
      console.error('[DEBUG] [DataPersistence] Cache invalidated', {
        projectId,
        keysInvalidated: keysToDelete.length
      });
    }
  }

  async clearCache() {
    await this.cache.clear();
    await this._log('debug', '[DataPersistence] Cache cleared');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      hitRate: typeof this.cache.getHitRate === 'function' ? this.cache.getHitRate() : 0,
      memoryUsage: typeof this.cache.getMemoryUsage === 'function' ? this.cache.getMemoryUsage() : 'N/A',
    };
  }
  
  // Emergency debugging method for live cache inspection
  async debugCacheState(projectId = null, cacheType = 'all') {
    const allKeys = Array.from(this.cache.keys());
    const stats = this.getCacheStats();
    
    let filteredKeys = allKeys;
    if (projectId) {
      filteredKeys = allKeys.filter(key => 
        key.startsWith(`project:${projectId}:`) || key.startsWith(`path:${projectId}:`)
      );
    }
    
    if (cacheType !== 'all') {
      filteredKeys = filteredKeys.filter(key => key.includes(cacheType));
    }
    
    // Build cache contents preview
    const contents = {};
    for (const key of filteredKeys.slice(0, 10)) {
      const value = await this.cache.get(key);
      if (value && typeof value === 'object') {
        contents[key] = `[Object] ${Object.keys(value).length} keys`;
      } else {
        contents[key] = typeof value === 'string' ? value.slice(0, 50) + '...' : String(value);
      }
    }
    
    const result = {
      timestamp: new Date().toISOString(),
      totalEntries: allKeys.length,
      filteredEntries: filteredKeys.length,
      memoryUsage: `${Math.round(JSON.stringify(Array.from(this.cache.entries())).length / 1024)}KB`,
      hitRate: stats.hitRate || 0,
      mostRecent: filteredKeys.length > 0 ? filteredKeys[filteredKeys.length - 1] : null,
      contents,
      projectId: projectId || 'all',
      cacheType
    };
    
    console.error('[DEBUG] [DataPersistence] Cache State Debug:', JSON.stringify(result, null, 2));
    return result;
  }
  
  // Emergency cache clearing for specific project
  async emergencyClearProjectCache(projectId) {
    console.error('[EMERGENCY] [DataPersistence] Emergency cache clear for project:', projectId);
    await this.debugCacheState(projectId);
    await this.invalidateProjectCache(projectId);
    await this.debugCacheState(projectId);
    return true;
  }

  // Emergency cache clearing for all cached data
  emergencyClearCache() {
    console.error('[EMERGENCY] [DataPersistence] Emergency cache clear for all data');
    const beforeStats = this.getCacheStats();
    this.debugCacheState();
    this.cache.clear();
    const afterStats = this.getCacheStats();
    console.error('[EMERGENCY] [DataPersistence] Cache cleared successfully', {
      before: beforeStats,
      after: afterStats
    });
    return true;
  }

  /**
   * Clear all persistent storage including database files
   * Used by factory reset to completely wipe the system
   */
  async clearAllPersistentStorage() {
    const fs = await import('fs/promises');
    const result = {
      cleared: [],
      errors: [],
      message: ''
    };

    try {
      console.error('[DataPersistence] Starting complete storage clear...');
      
      // Clear in-memory cache first
      this.cache.clear();
      result.cleared.push('In-memory cache');
      
      // Clear SQLite cache database
      const cacheDbPath = path.join(this.dataDir, '../modules/stubs/cache.db');
      try {
        await fs.unlink(cacheDbPath);
        result.cleared.push('SQLite cache database');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          result.errors.push({ file: 'cache.db', error: error.message });
        }
      }
      
      // Clear vector store database
      const vectorDbPath = process.env.SQLITEVEC_PATH || path.join(this.dataDir, '../forest_vectors.sqlite');
      try {
        await fs.unlink(vectorDbPath);
        result.cleared.push('Vector store database');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          result.errors.push({ file: 'forest_vectors.sqlite', error: error.message });
        }
      }
      
      // Clear entire data directory
      try {
        await fs.rm(this.dataDir, { recursive: true, force: true });
        result.cleared.push('Data directory');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          result.errors.push({ file: 'data directory', error: error.message });
        }
      }
      
      // Recreate empty data directory
      try {
        await fs.mkdir(this.dataDir, { recursive: true });
        result.cleared.push('Recreated empty data directory');
      } catch (error) {
        result.errors.push({ file: 'data directory recreation', error: error.message });
      }
      
      // Also clear any alternate SQLite cache instances
      const altCacheDbPath = path.join(path.dirname(this.dataDir), 'modules/stubs/cache.db');
      try {
        await fs.unlink(altCacheDbPath);
        result.cleared.push('Alternate SQLite cache database');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          result.errors.push({ file: 'alt cache.db', error: error.message });
        }
      }
      
      result.message = `Cleared ${result.cleared.length} items${result.errors.length > 0 ? ` with ${result.errors.length} errors` : ''}`;
      console.error('[DataPersistence] Complete storage clear result:', result);
      
    } catch (error) {
      result.errors.push({ operation: 'storage clear', error: error.message });
      result.message = `Storage clear failed: ${error.message}`;
      console.error('[DataPersistence] Storage clear failed:', error);
    }
    
    return result;
  }

  // List all files in a project directory
  async listProjectFiles(projectId) {
    try {
      const projectDir = path.join(this.dataDir, projectId);
      const files = await fs.readdir(projectDir);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  async _atomicWriteJSON(filePath, data, transaction = null) {
    const tempPath = `${filePath}.tmp`;

    try {
      // If transaction provided, record the previous state for rollback
      if (transaction) {
        const tx = this.transactions.get(transaction);
        if (tx) {
          let previousState = null;
          try {
            previousState = await this._readJSON(filePath);
          } catch (error) {
            // File doesn't exist, previousState remains null
          }
          
          tx.operations.push({
            type: 'write',
            filePath,
            previousState,
            timestamp: Date.now()
          });
        }
      }

      // Write to temporary file first
      await fs.writeFile(
        tempPath,
        JSON.stringify(data, null, DATA_PERSISTENCE_CONSTANTS.JSON_INDENT),
        'utf8'
      );

      // Atomic move to final location
      await fs.rename(tempPath, filePath);

      return true;
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  async _readJSON(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  _normalizeHTAData(data) {
    if (!data || typeof data !== 'object') return data;

    const normalized = { ...data };

    // Ensure frontierNodes is an array
    if (!Array.isArray(normalized.frontierNodes)) {
      normalized.frontierNodes = [];
    }

    // Normalize each frontier node
    normalized.frontierNodes = normalized.frontierNodes.map(node => {
      if (!node || typeof node !== 'object') return node;

      return {
        ...node,
        id:
          node.id ||
          `task_${Date.now()}_${Math.random().toString(DATA_PERSISTENCE_CONSTANTS.UUID_LENGTH).substr(DATA_PERSISTENCE_CONSTANTS.UUID_SEGMENT_START, DATA_PERSISTENCE_CONSTANTS.UUID_SEGMENT_LENGTH)}`,
        difficulty:
          typeof node.difficulty === 'number'
            ? Math.max(
                DATA_PERSISTENCE_CONSTANTS.MIN_DIFFICULTY,
                Math.min(DATA_PERSISTENCE_CONSTANTS.MAX_DIFFICULTY, node.difficulty)
              )
            : DATA_PERSISTENCE_CONSTANTS.DEFAULT_DIFFICULTY,
        priority:
          typeof node.priority === 'number'
            ? Math.max(
                DATA_PERSISTENCE_CONSTANTS.MIN_PRIORITY,
                Math.min(DATA_PERSISTENCE_CONSTANTS.MAX_PRIORITY, node.priority)
              )
            : DATA_PERSISTENCE_CONSTANTS.DEFAULT_PRIORITY,
        prerequisites: Array.isArray(node.prerequisites) ? node.prerequisites : [],
        completed: Boolean(node.completed),
        generated: Boolean(node.generated),
      };
    });

    // Ensure hierarchyMetadata exists
    if (!normalized.hierarchyMetadata || typeof normalized.hierarchyMetadata !== 'object') {
      normalized.hierarchyMetadata = {};
    }

    // Update metadata
    normalized.hierarchyMetadata.total_tasks = normalized.frontierNodes.length;
    normalized.hierarchyMetadata.last_updated = new Date().toISOString();
    normalized.lastUpdated = new Date().toISOString();

    return normalized;
  }

  async logError(operation, error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      operation,
      error: {
        message: error.message,
        stack: error.stack?.substring(0, DATA_PERSISTENCE_CONSTANTS.STACK_TRACE_LIMIT), // Limit stack trace
        name: error.name,
      },
      context,
    };

    try {
      await this.ensureDataDir();
      const errorLogPath = path.join(this.dataDir, 'error.log');
      const logEntry = `${JSON.stringify(errorLog)}\n`;

      await fs.appendFile(errorLogPath, logEntry, 'utf8');

      await this._log('error', '[DataPersistence] Error logged', {
        operation,
        error: error.message,
      });
    } catch (logError) {
      // If we can't log to file, at least log to console
      console.error('Failed to write error log:', logError.message);
      console.error('Original error:', error.message);
    }
  }

  async getProjectList() {
    try {
      await this.ensureDataDir();
      const entries = await fs.readdir(this.dataDir, { withFileTypes: true });

      const projects = [];
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          try {
            const configPath = path.join(this.dataDir, entry.name, FILE_NAMES.CONFIG);
            const config = await this._readJSON(configPath);
            if (config) {
              projects.push({
                id: entry.name,
                goal: config.goal,
                created_at: config.created_at,
                progress: config.progress || 0,
              });
            }
          } catch (error) {
            // Skip projects without valid config
            await this._log('debug', '[DataPersistence] Skipping invalid project', {
              projectId: entry.name,
              error: error.message,
            });
          }
        }
      }

      return projects;
    } catch (error) {
      await this._log('error', '[DataPersistence] Failed to get project list', {
        error: error.message,
      });
      return [];
    }
  }

  async projectExists(projectId) {
    try {
      const projectDir = path.join(this.dataDir, projectId);
      const stats = await fs.stat(projectDir);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  async deleteProject(projectId) {
    try {
      const projectDir = path.join(this.dataDir, projectId);
      await fs.rm(projectDir, { recursive: true, force: true });

      // Clear related cache entries
      await this.invalidateProjectCache(projectId);

      await this._log('info', '[DataPersistence] Project deleted', { projectId });
      return true;
    } catch (error) {
      await this._log('error', '[DataPersistence] Failed to delete project', {
        projectId,
        error: error.message,
      });
      throw error;
    }
  }

  // ===== ATOMIC OPERATIONS =====
  
  async atomicWrite(filePath, data, options = {}) {
    const tempPath = `${filePath}.tmp`;
    
    try {
      // Write to temporary file first
      await this.saveData(tempPath, data, options);
      
      // Atomic rename
      const fs = await import('fs');
      await fs.promises.rename(tempPath, filePath);
      
      return true;
    } catch (error) {
      // Cleanup temp file on failure
      try {
        const fs = await import('fs');
        await fs.promises.unlink(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }
  
  async transaction(operations) {
    const backups = [];
    const completed = [];
    
    try {
      // Execute all operations
      for (const operation of operations) {
        const { type, path: filePath, data } = operation;
        
        // Backup existing file
        if (await this.fileExists(filePath)) {
          const backup = await this.loadData(filePath);
          backups.push({ path: filePath, data: backup });
        }
        
        // Execute operation
        if (type === 'write') {
          await this.atomicWrite(filePath, data);
          completed.push(operation);
        }
      }
      
      return { success: true, completed: completed.length };
    } catch (error) {
      // Rollback on failure
      for (const backup of backups) {
        try {
          await this.saveData(backup.path, backup.data);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError.message);
        }
      }
      
      throw error;
    }
  }
  
  get localFallback() {
    return true; // Always available
  }
  
  get fallbackMode() {
    return !this.isOnline;
  }
}