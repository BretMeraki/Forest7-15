/**
 * Fast Breaking Error Scanner
 * 
 * Quickly scans for critical breaking errors without full analysis
 */

import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

class FastErrorScanner {
  constructor() {
    this.results = {
      syntaxErrors: [],
      importErrors: [],
      missingFiles: [],
      criticalErrors: []
    };
  }
  
  async scanForBreakingErrors() {
    console.log('⚡ Fast Breaking Error Scan Starting...\n');
    
    try {
      // Get all JS files quickly
      const jsFiles = await this.getJSFiles();
      console.log(`Scanning ${jsFiles.length} JavaScript files for breaking errors...\n`);
      
      // Quick syntax check on critical files first
      const criticalFiles = jsFiles.filter(f => {
        const relativePath = path.relative(process.cwd(), f);
        return relativePath.includes('___stage1') && 
               !relativePath.includes('test') && 
               !relativePath.includes('backup') &&
               !relativePath.includes('node_modules');
      });
      
      console.log(`🎯 Prioritizing ${criticalFiles.length} critical files...\n`);
      
      for (const file of criticalFiles) {
        await this.quickSyntaxCheck(file);
      }
      
      this.displayResults();
      return this.results;
      
    } catch (error) {
      console.error('❌ Scanner error:', error.message);
      throw error;
    }
  }
  
  async getJSFiles() {
    const files = [];
    
    async function scan(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scan(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }
    
    await scan(process.cwd());
    return files;
  }
  
  async quickSyntaxCheck(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    try {
      // Quick file read check
      const content = await fs.readFile(filePath, 'utf8');
      
      // Basic syntax validation
      if (this.hasBasicSyntaxErrors(content)) {
        this.results.syntaxErrors.push({
          file: relativePath,
          error: 'Basic syntax error detected'
        });
        return;
      }
      
      // Try dynamic import with timeout
      const fileUrl = pathToFileURL(filePath).href;
      
      const importPromise = import(fileUrl);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Import timeout')), 3000)
      );
      
      await Promise.race([importPromise, timeoutPromise]);
      
      // If we get here, file imported successfully
      console.log(`✅ ${relativePath}`);
      
    } catch (error) {
      if (error.message.includes('SyntaxError')) {
        this.results.syntaxErrors.push({
          file: relativePath,
          error: error.message
        });
        console.log(`🔴 SYNTAX: ${relativePath}`);
      } else if (error.message.includes('Cannot resolve') || error.message.includes('Module not found')) {
        this.results.importErrors.push({
          file: relativePath,
          error: error.message
        });
        console.log(`🟡 IMPORT: ${relativePath}`);
      } else if (error.message.includes('Import timeout')) {
        console.log(`⏱️ TIMEOUT: ${relativePath}`);
      } else {
        this.results.criticalErrors.push({
          file: relativePath,
          error: error.message
        });
        console.log(`❌ ERROR: ${relativePath} - ${error.message.substring(0, 50)}...`);
      }
    }
  }
  
  hasBasicSyntaxErrors(content) {
    // Quick regex checks for obvious syntax errors
    const checks = [
      // Unclosed brackets/braces
      () => {
        const open = (content.match(/\{/g) || []).length;
        const close = (content.match(/\}/g) || []).length;
        return Math.abs(open - close) > 2; // Allow small variance for string content
      },
      // Unclosed parentheses
      () => {
        const open = (content.match(/\(/g) || []).length;
        const close = (content.match(/\)/g) || []).length;
        return Math.abs(open - close) > 2;
      },
      // Invalid characters in import/export
      /export\s+[^{function\s\w].*[^}]/,
      /import\s+[^{'\"\w].*[^}]/
    ];
    
    return checks.some(check => {
      if (typeof check === 'function') {
        return check();
      } else {
        return check.test(content);
      }
    });
  }
  
  displayResults() {
    console.log('\n' + '='.repeat(50));
    console.log('⚡ FAST BREAKING ERROR SCAN RESULTS');
    console.log('='.repeat(50));
    
    const totalErrors = this.results.syntaxErrors.length + 
                       this.results.importErrors.length + 
                       this.results.criticalErrors.length;
    
    if (totalErrors === 0) {
      console.log('🎉 NO BREAKING ERRORS FOUND!');
      console.log('✅ All critical files passed syntax checks');
    } else {
      console.log(`❌ ${totalErrors} BREAKING ERRORS FOUND`);
      
      if (this.results.syntaxErrors.length > 0) {
        console.log(`\\n💥 SYNTAX ERRORS (${this.results.syntaxErrors.length}):`);
        this.results.syntaxErrors.forEach(err => {
          console.log(`   🔴 ${err.file}`);
          console.log(`      ${err.error.substring(0, 80)}...`);
        });
      }
      
      if (this.results.importErrors.length > 0) {
        console.log(`\\n📦 IMPORT ERRORS (${this.results.importErrors.length}):`);
        this.results.importErrors.forEach(err => {
          console.log(`   🟡 ${err.file}`);
          console.log(`      ${err.error.substring(0, 80)}...`);
        });
      }
      
      if (this.results.criticalErrors.length > 0) {
        console.log(`\\n💥 CRITICAL ERRORS (${this.results.criticalErrors.length}):`);
        this.results.criticalErrors.forEach(err => {
          console.log(`   ❌ ${err.file}`);
          console.log(`      ${err.error.substring(0, 80)}...`);
        });
      }
    }
    
    console.log('\\n' + '='.repeat(50));
  }
}

// Run the fast scan
async function main() {
  const scanner = new FastErrorScanner();
  try {
    await scanner.scanForBreakingErrors();
  } catch (error) {
    console.error('❌ Fast scan failed:', error.message);
    process.exit(1);
  }
}

main();
