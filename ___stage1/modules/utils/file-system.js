/**
 * File System Utility - Simple file operations for vector providers
 */

import fs from 'fs/promises';
import path from 'path';

export class FileSystem {
  /**
   * Ensure directory exists
   */
  static async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Join paths
   */
  static join(...paths) {
    return path.join(...paths);
  }

  /**
   * Check if file exists
   */
  static async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read JSON file
   */
  static async readJSON(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Failed to read JSON from ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Write JSON file atomically
   */
  static async atomicWriteJSON(filePath, data) {
    const tempPath = filePath + '.tmp';
    const content = JSON.stringify(data, null, 2);
    
    try {
      await fs.writeFile(tempPath, content, 'utf8');
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch {}
      throw error;
    }
  }

  /**
   * Write file
   */
  static async writeFile(filePath, content, encoding = 'utf8') {
    await fs.writeFile(filePath, content, encoding);
  }

  /**
   * Read file
   */
  static async readFile(filePath, encoding = 'utf8') {
    return await fs.readFile(filePath, encoding);
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * List directory contents
   */
  static async readDir(dirPath) {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get file stats
   */
  static async stat(filePath) {
    return await fs.stat(filePath);
  }
}
