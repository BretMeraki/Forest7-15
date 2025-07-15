#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TEST_FILES = [
  // Files that SHOULD have errors (according to our detection)
  {
    file: '___stage1/core-server.js',
    expectedErrors: ['UNTERMINATED_STRING'],
    expectedCount: 10
  },
  {
    file: '___stage1/modules/diagnostic-handlers.js',
    expectedErrors: ['UNTERMINATED_STRING'],
    expectedCount: 2
  },
  {
    file: '___stage1/utils/diagnostic-verifier.js',
    expectedErrors: ['BRACKET_MISMATCH', 'PAREN_MISMATCH', 'INCOMPLETE_IMPORT', 'UNTERMINATED_STRING'],
    expectedCount: 5
  },
  {
    file: '___stage1/utils/claude-diagnostic-helper.js',
    expectedErrors: ['INCOMPLETE_IMPORT', 'UNTERMINATED_STRING'],
    expectedCount: 2
  },
  {
    file: '___stage1/utils/runtime-safety.js',
    expectedErrors: ['UNTERMINATED_STRING'],
    expectedCount: 2
  },
  
  // Files that SHOULD NOT have errors (according to our detection)
  {
    file: '___stage1/forest-mcp-server.js',
    expectedErrors: [],
    expectedCount: 0
  },
  {
    file: '___stage1/core-initialization.js',
    expectedErrors: [],
    expectedCount: 0
  },
  {
    file: '___stage1/tools/diagnostic-tool.js',
    expectedErrors: [],
    expectedCount: 0
  },
  {
    file: '___stage1/errors.js',
    expectedErrors: [],
    expectedCount: 0
  }
];

async function validateRuntimeExecution(filePath) {
  try {
    console.log(`🔍 Runtime validation: ${filePath}`);
    
    // Try to import/require the file to see if it's syntactically valid
    const fullPath = path.resolve(filePath);
    
    // Check if file exists
    await fs.access(fullPath);
    
    // Try to parse as JavaScript
    const content = await fs.readFile(fullPath, 'utf8');
    
    // Basic syntax validation - try to parse with Node.js
    try {
      // Create a temporary test file to validate syntax
      const tempFile = `temp_syntax_test_${Date.now()}.js`;
      await fs.writeFile(tempFile, content);
      
      // Try to check syntax
      const { stdout, stderr } = await execAsync(`node --check ${tempFile}`);
      
      // Clean up
      await fs.unlink(tempFile);
      
      if (stderr) {
        return { valid: false, error: stderr.trim() };
      }
      
      return { valid: true, error: null };
      
    } catch (syntaxError) {
      return { valid: false, error: syntaxError.message };
    }
    
  } catch (error) {
    return { valid: false, error: `File access error: ${error.message}` };
  }
}

async function runOurErrorDetection() {
  try {
    console.log('📊 Running our error detection tools...');
    
    // Run simple syntax check
    const { stdout, stderr } = await execAsync('node simple-syntax-check.js');
    
    // Parse the output to extract detected errors
    const lines = stdout.split('\n');
    const detectedErrors = {};
    
    let currentFile = null;
    for (const line of lines) {
      if (line.includes('📁 ___stage1/')) {
        currentFile = line.split('📁 ')[1].split(':')[0];
        detectedErrors[currentFile] = [];
      } else if (line.includes('🔴') && currentFile) {
        const errorType = line.split('🔴 ')[1].split(':')[0];
        detectedErrors[currentFile].push(errorType);
      }
    }
    
    return detectedErrors;
    
  } catch (error) {
    console.error('Error running detection tools:', error.message);
    return {};
  }
}

async function validateFalsePositives(detectedErrors) {
  console.log('\n🔍 VALIDATING FALSE POSITIVES');
  console.log('================================');
  
  const falsePositives = [];
  
  for (const [filePath, errors] of Object.entries(detectedErrors)) {
    if (errors.length === 0) continue;
    
    console.log(`\n📁 Checking: ${filePath}`);
    
    // Check if file actually has runtime/syntax issues
    const runtimeResult = await validateRuntimeExecution(filePath);
    
    if (runtimeResult.valid) {
      console.log(`  ⚠️  POTENTIAL FALSE POSITIVE: File is syntactically valid but errors detected`);
      console.log(`  🔴 Detected errors: ${errors.join(', ')}`);
      falsePositives.push({
        file: filePath,
        detectedErrors: errors,
        actualStatus: 'valid',
        reason: 'File parses correctly but errors were detected'
      });
    } else {
      console.log(`  ✅ TRUE POSITIVE: File has real syntax issues`);
      console.log(`  💥 Actual error: ${runtimeResult.error}`);
      console.log(`  🔴 Detected errors: ${errors.join(', ')}`);
    }
  }
  
  return falsePositives;
}

