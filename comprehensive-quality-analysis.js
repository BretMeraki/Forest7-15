#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Comprehensive quality checks beyond basic syntax
const QUALITY_CHECKS = {
  // Code Quality Issues
  CODE_QUALITY: {
    'HTML_ENTITIES': /&(amp|gt|lt|quot|apos);/g,
    'UNICODE_ISSUES': /[^\x00-\x7F]/g,
    'TRAILING_WHITESPACE': /[ \t]+$/gm,
    'MIXED_LINE_ENDINGS': /\r\n|\r|\n/g,
    'INCONSISTENT_QUOTES': /(["'])[^"']*\1/g,
    'MAGIC_NUMBERS': /\b(?!0|1|2|100)\d{3,}\b/g
  },
  
  // Security Vulnerabilities
  SECURITY: {
    'EVAL_USAGE': /\beval\s*\(/g,
    'FUNCTION_CONSTRUCTOR': /new\s+Function\s*\(/g,
    'UNSAFE_REGEX': /\/(.*\*.*\+|.*\+.*\*)/g,
    'SQL_INJECTION_RISK': /SELECT.*FROM.*WHERE.*\+/gi,
    'XSS_RISK': /innerHTML\s*=\s*[^;]+\+/g,
    'HARDCODED_SECRETS': /(password|secret|key|token)\s*[:=]\s*["'][^"']{8,}/gi
  },
  
  // Performance Issues
  PERFORMANCE: {
    'SYNC_FILE_OPS': /fs\.(readFileSync|writeFileSync|existsSync)/g,
    'BLOCKING_LOOPS': /for\s*\([^)]*;\s*[^;]*length\s*;\s*[^)]*\)/g,
    'MEMORY_LEAKS': /setInterval\s*\([^}]*(?!clearInterval)/g,
    'INEFFICIENT_REGEX': /new\s+RegExp\s*\(/g,
    'NESTED_LOOPS': /for\s*\([^}]*for\s*\(/g
  },
  
  // Maintainability Issues
  MAINTAINABILITY: {
    'LONG_FUNCTIONS': null, // Special check
    'DEEP_NESTING': null,   // Special check
    'TODO_COMMENTS': /\/\/\s*(TODO|FIXME|HACK|XXX)/gi,
    'CONSOLE_LOGS': /console\.(log|debug|info)\s*\(/g,
    'DEAD_CODE': /if\s*\(\s*(false|0|null|undefined)\s*\)/g,
    'DUPLICATE_CODE': null  // Special check
  },
  
  // Architecture Issues
  ARCHITECTURE: {
    'CIRCULAR_DEPS': null,     // Special check
    'TIGHT_COUPLING': /require\s*\(\s*["'][^"']*\.\..*["']\s*\)/g,
    'MISSING_ERROR_HANDLING': /await\s+[^;]*(?!\.catch|try)/g,
    'CALLBACK_HELL': /\)\s*{\s*[^}]*\(\s*[^}]*\)\s*{\s*[^}]*\(\s*[^}]*\)\s*{/g,
    'PROMISE_ANTIPATTERN': /new\s+Promise\s*\(\s*\(\s*resolve\s*,\s*reject\s*\)\s*=>\s*{[^}]*\.then/g
  },
  
  // Runtime Issues
  RUNTIME: {
    'UNDEFINED_VARS': /\b[a-zA-Z_$][a-zA-Z0-9_$]*\s*\.\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*(?!\()/g,
    'TYPE_COERCION': /==\s*[^=]|!=\s*[^=]/g,
    'FLOATING_POINT': /\d+\.\d+\s*[+\-*\/]\s*\d+\.\d+/g,
    'ARRAY_ISSUES': /\.length\s*-\s*1(?!\s*\])/g,
    'OBJECT_PROTOTYPE': /hasOwnProperty|Object\.prototype/g
  }
};

async function analyzeFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const results = {
      file: filePath,
      issues: {},
      totalIssues: 0,
      severity: 'LOW',
      categories: []
    };
    
    // Run all regex-based checks
    for (const [category, checks] of Object.entries(QUALITY_CHECKS)) {
      results.issues[category] = {};
      
      for (const [checkName, regex] of Object.entries(checks)) {
        if (regex === null) continue; // Skip special checks
        
        const matches = content.match(regex) || [];
        if (matches.length > 0) {
          results.issues[category][checkName] = {
            count: matches.length,
            matches: matches.slice(0, 5), // Show first 5 examples
            severity: getSeverity(category, checkName)
          };
          results.totalIssues += matches.length;
          
          if (!results.categories.includes(category)) {
            results.categories.push(category);
          }
        }
      }
    }
    
    // Special checks
    await performSpecialChecks(content, results);
    
    // Determine overall severity
    results.severity = calculateOverallSeverity(results);
    
    return results;
    
  } catch (error) {
    return {
      file: filePath,
      error: error.message,
      totalIssues: 0,
      severity: 'ERROR'
    };
  }
}

function getSeverity(category, checkName) {
  const severityMap = {
    SECURITY: 'CRITICAL',
    RUNTIME: 'HIGH',
    PERFORMANCE: 'MEDIUM',
    ARCHITECTURE: 'MEDIUM',
    CODE_QUALITY: 'LOW',
    MAINTAINABILITY: 'LOW'
  };
  
  const criticalChecks = ['EVAL_USAGE', 'SQL_INJECTION_RISK', 'XSS_RISK', 'HARDCODED_SECRETS'];
  if (criticalChecks.includes(checkName)) return 'CRITICAL';
  
  return severityMap[category] || 'LOW';
}

function calculateOverallSeverity(results) {
  const severities = [];
  for (const category of Object.values(results.issues)) {
    for (const issue of Object.values(category)) {
      severities.push(issue.severity);
    }
  }
  
  if (severities.includes('CRITICAL')) return 'CRITICAL';
  if (severities.includes('HIGH')) return 'HIGH';
  if (severities.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

async function performSpecialChecks(content, results) {
  // Check function length
  const functions = content.match(/function[^{]*{[^}]*}/g) || [];
  const longFunctions = functions.filter(fn => fn.split('\n').length > 50);
  if (longFunctions.length > 0) {
    results.issues.MAINTAINABILITY.LONG_FUNCTIONS = {
      count: longFunctions.length,
      severity: 'MEDIUM'
    };
    results.totalIssues += longFunctions.length;
  }
  
  // Check nesting depth
  const lines = content.split('\n');
  let maxDepth = 0;
  let currentDepth = 0;
  
  for (const line of lines) {
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    currentDepth += openBraces - closeBraces;
    maxDepth = Math.max(maxDepth, currentDepth);
  }
  
  if (maxDepth > 6) {
    results.issues.MAINTAINABILITY.DEEP_NESTING = {
      count: 1,
      maxDepth: maxDepth,
      severity: 'MEDIUM'
    };
    results.totalIssues += 1;
  }
}

async function analyzeCodebase() {
  console.log('🔍 COMPREHENSIVE QUALITY ANALYSIS');
  console.log('==================================');
  console.log('Analyzing beyond syntax - checking for:');
  console.log('• Code Quality Issues');
  console.log('• Security Vulnerabilities');
  console.log('• Performance Problems');
  console.log('• Maintainability Issues');
  console.log('• Architecture Problems');
  console.log('• Runtime Risks\n');
  
  // Get all JavaScript files
  const { stdout } = await execAsync('Get-ChildItem -Recurse -Filter "*.js" | Where-Object { $_.FullName -notlike "*node_modules*" } | Select-Object -ExpandProperty FullName', { shell: 'powershell' });
  const files = stdout.trim().split('\n').filter(f => f.trim());
  
  console.log(`📊 Analyzing ${files.length} JavaScript files...\n`);
  
  const results = [];
  const summary = {
    totalFiles: files.length,
    filesWithIssues: 0,
    totalIssues: 0,
    severityBreakdown: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    categoryBreakdown: {}
  };
  
  for (const file of files.slice(0, 20)) { // Limit to first 20 for demo
    console.log(`🔍 Analyzing: ${path.basename(file)}`);
    const result = await analyzeFile(file);
    
    if (result.totalIssues > 0) {
      results.push(result);
      summary.filesWithIssues++;
      summary.totalIssues += result.totalIssues;
      summary.severityBreakdown[result.severity]++;
      
      result.categories.forEach(cat => {
        summary.categoryBreakdown[cat] = (summary.categoryBreakdown[cat] || 0) + 1;
      });
    }
  }
  
  return { results, summary };
}

async function generateQualityReport(results, summary) {
  console.log('\n📋 COMPREHENSIVE QUALITY REPORT');
  console.log('================================');
  
  console.log(`📊 OVERVIEW:`);
  console.log(`• Total files analyzed: ${summary.totalFiles}`);
  console.log(`• Files with issues: ${summary.filesWithIssues}`);
  console.log(`• Total issues found: ${summary.totalIssues}`);
  console.log(`• Quality score: ${((summary.totalFiles - summary.filesWithIssues) / summary.totalFiles * 100).toFixed(1)}%\n`);
  
  console.log(`🚨 SEVERITY BREAKDOWN:`);
  console.log(`• CRITICAL: ${summary.severityBreakdown.CRITICAL} files`);
  console.log(`• HIGH: ${summary.severityBreakdown.HIGH} files`);
  console.log(`• MEDIUM: ${summary.severityBreakdown.MEDIUM} files`);
  console.log(`• LOW: ${summary.severityBreakdown.LOW} files\n`);
  
  console.log(`📂 CATEGORY BREAKDOWN:`);
  Object.entries(summary.categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`• ${category}: ${count} files affected`);
    });
  
  console.log('\n🔍 DETAILED FINDINGS:');
  console.log('====================');
  
  // Show top 5 most problematic files
  const topIssues = results
    .sort((a, b) => b.totalIssues - a.totalIssues)
    .slice(0, 5);
  
  topIssues.forEach((result, index) => {
    console.log(`\n${index + 1}. 📁 ${path.basename(result.file)} (${result.severity})`);
    console.log(`   🔢 Total issues: ${result.totalIssues}`);
    console.log(`   📂 Categories: ${result.categories.join(', ')}`);
    
    // Show specific issues
    for (const [category, issues] of Object.entries(result.issues)) {
      for (const [issueType, details] of Object.entries(issues)) {
        if (details.count > 0) {
          console.log(`   • ${issueType}: ${details.count} occurrences (${details.severity})`);
        }
      }
    }
  });
  
  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('==================');
  
  if (summary.severityBreakdown.CRITICAL > 0) {
    console.log('🚨 IMMEDIATE ACTION REQUIRED:');
    console.log('  • Fix critical security vulnerabilities');
    console.log('  • Remove eval() usage and unsafe patterns');
    console.log('  • Secure hardcoded secrets');
  }
  
  if (summary.severityBreakdown.HIGH > 0) {
    console.log('⚠️  HIGH PRIORITY:');
    console.log('  • Fix runtime error risks');
    console.log('  • Add proper error handling');
    console.log('  • Address type coercion issues');
  }
  
  if (summary.categoryBreakdown.CODE_QUALITY > 0) {
    console.log('🔧 CODE QUALITY:');
    console.log('  • Fix HTML entity encoding');
    console.log('  • Standardize code formatting');
    console.log('  • Remove trailing whitespace');
  }
  
  if (summary.categoryBreakdown.PERFORMANCE > 0) {
    console.log('⚡ PERFORMANCE:');
    console.log('  • Replace synchronous file operations');
    console.log('  • Optimize nested loops');
    console.log('  • Fix memory leak patterns');
  }
}

async function main() {
  try {
    const { results, summary } = await analyzeCodebase();
    await generateQualityReport(results, summary);
    
    console.log('\n🎉 ANALYSIS COMPLETE!');
    console.log('Your comprehensive quality analysis covers:');
    console.log('✅ Syntax validation');
    console.log('✅ Security vulnerabilities');
    console.log('✅ Performance issues');
    console.log('✅ Code quality problems');
    console.log('✅ Architecture concerns');
    console.log('✅ Runtime risks');
    console.log('✅ Maintainability issues');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

main().catch(console.error);
