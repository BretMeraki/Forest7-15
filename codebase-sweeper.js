/**
 * Comprehensive Codebase Sweeper
 * 
 * Systematically scans the entire codebase to find breaking errors,
 * missing functions, import/export issues, and other critical problems.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { DiagnosticVerifier } from './___stage1/utils/diagnostic-verifier.js';
import { safeAsyncOperation } from './___stage1/utils/runtime-safety.js';

class CodebaseSweeper {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.diagnosticVerifier = new DiagnosticVerifier(projectRoot);
    this.results = {
      filesScanned: 0,
      errorsFound: [],
      warnings: [],
      missingFunctions: [],
      importErrors: [],
      exportErrors: [],
      syntaxErrors: [],
      runtimeErrors: [],
      summary: {}
    };
    
    // Patterns to ignore (test files, backups, etc.)
    this.ignorePatterns = [
      /node_modules/,
      /\.git/,
      /\.backup/,
      /test-.*\.js$/,
      /CLEANUP_BACKUP_/,
      /\.test\./,
      /\.spec\./,
      /__tests__/,
      /\.md$/,
      /\.json$/,
      /\.sqlite/,
      /\.log$/
    ];
  }
  
  /**
   * Run comprehensive codebase sweep
   */
  async sweepCodebase() {
    console.log('🔍 Starting Comprehensive Codebase Sweep...\n');
    
    try {
      // Get all JavaScript files
      const jsFiles = await this.findJavaScriptFiles();
      console.log(`Found ${jsFiles.length} JavaScript files to analyze\n`);
      
      // Analyze each file
      for (const filePath of jsFiles) {
        await this.analyzeFile(filePath);
      }
      
      // Generate summary
      this.generateSummary();
      
      // Display results
      this.displayResults();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Error during codebase sweep:', error.message);
      throw error;
    }
  }
  
  /**
   * Find all JavaScript files in the project
   */
  async findJavaScriptFiles() {
    const files = [];
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    await scanDirectory(this.projectRoot);
    
    // Filter out ignored patterns
    return files.filter(file => {
      const relativePath = path.relative(this.projectRoot, file);
      return !this.ignorePatterns.some(pattern => pattern.test(relativePath));
    });
  }
  
  /**
   * Analyze a single file for errors
   */
  async analyzeFile(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    console.log(`Analyzing: ${relativePath}`);
    
    this.results.filesScanned++;
    
    try {
      // 1. Check file accessibility
      await fs.access(filePath);
      
      // 2. Read and analyze content
      const content = await fs.readFile(filePath, 'utf8');
      
      // 3. Syntax check via import attempt
      await this.checkSyntax(filePath, relativePath);
      
      // 4. Analyze imports/exports
      await this.analyzeImportsExports(content, relativePath);
      
      // 5. Extract and verify functions
      await this.analyzeFunctions(content, relativePath);
      
      // 6. Check for common error patterns
      this.analyzeErrorPatterns(content, relativePath);
      
    } catch (error) {
      this.results.errorsFound.push({
        file: relativePath,
        type: 'FILE_ACCESS_ERROR',
        message: error.message,
        severity: 'HIGH'
      });
    }
  }
  
  /**
   * Check syntax by attempting to import the file
   */
  async checkSyntax(filePath, relativePath) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      
      // Attempt dynamic import with timeout
      await safeAsyncOperation(
        async () => await import(fileUrl),
        5000,
        null,
        `Syntax check for ${relativePath}`
      );
      
    } catch (error) {
      if (error.message.includes('SyntaxError') || error.message.includes('Unexpected token')) {
        this.results.syntaxErrors.push({
          file: relativePath,
          type: 'SYNTAX_ERROR',
          message: error.message,
          severity: 'HIGH'
        });
      } else if (error.message.includes('Cannot resolve module')) {
        this.results.importErrors.push({
          file: relativePath,
          type: 'IMPORT_ERROR',
          message: error.message,
          severity: 'MEDIUM'
        });
      } else {
        this.results.runtimeErrors.push({
          file: relativePath,
          type: 'RUNTIME_ERROR',
          message: error.message,
          severity: 'MEDIUM'
        });
      }
    }
  }
  
  /**
   * Analyze imports and exports
   */
  async analyzeImportsExports(content, relativePath) {
    // Find all import statements
    const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
    const requireMatches = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
    
    // Check each import
    for (const importStatement of [...importMatches, ...requireMatches]) {
      const moduleMatch = importStatement.match(/['"]([^'"]+)['"]/);
      if (moduleMatch) {
        const modulePath = moduleMatch[1];
        
        // Skip built-in modules and npm packages
        if (!modulePath.startsWith('.') && !modulePath.startsWith('/')) {
          continue;
        }
        
        try {
          const resolvedPath = this.resolveImportPath(modulePath, relativePath);
          await fs.access(resolvedPath);
        } catch (error) {
          this.results.importErrors.push({
            file: relativePath,
            type: 'MISSING_IMPORT',
            message: `Cannot resolve import: ${modulePath}`,
            severity: 'HIGH',
            details: { importPath: modulePath }
          });
        }
      }
    }
    
    // Find all exports
    const exportMatches = content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g) || [];
    const namedExportMatches = content.match(/export\s*\{\s*([^}]+)\s*\}/g) || [];
    
    // Track exports for cross-reference checking
    const exports = [];
    exportMatches.forEach(match => {
      const nameMatch = match.match(/(?:class|function|const|let|var)\s+(\w+)/);
      if (nameMatch) exports.push(nameMatch[1]);
    });
    
    namedExportMatches.forEach(match => {
      const namesMatch = match.match(/\{\s*([^}]+)\s*\}/);
      if (namesMatch) {
        const names = namesMatch[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
        exports.push(...names);
      }
    });
  }
  
  /**
   * Analyze functions in the file
   */
  async analyzeFunctions(content, relativePath) {
    // Find all function definitions
    const functionPatterns = [
      /function\s+(\w+)\s*\(/g,
      /async\s+function\s+(\w+)\s*\(/g,
      /(\w+)\s*:\s*function\s*\(/g,
      /(\w+)\s*:\s*async\s*function\s*\(/g,
      /(\w+)\s*=\s*function\s*\(/g,
      /(\w+)\s*=\s*async\s*function\s*\(/g,
      /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      /(\w+)\s*=\s*async\s*\([^)]*\)\s*=>/g,
      /async\s+(\w+)\s*\(/g,
      /(\w+)\s*\([^)]*\)\s*\{/g
    ];
    
    const foundFunctions = new Set();
    
    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        foundFunctions.add(match[1]);
      }
    });
    
    // Look for function calls that might not have definitions
    const callPattern = /(\w+)\s*\(/g;
    const functionCalls = new Set();
    
    let match;
    while ((match = callPattern.exec(content)) !== null) {
      const funcName = match[1];
      // Skip common built-ins and keywords
      if (!['if', 'for', 'while', 'switch', 'catch', 'console', 'require', 'import', 'export'].includes(funcName)) {
        functionCalls.add(funcName);
      }
    }
    
    // Check for potentially missing functions
    for (const calledFunc of functionCalls) {
      if (!foundFunctions.has(calledFunc) && !this.isBuiltInFunction(calledFunc)) {
        this.results.warnings.push({
          file: relativePath,
          type: 'POTENTIAL_MISSING_FUNCTION',
          message: `Function '${calledFunc}' is called but not defined in this file`,
          severity: 'LOW',
          details: { functionName: calledFunc }
        });
      }
    }
  }
  
  /**
   * Analyze for common error patterns
   */
  analyzeErrorPatterns(content, relativePath) {
    const errorPatterns = [
      {
        pattern: /undefined\s+is\s+not\s+a\s+function/,
        type: 'UNDEFINED_FUNCTION_CALL',
        severity: 'HIGH'
      },
      {
        pattern: /Cannot\s+read\s+property\s+.*\s+of\s+undefined/,
        type: 'UNDEFINED_PROPERTY_ACCESS',
        severity: 'HIGH'
      },
      {
        pattern: /\.then\s*\(\s*\)\s*\.catch/,
        type: 'EMPTY_PROMISE_HANDLER',
        severity: 'MEDIUM'
      },
      {
        pattern: /console\.log\(/,
        type: 'DEBUG_CODE',
        severity: 'LOW'
      },
      {
        pattern: /debugger/,
        type: 'DEBUGGER_STATEMENT',
        severity: 'LOW'
      }
    ];
    
    errorPatterns.forEach(({ pattern, type, severity }) => {
      if (pattern.test(content)) {
        this.results.warnings.push({
          file: relativePath,
          type,
          message: `Potential issue: ${type.toLowerCase().replace(/_/g, ' ')}`,
          severity
        });
      }
    });
  }
  
  /**
   * Resolve import path relative to current file
   */
  resolveImportPath(importPath, currentFile) {
    const currentDir = path.dirname(path.join(this.projectRoot, currentFile));
    let resolvedPath = path.resolve(currentDir, importPath);
    
    // Try with .js extension if not present
    if (!path.extname(resolvedPath)) {
      resolvedPath += '.js';
    }
    
    return resolvedPath;
  }
  
  /**
   * Check if function name is a built-in
   */
  isBuiltInFunction(funcName) {
    const builtIns = [
      'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
      'parseInt', 'parseFloat', 'isNaN', 'isFinite',
      'encodeURIComponent', 'decodeURIComponent',
      'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean',
      'Date', 'RegExp', 'Error', 'Map', 'Set', 'WeakMap', 'WeakSet',
      'JSON', 'Math'
    ];
    
    return builtIns.includes(funcName) || funcName.charAt(0) === funcName.charAt(0).toUpperCase();
  }
  
  /**
   * Generate summary of findings
   */
  generateSummary() {
    const total = this.results.errorsFound.length + 
                 this.results.syntaxErrors.length + 
                 this.results.importErrors.length + 
                 this.results.runtimeErrors.length;
    
    const highSeverity = [...this.results.errorsFound, ...this.results.syntaxErrors, 
                         ...this.results.importErrors, ...this.results.runtimeErrors, 
                         ...this.results.warnings]
                        .filter(item => item.severity === 'HIGH').length;
    
    const mediumSeverity = [...this.results.errorsFound, ...this.results.syntaxErrors, 
                           ...this.results.importErrors, ...this.results.runtimeErrors, 
                           ...this.results.warnings]
                          .filter(item => item.severity === 'MEDIUM').length;
    
    this.results.summary = {
      filesScanned: this.results.filesScanned,
      totalIssues: total + this.results.warnings.length,
      criticalErrors: total,
      warnings: this.results.warnings.length,
      highSeverity,
      mediumSeverity,
      lowSeverity: this.results.warnings.filter(w => w.severity === 'LOW').length
    };
  }
  
  /**
   * Display results in a formatted way
   */
  displayResults() {
    const { summary } = this.results;
    
    console.log('\n' + '='.repeat(60));
    console.log('🔍 CODEBASE SWEEP RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Files Scanned: ${summary.filesScanned}`);
    console.log(`   Total Issues: ${summary.totalIssues}`);
    console.log(`   Critical Errors: ${summary.criticalErrors}`);
    console.log(`   Warnings: ${summary.warnings}`);
    
    console.log(`\n🚨 SEVERITY BREAKDOWN:`);
    console.log(`   🔴 High:   ${summary.highSeverity}`);
    console.log(`   🟡 Medium: ${summary.mediumSeverity}`);
    console.log(`   🟢 Low:    ${summary.lowSeverity}`);
    
    // Display critical errors
    if (this.results.syntaxErrors.length > 0) {
      console.log(`\n💥 SYNTAX ERRORS (${this.results.syntaxErrors.length}):`);
      this.results.syntaxErrors.forEach(error => {
        console.log(`   🔴 ${error.file}: ${error.message}`);
      });
    }
    
    if (this.results.importErrors.length > 0) {
      console.log(`\n📦 IMPORT ERRORS (${this.results.importErrors.length}):`);
      this.results.importErrors.forEach(error => {
        console.log(`   🔴 ${error.file}: ${error.message}`);
      });
    }
    
    if (this.results.runtimeErrors.length > 0) {
      console.log(`\n⚡ RUNTIME ERRORS (${this.results.runtimeErrors.length}):`);
      this.results.runtimeErrors.forEach(error => {
        console.log(`   🟡 ${error.file}: ${error.message}`);
      });
    }
    
    // Show top warnings
    const highPriorityWarnings = this.results.warnings.filter(w => w.severity === 'HIGH' || w.severity === 'MEDIUM');
    if (highPriorityWarnings.length > 0) {
      console.log(`\n⚠️  HIGH PRIORITY WARNINGS (${highPriorityWarnings.length}):`);
      highPriorityWarnings.slice(0, 10).forEach(warning => {
        console.log(`   ${warning.severity === 'HIGH' ? '🔴' : '🟡'} ${warning.file}: ${warning.message}`);
      });
      
      if (highPriorityWarnings.length > 10) {
        console.log(`   ... and ${highPriorityWarnings.length - 10} more`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (summary.criticalErrors === 0) {
      console.log('✅ NO CRITICAL BREAKING ERRORS FOUND!');
    } else {
      console.log('❌ CRITICAL ERRORS FOUND - IMMEDIATE ATTENTION REQUIRED');
    }
    
    console.log('='.repeat(60));
  }
}

// Run the sweep
async function main() {
  const sweeper = new CodebaseSweeper();
  try {
    const results = await sweeper.sweepCodebase();
    
    // Save detailed results to file
    await fs.writeFile(
      'codebase-sweep-results.json',
      JSON.stringify(results, null, 2),
      'utf8'
    );
    
    console.log('\n💾 Detailed results saved to: codebase-sweep-results.json');
    
  } catch (error) {
    console.error('❌ Sweep failed:', error.message);
    process.exit(1);
  }
}

main();