async function validateFalseNegatives(detectedErrors) {
  console.log('\n🔍 VALIDATING FALSE NEGATIVES');
  console.log('================================');
  
  const falseNegatives = [];
  
  // Check files that should be clean according to our detection
  const cleanFiles = TEST_FILES.filter(f => f.expectedCount === 0);
  
  for (const testFile of cleanFiles) {
    console.log(`\n📁 Checking: ${testFile.file}`);
    
    const detectedForFile = detectedErrors[testFile.file] || [];
    
    if (detectedForFile.length === 0) {
      // Check if file actually has hidden issues
      const runtimeResult = await validateRuntimeExecution(testFile.file);
      
      if (!runtimeResult.valid) {
        console.log(`  ⚠️  POTENTIAL FALSE NEGATIVE: File has issues but none detected`);
        console.log(`  💥 Actual error: ${runtimeResult.error}`);
        falseNegatives.push({
          file: testFile.file,
          detectedErrors: [],
          actualStatus: 'invalid',
          actualError: runtimeResult.error,
          reason: 'File has real issues but none were detected'
        });
      } else {
        console.log(`  ✅ TRUE NEGATIVE: File is clean and no errors detected`);
      }
    } else {
      console.log(`  ⚠️  Expected clean but found: ${detectedForFile.join(', ')}`);
    }
  }
  
  return falseNegatives;
}

async function validateDetectionAccuracy() {
  console.log('\n📊 DETECTION ACCURACY VALIDATION');
  console.log('================================');
  
  const detectedErrors = await runOurErrorDetection();
  
  let totalFiles = 0;
  let correctDetections = 0;
  let accuracy = 0;
  
  for (const testFile of TEST_FILES) {
    totalFiles++;
    
    const detectedForFile = detectedErrors[testFile.file] || [];
    const expectedCount = testFile.expectedCount;
    const actualCount = detectedForFile.length;
    
    console.log(`\n📄 ${testFile.file}`);
    console.log(`  Expected: ${expectedCount} errors`);
    console.log(`  Detected: ${actualCount} errors`);
    
    if (expectedCount === 0 && actualCount === 0) {
      console.log(`  ✅ CORRECT: Clean file correctly identified`);
      correctDetections++;
    } else if (expectedCount > 0 && actualCount > 0) {
      console.log(`  ✅ CORRECT: Errors correctly detected`);
      correctDetections++;
    } else if (expectedCount === 0 && actualCount > 0) {
      console.log(`  ❌ FALSE POSITIVE: Expected clean, but detected errors`);
    } else if (expectedCount > 0 && actualCount === 0) {
      console.log(`  ❌ FALSE NEGATIVE: Expected errors, but none detected`);
    }
  }
  
  accuracy = (correctDetections / totalFiles) * 100;
  
  console.log(`\n📈 ACCURACY SUMMARY`);
  console.log(`Total files tested: ${totalFiles}`);
  console.log(`Correct detections: ${correctDetections}`);
  console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
  
  return { accuracy, correctDetections, totalFiles };
}

async function main() {
  console.log('🔍 FALSE POSITIVE/NEGATIVE VALIDATION SUITE');
  console.log('===========================================');
  
  try {
    // Run comprehensive validation
    const detectedErrors = await runOurErrorDetection();
    console.log('\n📊 Detected errors:', Object.keys(detectedErrors).length, 'files with issues');
    
    // Validate false positives
    const falsePositives = await validateFalsePositives(detectedErrors);
    
    // Validate false negatives
    const falseNegatives = await validateFalseNegatives(detectedErrors);
    
    // Calculate accuracy
    const accuracyResult = await validateDetectionAccuracy();
    
    // Final report
    console.log('\n📋 FINAL VALIDATION REPORT');
    console.log('==========================');
    console.log(`🎯 Detection Accuracy: ${accuracyResult.accuracy.toFixed(1)}%`);
    console.log(`⚠️  False Positives: ${falsePositives.length}`);
    console.log(`⚠️  False Negatives: ${falseNegatives.length}`);
    
    if (falsePositives.length > 0) {
      console.log('\n🔴 FALSE POSITIVES DETECTED:');
      falsePositives.forEach(fp => {
        console.log(`  - ${fp.file}: ${fp.reason}`);
      });
    }
    
    if (falseNegatives.length > 0) {
      console.log('\n🔴 FALSE NEGATIVES DETECTED:');
      falseNegatives.forEach(fn => {
        console.log(`  - ${fn.file}: ${fn.reason}`);
      });
    }
    
    if (falsePositives.length === 0 && falseNegatives.length === 0) {
      console.log('\n🎉 EXCELLENT: No false positives or negatives detected!');
      console.log('🎯 Your error detection tools are highly accurate!');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

main().catch(console.error);
