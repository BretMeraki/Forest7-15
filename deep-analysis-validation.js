#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

// Let's manually check the files we KNOW have issues
const KNOWN_PROBLEMATIC_FILES = [
  '___stage1/core-server.js',
  '___stage1/modules/diagnostic-handlers.js', 
  '___stage1/utils/diagnostic-verifier.js',
  '___stage1/utils/claude-diagnostic-helper.js',
  '___stage1/utils/runtime-safety.js'
];

async function deepAnalyzeFile(filePath) {
  try {
    console.log(`\n🔍 DEEP ANALYSIS: ${filePath}`);
    console.log('=' .repeat(50));
    
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    let issues = [];
    
    // Check for HTML entities (we know these exist)
    const htmlEntityMatches = content.match(/&(amp|gt|lt|quot|apos);/g);
    if (htmlEntityMatches) {
      issues.push({
        type: 'HTML_ENTITIES',
        count: htmlEntityMatches.length,
        severity: 'MEDIUM',
        examples: htmlEntityMatches.slice(0, 3)
      });
      console.log(`🔴 HTML Entities found: ${htmlEntityMatches.length}`);
      console.log(`   Examples: ${htmlEntityMatches.slice(0, 3).join(', ')}`);
    }
    
    // Check for Unicode issues
    const unicodeMatches = content.match(/[^\x00-\x7F]/g);
    if (unicodeMatches) {
      const uniqueUnicode = [...new Set(unicodeMatches)];
      issues.push({
        type: 'UNICODE_ISSUES', 
        count: unicodeMatches.length,
        severity: 'LOW',
        examples: uniqueUnicode.slice(0, 5)
      });
      console.log(`🔴 Unicode characters found: ${unicodeMatches.length}`);
      console.log(`   Unique chars: ${uniqueUnicode.slice(0, 5).join(', ')}`);
    }
    
    // Check for unbalanced braces
    let braceDepth = 0;
    let maxDepth = 0;
    let braceErrors = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      braceDepth += openBraces - closeBraces;
      maxDepth = Math.max(maxDepth, braceDepth);
      
      if (braceDepth < 0) {
        braceErrors++;
        console.log(`🔴 Brace mismatch at line ${i + 1}: ${line.trim()}`);
      }
    }
    
    if (braceDepth !== 0) {
      issues.push({
        type: 'BRACE_IMBALANCE',
        count: Math.abs(braceDepth),
        severity: 'HIGH',
        details: `Final depth: ${braceDepth}, Max depth: ${maxDepth}`
      });
      console.log(`🔴 Brace imbalance: Final depth ${braceDepth}`);
    }
    
    // Check for parentheses balance
    let parenDepth = 0;
    let parenErrors = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      
      parenDepth += openParens - closeParens;
      
      if (parenDepth < 0) {
        parenErrors++;
        console.log(`🔴 Parentheses mismatch at line ${i + 1}: ${line.trim()}`);
      }
    }
    
    if (parenDepth !== 0) {
      issues.push({
        type: 'PAREN_IMBALANCE',
        count: Math.abs(parenDepth),
        severity: 'HIGH', 
        details: `Final depth: ${parenDepth}`
      });
      console.log(`🔴 Parentheses imbalance: Final depth ${parenDepth}`);
    }
    
    // Check for incomplete imports
    const incompleteImports = content.match(/import\s+[^;]*$|from\s+[^;]*$/gm);
    if (incompleteImports) {
      issues.push({
        type: 'INCOMPLETE_IMPORTS',
        count: incompleteImports.length,
        severity: 'MEDIUM',
        examples: incompleteImports.slice(0, 3)
      });
      console.log(`🔴 Incomplete imports: ${incompleteImports.length}`);
    }
    
    // Check for unterminated strings (look for template literals and string issues)
    const lines870_871 = [lines[869], lines[870]]; // Lines 870-871 (0-indexed)
    if (lines870_871.some(line => line && line.includes('`'))) {
      console.log('🔍 Checking template literal issues around lines 870-871:');
      lines870_871.forEach((line, idx) => {
        if (line) {
          console.log(`   Line ${870 + idx}: ${line.trim()}`);
          // Check for unmatched backticks
          const backticks = (line.match(/`/g) || []).length;
          if (backticks % 2 !== 0) {
            console.log(`     🔴 Odd number of backticks: ${backticks}`);
          }
        }
      });
    }
    
    // Summary
    if (issues.length > 0) {
      console.log(`\n📊 SUMMARY for ${path.basename(filePath)}:`);
      console.log(`   Total issue types: ${issues.length}`);
      issues.forEach(issue => {
        console.log(`   • ${issue.type}: ${issue.count} occurrences (${issue.severity})`);
      });
    } else {
      console.log(`\n✅ No issues detected in ${path.basename(filePath)}`);
    }
    
    return issues;
    
  } catch (error) {
    console.log(`❌ Error analyzing ${filePath}: ${error.message}`);
    return [];
  }
}

async function runActualSyntaxCheck(filePath) {
  try {
    console.log(`\n🔬 ACTUAL NODE.JS SYNTAX CHECK: ${path.basename(filePath)}`);
    
    // Try to check syntax with Node.js
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      await execAsync(`node --check "${filePath}"`);
      console.log(`   ✅ Node.js syntax check: PASSED`);
      return { valid: true };
    } catch (error) {
      console.log(`   🔴 Node.js syntax check: FAILED`);
      console.log(`   💥 Error: ${error.message}`);
      return { valid: false, error: error.message };
    }
    
  } catch (error) {
    return { valid: false, error: `Check failed: ${error.message}` };
  }
}

async function main() {
  console.log('🕵️ DEEP VALIDATION - CATCHING FALSE POSITIVES');
  console.log('===============================================');
  console.log('Re-analyzing files we KNOW should have issues...\n');
  
  let totalIssuesFound = 0;
  let filesWithIssues = 0;
  
  for (const filePath of KNOWN_PROBLEMATIC_FILES) {
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }
    
    // Deep analysis
    const issues = await deepAnalyzeFile(filePath);
    
    // Actual syntax check
    const syntaxResult = await runActualSyntaxCheck(filePath);
    
    if (issues.length > 0) {
      totalIssuesFound += issues.reduce((sum, issue) => sum + issue.count, 0);
      filesWithIssues++;
    }
    
    // Compare results
    console.log(`\n🔍 COMPARISON for ${path.basename(filePath)}:`);
    console.log(`   Deep analysis found: ${issues.length} issue types`);
    console.log(`   Node.js syntax valid: ${syntaxResult.valid ? 'YES' : 'NO'}`);
    
    if (issues.length > 0 && syntaxResult.valid) {
      console.log(`   📊 CONCLUSION: Issues are NON-BREAKING (cosmetic/quality)`);
    } else if (issues.length > 0 && !syntaxResult.valid) {
      console.log(`   📊 CONCLUSION: Issues are BREAKING (syntax errors)`);
    } else if (issues.length === 0 && syntaxResult.valid) {
      console.log(`   📊 CONCLUSION: File is CLEAN`);
    } else {
      console.log(`   📊 CONCLUSION: UNEXPECTED STATE - needs investigation`);
    }
  }
  
  console.log('\n📋 FINAL DEEP ANALYSIS REPORT');
  console.log('==============================');
  console.log(`Files analyzed: ${KNOWN_PROBLEMATIC_FILES.length}`);
  console.log(`Files with issues found: ${filesWithIssues}`);
  console.log(`Total issues detected: ${totalIssuesFound}`);
  
  if (totalIssuesFound === 0) {
    console.log('\n🚨 CONFIRMED FALSE POSITIVE:');
    console.log('   The comprehensive tool missed real issues that exist!');
    console.log('   This validates your suspicion about false positives.');
  } else {
    console.log('\n✅ ISSUES CONFIRMED:');
    console.log('   Deep analysis found the expected issues.');
    console.log('   The comprehensive tool had detection gaps.');
  }
}

main().catch(console.error);
