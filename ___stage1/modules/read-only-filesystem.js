/**
 * Read-Only Filesystem Access Module
 * Provides safe file reading capabilities without write access
 */

import fs from 'fs';
import path from 'path';

export class ReadOnlyFileSystem {
  constructor(basePath, options = {}) {
    this.basePath = path.resolve(basePath);
    this.allowedExtensions = options.allowedExtensions || ['.js', '.ts', '.json', '.md', '.txt', '.py', '.java', '.cpp', '.h'];
    this.blockedPaths = options.blockedPaths || ['node_modules', '.git', '.env', 'package-lock.json'];
    this.maxFileSize = options.maxFileSize || 1024 * 1024; // 1MB default
  }

  /**
   * Safely read a file with path validation
   */
  async readFile(filePath) {
    try {
      const fullPath = this.validateAndResolvePath(filePath);
      
      // Check file size
      const stats = fs.statSync(fullPath);
      if (stats.size > this.maxFileSize) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize})`);
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      return {
        path: filePath,
        content: content,
        size: stats.size,
        modified: stats.mtime,
        readonly: true
      };
    } catch (error) {
      throw new Error(`Read error: ${error.message}`);
    }
  }

  /**
   * List files in a directory (read-only)
   */
  async listFiles(dirPath = '') {
    try {
      const fullPath = this.validateAndResolvePath(dirPath);
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      
      const files = [];
      for (const item of items) {
        if (this.isBlocked(item.name)) continue;
        
        const itemPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          files.push({
            name: item.name,
            path: itemPath,
            type: 'directory',
            readonly: true
          });
        } else if (item.isFile() && this.isAllowedExtension(item.name)) {
          const stats = fs.statSync(path.join(fullPath, item.name));
          files.push({
            name: item.name,
            path: itemPath,
            type: 'file',
            size: stats.size,
            modified: stats.mtime,
            readonly: true
          });
        }
      }
      
      return files;
    } catch (error) {
      throw new Error(`List error: ${error.message}`);
    }
  }

  /**
   * Search for files matching a pattern
   */
  async searchFiles(pattern, searchPath = '') {
    try {
      const fullPath = this.validateAndResolvePath(searchPath);
      const results = [];
      
      this.searchRecursive(fullPath, pattern, results, searchPath);
      
      return results.slice(0, 100); // Limit results
    } catch (error) {
      throw new Error(`Search error: ${error.message}`);
    }
  }

  /**
   * Get file metadata without reading content
   */
  async getFileInfo(filePath) {
    try {
      const fullPath = this.validateAndResolvePath(filePath);
      const stats = fs.statSync(fullPath);
      
      return {
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        readonly: true
      };
    } catch (error) {
      throw new Error(`Info error: ${error.message}`);
    }
  }

  /**
   * Read multiple files efficiently
   */
  async readMultipleFiles(filePaths) {
    const results = [];
    
    for (const filePath of filePaths.slice(0, 50)) { // Limit to 50 files
      try {
        const file = await this.readFile(filePath);
        results.push(file);
      } catch (error) {
        results.push({
          path: filePath,
          error: error.message,
          readonly: true
        });
      }
    }
    
    return results;
  }

  // Private helper methods
  validateAndResolvePath(filePath) {
    // Resolve the path relative to basePath
    const fullPath = path.resolve(this.basePath, filePath);
    
    // Ensure path is within basePath (prevent directory traversal)
    if (!fullPath.startsWith(this.basePath)) {
      throw new Error('Path outside allowed directory');
    }
    
    // Check if path is blocked
    if (this.isBlocked(fullPath)) {
      throw new Error('Path is blocked');
    }
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      throw new Error('File or directory does not exist');
    }
    
    return fullPath;
  }

  isAllowedExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.allowedExtensions.includes(ext);
  }

  isBlocked(pathOrName) {
    const pathToCheck = typeof pathOrName === 'string' ? pathOrName : pathOrName.toString();
    return this.blockedPaths.some(blocked => 
      pathToCheck.includes(blocked) || 
      path.basename(pathToCheck).startsWith('.')
    );
  }

  searchRecursive(dir, pattern, results, relativePath) {
    if (results.length >= 100) return; // Limit results
    
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (this.isBlocked(item.name)) continue;
        
        const fullPath = path.join(dir, item.name);
        const relPath = path.join(relativePath, item.name);
        
        if (item.isDirectory()) {
          this.searchRecursive(fullPath, pattern, results, relPath);
        } else if (item.isFile() && this.isAllowedExtension(item.name)) {
          if (item.name.toLowerCase().includes(pattern.toLowerCase())) {
            const stats = fs.statSync(fullPath);
            results.push({
              name: item.name,
              path: relPath,
              size: stats.size,
              modified: stats.mtime,
              readonly: true
            });
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      console.error(`Search skip: ${error.message}`);
    }
  }
}

export default ReadOnlyFileSystem;