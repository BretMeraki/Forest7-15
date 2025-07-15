/**
 * Diagnostic Verifier - Fixed Version
 * 
 * This module provides automated verification of diagnostic findings
 * with a working import mechanism for Windows environments.
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const execAsync = promisify(exec);

export class DiagnosticVerifier {
  constructor(projectRoot = process.cwd()) {
    // Detect Forest server directory when running through MCP
    if (!projectRoot || projectRoot.includes('Claude') || projectRoot.includes('Anthropic')) {
      // Try to find the Forest server directory
      const possiblePaths = [
        'C:\\Users\\schlansk\\Downloads\\7-3forest-main',
        path.join(process.env.USERPROFILE || '', 'Downloads', '7-3forest-main'),
        // Fallback to current working directory if Forest not found
        process.cwd()
      ];
      
      for (const testPath of possiblePaths) {
        try {
          // Check if this looks like the Forest server directory
          const packageJsonPath = path.join(testPath, 'package.json');
          const stage1Path = path.join(testPath, '___stage1');
          if (require('fs').existsSync(packageJsonPath) && require('fs').existsSync(stage1Path)) {
            projectRoot = testPath;
            break;
          }
        } catch (error) {
          // Continue to next path
        }
      }
    }
    
    // If running from ___stage1 directory, adjust to project root
    if (projectRoot.endsWith('___stage1')) {
      projectRoot = path.dirname(projectRoot);
    }
    
    this.projectRoot = projectRoot;
    this.verificationLog = [];
    
    // Log the resolved project root for debugging
    console.log(`[DiagnosticVerifier] Using project root: ${this.projectRoot}`);
  }

  /**
   * Verify function existence with working import mechanism
   */
  async verifyFunctionExists(functionName, filePath) {
    try {
      // Method 1: Static analysis (most reliable)
      const staticExists = await this.verifyFunctionStatically(functionName, filePath);
      
      // Method 2: Dynamic import verification (when possible)
      let dynamicExists = false;
      try {
        dynamicExists = await this.verifyFunctionDynamically(functionName, filePath);
      } catch (error) {
        // Dynamic verification failed, rely on static analysis
        console.warn(`Dynamic verification failed for ${functionName}: ${error.message}`);
      }

      const exists = staticExists || dynamicExists;
      
      this.verificationLog.push({
        type: 'function_existence',
        functionName,
        filePath,
        exists,
        staticExists,
        dynamicExists,
        timestamp: new Date().toISOString()
      });
      
      return exists;
    } catch (error) {
      this.verificationLog.push({
        type: 'function_existence_error',
        functionName,
        filePath,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  /**
   * Static analysis of function existence (regex-based)
   */
  async verifyFunctionStatically(functionName, filePath) {
    try {
      const fullPath = this.resolveFilePath(filePath);
      const fileContent = await fs.readFile(fullPath, 'utf8');
      
      // Escape function name for safe regex usage
      const escapedName = functionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Enhanced patterns for function detection
      const patterns = [
        // Regular function declarations
        new RegExp(`function\\s+${escapedName}\\s*\\(`),
        new RegExp(`async\\s+function\\s+${escapedName}\\s*\\(`),
        
        // Object method definitions
        new RegExp(`${escapedName}\\s*:\\s*function\\s*\\(`),
        new RegExp(`${escapedName}\\s*:\\s*async\\s*function\\s*\\(`),
        
        // Arrow function assignments
        new RegExp(`${escapedName}\\s*=\\s*function\\s*\\(`),
        new RegExp(`${escapedName}\\s*=\\s*async\\s*function\\s*\\(`),
        new RegExp(`${escapedName}\\s*=\\s*\\([^)]*\\)\\s*=>`),
        new RegExp(`${escapedName}\\s*=\\s*async\\s*\\([^)]*\\)\\s*=>`),
        
        // Class method definitions
        new RegExp(`async\\s+${escapedName}\\s*\\(`),
        new RegExp(`${escapedName}\\s*\\([^)]*\\)\\s*{`),
        new RegExp(`\\*\\s*${escapedName}\\s*\\(`), // generator functions
        
        // Export patterns
        new RegExp(`export\\s+function\\s+${escapedName}\\s*\\(`),
        new RegExp(`export\\s+async\\s+function\\s+${escapedName}\\s*\\(`),
        new RegExp(`export\\s*{[^}]*${escapedName}[^}]*}`),
        new RegExp(`export\\s+.*${escapedName}`),
        
        // CommonJS patterns
        new RegExp(`exports\\.${escapedName}\\s*=`),
        new RegExp(`module\\.exports\\.${escapedName}\\s*=`),
        
        // Additional patterns for edge cases
        new RegExp(`\\b${escapedName}\\s*\\(`), // Simple method call pattern
        new RegExp(`\\.${escapedName}\\s*=\\s*(?:async\\s*)?(?:function|\\()`), // Property assignment
      ];
      
      return patterns.some(pattern => pattern.test(fileContent));
    } catch (error) {
      console.warn(`Static analysis failed for ${functionName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Dynamic verification using proper import mechanism
   */
  async verifyFunctionDynamically(functionName, filePath) {
    try {
      const fullPath = this.resolveFilePath(filePath);
      
      // Convert to proper file URL for import
      const fileUrl = pathToFileURL(fullPath).href;
      
      // Dynamic import
      const module = await import(fileUrl);
      
      // Check for function in various ways
      const checks = [
        // Direct export
        functionName in module,
        // Default export with function name
        module.default && typeof module.default[functionName] === 'function',
        // Class export with method
        this.checkClassMethod(module, functionName),
        // Named export
        module[functionName] && typeof module[functionName] === 'function'
      ];
      
      return checks.some(check => check);
    } catch (error) {
      console.warn(`Dynamic import failed for ${filePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if function exists as a class method
   */
  checkClassMethod(module, functionName) {
    try {
      for (const exportName of Object.keys(module)) {
        const exportValue = module[exportName];
        if (typeof exportValue === 'function' && exportValue.prototype) {
          // It's a class
          try {
            const instance = new exportValue();
            if (typeof instance[functionName] === 'function') {
              return true;
            }
          } catch (error) {
            // Class might require parameters, check prototype instead
            if (exportValue.prototype[functionName] && 
                typeof exportValue.prototype[functionName] === 'function') {
              return true;
            }
          }
        }
      }
      return false;
    } catch (error) {
      console.warn(`Class method check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Resolve file path with proper handling for different formats
   */
  resolveFilePath(filePath) {
    // Handle different path formats
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    
    // Handle relative paths
    if (filePath.startsWith('./') || filePath.startsWith('../')) {
      return path.resolve(this.projectRoot, filePath);
    }
    
    // Handle module-style paths
    if (filePath.includes('/')) {
      return path.resolve(this.projectRoot, filePath);
    }
    
    // Default resolution
    return path.resolve(this.projectRoot, filePath);
  }

  /**
   * Verify imports/exports with enhanced patterns
   */
  async verifyImportExport(itemName, filePath, type = 'export') {
    try {
      const fullPath = this.resolveFilePath(filePath);
      const fileContent = await fs.readFile(fullPath, 'utf8');
      
      let patterns = [];
      if (type === 'export') {
        patterns = [
          new RegExp(`export\\s+.*${itemName}`),
          new RegExp(`export\\s*{[^}]*${itemName}[^}]*}`),
          new RegExp(`export\\s+default\\s+${itemName}`),
          new RegExp(`export\\s+default\\s+class\\s+${itemName}`),
          new RegExp(`export\\s+class\\s+${itemName}`),
          new RegExp(`export\\s+function\\s+${itemName}`),
          new RegExp(`module\\.exports\\s*=\\s*${itemName}`),
          new RegExp(`exports\\.${itemName}\\s*=`),
          new RegExp(`module\\.exports\\.${itemName}\\s*=`),
        ];
      } else {
        patterns = [
          new RegExp(`import\\s+.*${itemName}`),
          new RegExp(`import\\s*{[^}]*${itemName}[^}]*}`),
          new RegExp(`import\\s+${itemName}\\s+from`),
          new RegExp(`const\\s+${itemName}\\s*=\\s*require\\s*\\(`),
          new RegExp(`const\\s*{[^}]*${itemName}[^}]*}\\s*=\\s*require\\s*\\(`),
          new RegExp(`require\\s*\\([^)]*${itemName}[^)]*\\)`),
        ];
      }
      
      const exists = patterns.some(pattern => pattern.test(fileContent));
      
      this.verificationLog.push({
        type: `${type}_verification`,
        itemName,
        filePath,
        exists,
        timestamp: new Date().toISOString()
      });
      
      return exists;
    } catch (error) {
      console.warn(`Import/export verification failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify file existence
   */
  async verifyFileExists(filePath) {
    try {
      const fullPath = this.resolveFilePath(filePath);
      await fs.access(fullPath);
      
      this.verificationLog.push({
        type: 'file_existence',
        filePath,
        exists: true,
        resolvedPath: fullPath,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      this.verificationLog.push({
        type: 'file_existence',
        filePath,
        exists: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  /**
   * Verify code execution with better error handling
   */
  async verifyCodeExecution(testCommand, description) {
    try {
      // Use shorter timeout for quick checks
      const timeout = testCommand.includes('test') ? 30000 : 5000;
      
      const { stdout, stderr } = await execAsync(testCommand, { 
        cwd: this.projectRoot,
        timeout,
        // Ensure proper encoding
        encoding: 'utf8',
        // Increase buffer size for test output
        maxBuffer: 1024 * 1024 * 10 // 10MB
      });
      
      // More nuanced success detection
      const hasError = stderr.includes('Error:') || 
                      stderr.includes('failed') ||
                      stderr.includes('FAILED') ||
                      (stderr.includes('error') && !stderr.includes('0 errors'));
      
      const success = !hasError && !stdout.includes('FAILED');
      
      this.verificationLog.push({
        type: 'code_execution',
        description,
        command: testCommand,
        success,
        stdout: stdout.slice(0, 500), // Limit output
        stderr: stderr.slice(0, 500),
        timestamp: new Date().toISOString()
      });
      
      return success;
    } catch (error) {
      // Timeout errors are common and don't indicate a system failure
      if (error.killed || error.code === 'ETIMEDOUT') {
        console.warn(`[DiagnosticVerifier] Command timed out: ${testCommand}`);
        this.verificationLog.push({
          type: 'code_execution_timeout',
          description,
          command: testCommand,
          error: 'Command timed out',
          timestamp: new Date().toISOString()
        });
        return false; // Return false but not an error
      }
      
      this.verificationLog.push({
        type: 'code_execution_error',
        description,
        command: testCommand,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  /**
   * Run comprehensive verification
   */
  async runComprehensiveVerification() {
    const verifications = {};
    
    try {
      // Check if project structure is intact
      verifications.project_structure = await this.verifyFileExists('package.json');
      
      // Check if main modules exist
      verifications.core_modules = await this.verifyFileExists('___stage1/modules');
      
      // Check if vector provider exists
      verifications.vector_provider = await this.verifyFileExists('___stage1/modules/vector-providers/SQLiteVecProvider.js');
      
      // Check if diagnostic handlers exist
      verifications.diagnostic_handlers = await this.verifyFileExists('___stage1/modules/diagnostic-handlers.js');
      
      // Check basic Node.js functionality
      verifications.node_execution = await this.verifyCodeExecution('node --version', 'Node.js version check');
      
    } catch (error) {
      console.warn(`Comprehensive verification error: ${error.message}`);
    }
    
    const recommendations = [];
    const failedChecks = Object.entries(verifications).filter(([key, value]) => !value);
    
    if (failedChecks.length > 0) {
      recommendations.push(`Failed checks: ${failedChecks.map(([key]) => key).join(', ')}`);
    } else {
      recommendations.push('All basic checks passed');
    }
    
    return {
      verifications,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get verification log
   */
  getVerificationLog() {
    return this.verificationLog;
  }

  /**
   * Clear verification log
   */
  clearVerificationLog() {
    this.verificationLog = [];
  }
}
