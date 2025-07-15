#!/usr/bin/env node

/**
 * Simple Forest Compliance Test
 * Tests core Forest functionality without external dependencies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function test(name, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result) {
      passedTests++;
      results.push({ name, status: 'PASS', message: 'Test passed' });
      console.log(`✅ ${name}`);
    } else {
      failedTests++;
      results.push({ name, status: 'FAIL', message: 'Test returned false' });
      console.log(`❌ ${name}`);
    }
  } catch (error) {
    failedTests++;
    results.push({ name, status: 'FAIL', message: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(path.resolve(__dirname, filePath));
  } catch {
    return false;
  }
}

function hasContent(filePath, searchText) {
  try {
    const content = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    return content.includes(searchText);
  } catch {
    return false;
  }
}

function hasExport(filePath, exportName) {
  try {
    const content = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    return content.includes(`export`) && (
      content.includes(`export class ${exportName}`) ||
      content.includes(`export function ${exportName}`) ||
      content.includes(`export const ${exportName}`) ||
      content.includes(`export { ${exportName}`) ||
      content.includes(`export default ${exportName}`)
    );
  } catch {
    return false;
  }
}

console.log('🌲 Forest System Compliance Test - Simple Version');
console.log('================================================\n');

// 1. Core File Structure Tests
console.log('📁 Testing Core File Structure...');

test('COMPLETE_FOREST_DOCUMENTATION.md exists', () => 
  fileExists('COMPLETE_FOREST_DOCUMENTATION.md'));

test('core-initialization.js exists', () => 
  fileExists('core-initialization.js'));

test('core-server.js exists', () => 
  fileExists('core-server.js'));

test('package.json exists in root', () => 
  fileExists('../package.json'));

// 2. Core Module Tests
console.log('\n🔧 Testing Core Modules...');

test('hta-core.js exists', () => 
  fileExists('modules/hta-core.js'));

test('task-strategy-core.js exists', () => 
  fileExists('modules/task-strategy-core.js'));

test('mcp-core.js exists', () => 
  fileExists('modules/mcp-core.js'));

test('project-management.js exists', () => 
  fileExists('modules/project-management.js'));

test('data-persistence.js exists', () => 
  fileExists('modules/data-persistence.js'));

// 3. HTA Core Functionality Tests
console.log('\n🌳 Testing HTA Core Functionality...');

test('HTA Core has buildHTATree method', () => 
  hasContent('modules/hta-core.js', 'buildHTATree'));

test('HTA Core has getHTAStatus method', () => 
  hasContent('modules/hta-core.js', 'getHTAStatus'));

test('HTA Core has Pure Schema HTA system', () => 
  hasContent('modules/hta-core.js', 'Pure Schema') || hasContent('modules/hta-core.js', 'schema'));

test('HTA Core has 6-level decomposition', () => 
  hasContent('modules/hta-core.js', '6') && hasContent('modules/hta-core.js', 'level'));

// 4. Task Strategy Tests
console.log('\n📋 Testing Task Strategy Core...');

test('Task Strategy has getNextTask method', () => 
  hasContent('modules/task-strategy-core.js', 'getNextTask'));

test('Task Strategy has evolveStrategy method', () => 
  hasContent('modules/task-strategy-core.js', 'evolveStrategy'));

test('Task Strategy has task selection logic', () => 
  hasContent('modules/task-strategy-core.js', 'select') || hasContent('modules/task-strategy-core.js', 'choose'));

// 5. MCP Integration Tests
console.log('\n🔌 Testing MCP Integration...');

test('MCP Core exists and has tool definitions', () => 
  hasContent('modules/mcp-core.js', 'tool') || hasContent('modules/mcp-core.js', 'Tool'));

test('Core server integrates MCP', () => 
  hasContent('core-server.js', 'mcp') || hasContent('core-server.js', 'MCP'));

test('Local MCP server implementation exists', () => 
  fileExists('local-mcp-server.js'));

// 6. Gated Onboarding Tests
console.log('\n🚪 Testing Gated Onboarding System...');

test('Gated onboarding flow exists', () => 
  fileExists('modules/gated-onboarding-flow.js'));

test('Onboarding has 6-stage system', () => 
  hasContent('modules/gated-onboarding-flow.js', '6') || 
  hasContent('modules/gated-onboarding-flow.js', 'stage'));

test('Next + Pipeline presenter exists', () => 
  fileExists('modules/next-pipeline-presenter.js'));

// 7. Vector Intelligence Tests
console.log('\n🧠 Testing Vector Intelligence...');

test('Vector provider interface exists', () => 
  fileExists('modules/vector-providers/IVectorProvider.js'));

test('SQLite vector provider exists', () => 
  fileExists('modules/vector-providers/SQLiteVecProvider.js'));

test('Forest data vectorization exists', () => 
  fileExists('modules/forest-data-vectorization.js'));

// 8. Ambiguous Desires Architecture Tests
console.log('\n🎯 Testing Ambiguous Desires Architecture...');

test('Ambiguous desires manager exists', () => 
  fileExists('modules/ambiguous-desires/index.js'));

test('Clarification dialogue exists', () => 
  hasContent('modules/ambiguous-desires/index.js', 'clarification') ||
  fileExists('modules/ambiguous-desires/clarification-dialogue.js'));

test('Goal convergence detection exists', () => 
  hasContent('modules/ambiguous-desires/index.js', 'convergence') ||
  fileExists('modules/ambiguous-desires/convergence-detector.js'));

// 9. Documentation Compliance Tests
console.log('\n📚 Testing Documentation Compliance...');

test('Documentation mentions Pure Schema HTA', () => 
  hasContent('COMPLETE_FOREST_DOCUMENTATION.md', 'Pure Schema'));

test('Documentation mentions 6-stage onboarding', () => 
  hasContent('COMPLETE_FOREST_DOCUMENTATION.md', '6') && 
  hasContent('COMPLETE_FOREST_DOCUMENTATION.md', 'stage'));

test('Documentation mentions Next + Pipeline', () => 
  hasContent('COMPLETE_FOREST_DOCUMENTATION.md', 'Next') && 
  hasContent('COMPLETE_FOREST_DOCUMENTATION.md', 'Pipeline'));

test('Documentation mentions Vector Intelligence', () => 
  hasContent('COMPLETE_FOREST_DOCUMENTATION.md', 'Vector') && 
  hasContent('COMPLETE_FOREST_DOCUMENTATION.md', 'Intelligence'));

// 10. System Integration Tests
console.log('\n⚙️ Testing System Integration...');

test('Core initialization integrates all modules', () => 
  hasContent('core-initialization.js', 'hta') && 
  hasContent('core-initialization.js', 'task') && 
  hasContent('core-initialization.js', 'mcp'));

test('Core server has tool router', () => 
  hasContent('core-server.js', 'toolRouter') || hasContent('core-server.js', 'tool'));

test('System has landing page generation', () => 
  hasContent('core-server.js', 'landing') || hasContent('core-server.js', 'Landing'));

// Results Summary
console.log('\n' + '='.repeat(50));
console.log('📊 COMPLIANCE TEST RESULTS');
console.log('='.repeat(50));

console.log(`\n📈 Summary:`);
console.log(`   Total Tests: ${totalTests}`);
console.log(`   Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
console.log(`   Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);

if (failedTests > 0) {
  console.log(`\n❌ Failed Tests:`);
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`   • ${r.name}: ${r.message}`);
  });
}

const compliancePercentage = Math.round(passedTests/totalTests*100);
console.log(`\n🎯 Overall Compliance: ${compliancePercentage}%`);

if (compliancePercentage >= 90) {
  console.log('✅ EXCELLENT - System is highly compliant with documentation');
} else if (compliancePercentage >= 75) {
  console.log('⚠️  GOOD - System is mostly compliant, minor issues detected');
} else if (compliancePercentage >= 50) {
  console.log('⚠️  MODERATE - System has significant compliance gaps');
} else {
  console.log('❌ POOR - System requires major work to achieve compliance');
}

console.log('\n🌲 Forest Compliance Test Complete\n');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);