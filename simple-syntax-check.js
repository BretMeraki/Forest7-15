/**
 * Simple Syntax Checker
 * 
 * Quick syntax validation without importing files
 */

import { promises as fs } from 'fs';
import path from 'path';

class SimpleSyntaxChecker {
  constructor() {
    this.results = {
      checked: 0,
      errors: [],
      warnings: []
    };
  }
  
  async checkSyntax() {
    console.log('🔍 Simple Syntax Check Starting...\n');
    
    // Key files to check
    const keyFiles = [
      '___stage1/forest-mcp-server.js',
      '___stage1/core-server.js',
      '___stage1/core-initialization.js',
      '___stage1/modules/diagnostic-handlers.js',
      '___stage1/utils/diagnostic-verifier.js',
      '___stage1/utils/claude-diagnostic-helper.js',
      '___stage1/utils/runtime-safety.js',
      '___stage1/tools/diagnostic-tool.js',
      '___stage1/errors.js'
    ];
    
    for (const file of keyFiles) {
      await this.checkFile(file);
    }
    
    this.displayResults();
    return this.results;
  }
  
  async checkFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      this.results.checked++;
      
      // Basic syntax checks
      const errors = this.findSyntaxIssues(content, filePath);
      
      if (errors.length > 0) {
        this.results.errors.push(...errors);
        console.log(`🔴 ${filePath}: ${errors.length} issues`);
      } else {
        console.log(`✅ ${filePath}`);
      }
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.results.errors.push({
          file: filePath,
          type: 'MISSING_FILE',
          message: 'File not found'
        });
        console.log(`❌ ${filePath}: File not found`);
      } else {
        this.results.errors.push({
          file: filePath,
          type: 'READ_ERROR',
          message: error.message
        });
        console.log(`❌ ${filePath}: ${error.message}`);
      }
    }
  }
  
  findSyntaxIssues(content, filePath) {
    const issues = [];
    
    // Check for basic syntax issues
    
    // 1. Bracket balance
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (Math.abs(openBraces - closeBraces) > 1) {
      issues.push({
        file: filePath,
        type: 'BRACKET_MISMATCH',
        message: `Unbalanced braces: ${openBraces} open, ${closeBraces} close`
      });
    }
    
    // 2. Parentheses balance
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (Math.abs(openParens - closeParens) > 1) {
      issues.push({
        file: filePath,
        type: 'PAREN_MISMATCH',
        message: `Unbalanced parentheses: ${openParens} open, ${closeParens} close`
      });
    }
    
    // 3. Check for incomplete imports/exports
    const badImports = content.match(/import\s+[^;\n]*$/gm);
    if (badImports) {
      issues.push({
        file: filePath,
        type: 'INCOMPLETE_IMPORT',
        message: `Potentially incomplete import statements: ${badImports.length}`
      });
    }
    
    // 4. Check for unterminated strings (basic check)
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      const singleQuotes = (line.match(/'/g) || []).length;
      const doubleQuotes = (line.match(/"/g) || []).length;
      const backticks = (line.match(/`/g) || []).length;
      
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
        issues.push({
          file: filePath,
          type: 'UNTERMINATED_STRING',
          message: `Potentially unterminated string on line ${index + 1}`
        });
      }
    });
    
    // 5. Check for obvious syntax errors
    if (content.includes('function(') && !content.includes('function (')) {
      // This is actually valid, so skip
    }
    
    if (content.includes('export {') && !content.includes('}')) {
      issues.push({
        file: filePath,
        type: 'INCOMPLETE_EXPORT',
        message: 'Potentially incomplete export block'
      });
    }
    
    return issues;
  }
  
  displayResults() {
    console.log('\\n' + '='.repeat(50));
    console.log('🔍 SIMPLE SYNTAX CHECK RESULTS');
    console.log('='.repeat(50));
    
    console.log(`Files Checked: ${this.results.checked}`);
    console.log(`Issues Found: ${this.results.errors.length}`);
    
    if (this.results.errors.length === 0) {
      console.log('\\n🎉 NO SYNTAX ISSUES FOUND!');
      console.log('✅ All key files passed basic syntax checks');
    } else {
      console.log('\\n❌ SYNTAX ISSUES FOUND:');
      
      const groupedErrors = {};
      this.results.errors.forEach(error => {
        if (!groupedErrors[error.file]) {
          groupedErrors[error.file] = [];
        }
        groupedErrors[error.file].push(error);
      });
      
      Object.entries(groupedErrors).forEach(([file, errors]) => {
        console.log(`\\n📁 ${file}:`);
        errors.forEach(error => {
          console.log(`   🔴 ${error.type}: ${error.message}`);
        });
      });
    }
    
    console.log('\\n' + '='.repeat(50));
  }
}

// Run the check
async function main() {
  const checker = new SimpleSyntaxChecker();
  try {
    await checker.checkSyntax();
  } catch (error) {
    console.error('❌ Syntax check failed:', error.message);
    process.exit(1);
  }
}

main();
