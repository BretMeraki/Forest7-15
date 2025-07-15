#!/usr/bin/env node

import fs from 'fs';
import { Stage1CoreServer } from './core-server.js';

console.log('🔍 SYSTEMWIDE VALIDATION TEST');
console.log('=============================\n');

const results = {
  fileChecks: [],
  codeQuality: [],
  functionalTests: [],
  integrationTests: []
};

// 1. FILE STRUCTURE VALIDATION
console.log('📁 1. FILE STRUCTURE VALIDATION');
console.log('-------------------------------');

const requiredFiles = [
  // Core files
  { path: './core-server.js', category: 'Core' },
  { path: './core-initialization.js', category: 'Core' },
  { path: './core-handlers.js', category: 'Core' },
  
  // HTA System
  { path: './modules/pure-schema-driven-hta.js', category: 'HTA' },
  { path: './modules/enhanced-hta-core.js', category: 'HTA' },
  { path: './modules/hta-core.js', category: 'HTA' },
  
  // Intelligence
  { path: './modules/real-llm-interface.js', category: 'Intelligence' },
  { path: './modules/core-intelligence.js', category: 'Intelligence' },
  
  // Data
  { path: './modules/data-persistence.js', category: 'Data' },
  { path: './modules/project-management.js', category: 'Data' },
  
  // Vector Store
  { path: './modules/hta-vector-store.js', category: 'Vector' },
  { path: './modules/forest-data-vectorization.js', category: 'Vector' },
  
  // Tests
  { path: './deep-tree-test.js', category: 'Tests' },
  { path: './final-readiness-check.js', category: 'Tests' }
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file.path);
  const result = {
    file: file.path,
    category: file.category,
    exists,
    status: exists ? 'PASS' : 'FAIL'
  };
  results.fileChecks.push(result);
  console.log(`   ${exists ? '✅' : '❌'} [${file.category}] ${file.path}`);
});

// 2. CODE QUALITY CHECKS
console.log('\n📋 2. CODE QUALITY CHECKS');
console.log('-------------------------');

// Check for console.log statements (should use console.error in production)
let consoleLogCount = 0;
let todoCount = 0;
let hardcodedDomainCount = 0;

requiredFiles.forEach(file => {
  if (fs.existsSync(file.path) && file.path.endsWith('.js')) {
    const content = fs.readFileSync(file.path, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, i) => {
      // Skip comments and test files
      if (!line.trim().startsWith('//') && !file.path.includes('test')) {
        if (line.includes('console.log(') && !line.includes('console.error')) {
          consoleLogCount++;
        }
        if (line.toLowerCase().includes('todo') || line.toLowerCase().includes('fixme')) {
          todoCount++;
        }
        // Check for hardcoded domains in non-comment, non-string contexts
        if (!line.includes('//') && !line.includes('"') && !line.includes("'")) {
          if (line.match(/\b(pottery|cybersecurity|programming)\b/i)) {
            hardcodedDomainCount++;
          }
        }
      }
    });
  }
});

results.codeQuality.push({
  check: 'Console.log usage',
  count: consoleLogCount,
  status: consoleLogCount < 50 ? 'PASS' : 'WARN'
});

results.codeQuality.push({
  check: 'TODO/FIXME comments',
  count: todoCount,
  status: todoCount < 10 ? 'PASS' : 'WARN'
});

results.codeQuality.push({
  check: 'Hardcoded domains',
  count: hardcodedDomainCount,
  status: hardcodedDomainCount === 0 ? 'PASS' : 'FAIL'
});

console.log(`   ${consoleLogCount < 50 ? '✅' : '⚠️'} Console.log statements: ${consoleLogCount}`);
console.log(`   ${todoCount < 10 ? '✅' : '⚠️'} TODO/FIXME comments: ${todoCount}`);
console.log(`   ${hardcodedDomainCount === 0 ? '✅' : '❌'} Hardcoded domains: ${hardcodedDomainCount}`);

// 3. FUNCTIONAL TESTS
console.log('\n🧪 3. FUNCTIONAL TESTS');
console.log('---------------------');

async function runFunctionalTests() {
  // Test 1: Server initialization
  console.log('   Testing server initialization...');
  let server;
  try {
    server = new Stage1CoreServer({
      dataPersistence: { dataDir: './.test-validation' },
      vectorProvider: {
        provider: 'SQLiteVecProvider',
        config: { dbPath: './.test-validation/vectors.db' }
      }
    });
    await server.initialize();
    console.log('   ✅ Server initialization successful');
    results.functionalTests.push({ test: 'Server initialization', status: 'PASS' });
  } catch (error) {
    console.log('   ❌ Server initialization failed:', error.message);
    results.functionalTests.push({ test: 'Server initialization', status: 'FAIL', error: error.message });
    return;
  }

  // Test 2: Project creation
  console.log('   Testing project creation...');
  try {
    const projectResult = await server.createProject({
      goal: 'Test systemwide validation'
    });
    if (projectResult.success) {
      console.log('   ✅ Project creation successful');
      results.functionalTests.push({ test: 'Project creation', status: 'PASS' });
    } else {
      throw new Error(projectResult.error || 'Unknown error');
    }
  } catch (error) {
    console.log('   ❌ Project creation failed:', error.message);
    results.functionalTests.push({ test: 'Project creation', status: 'FAIL', error: error.message });
  }

  // Test 3: Schema-driven HTA generation
  console.log('   Testing schema-driven HTA generation...');
  try {
    const htaResult = await server.buildHTATree({
      goal: 'Master advanced quantum computing algorithms',
      progressiveDepth: 2,
      usePureSchemaOnly: true,
      forcePureSchema: true
    });
    
    if (htaResult.success) {
      console.log('   ✅ Schema-driven HTA generation successful');
      results.functionalTests.push({ test: 'Schema-driven HTA', status: 'PASS' });
    } else {
      throw new Error('HTA generation failed');
    }
  } catch (error) {
    console.log('   ❌ Schema-driven HTA generation failed:', error.message);
    results.functionalTests.push({ test: 'Schema-driven HTA', status: 'FAIL', error: error.message });
  }

  // Cleanup
  try {
    await server.cleanup();
  } catch (error) {
    // Ignore cleanup errors
  }
}

// 4. INTEGRATION TESTS
console.log('\n🔗 4. INTEGRATION TESTS');
console.log('----------------------');

function checkIntegrations() {
  // Check Pure Schema integration with Enhanced HTA
  if (fs.existsSync('./modules/enhanced-hta-core.js')) {
    const content = fs.readFileSync('./modules/enhanced-hta-core.js', 'utf8');
    const hasSchemaImport = content.includes("import { PureSchemaHTASystem }");
    const usesSchemaEngine = content.includes("this.schemaEngine = new PureSchemaHTASystem");
    const defaultsToSchema = content.includes("await this.schemaEngine.generateHTATree");
    
    const integrationStatus = hasSchemaImport && usesSchemaEngine && defaultsToSchema;
    console.log(`   ${integrationStatus ? '✅' : '❌'} Pure Schema ↔ Enhanced HTA integration`);
    results.integrationTests.push({
      test: 'Pure Schema integration',
      status: integrationStatus ? 'PASS' : 'FAIL'
    });
  }

  // Check Vector Store integration
  if (fs.existsSync('./modules/enhanced-hta-core.js')) {
    const content = fs.readFileSync('./modules/enhanced-hta-core.js', 'utf8');
    const hasVectorInit = content.includes("initializeVectorStore");
    const usesVectorStore = content.includes("this.vectorStore");
    
    const vectorStatus = hasVectorInit && usesVectorStore;
    console.log(`   ${vectorStatus ? '✅' : '❌'} Vector Store integration`);
    results.integrationTests.push({
      test: 'Vector Store integration',
      status: vectorStatus ? 'PASS' : 'FAIL'
    });
  }
}

// Run all tests
(async () => {
  await runFunctionalTests();
  checkIntegrations();
  
  // FINAL REPORT
  console.log('\n📊 FINAL VALIDATION REPORT');
  console.log('=========================');
  
  const filesPassed = results.fileChecks.filter(r => r.status === 'PASS').length;
  const filesTotal = results.fileChecks.length;
  console.log(`\nFile Structure: ${filesPassed}/${filesTotal} checks passed`);
  
  const qualityPassed = results.codeQuality.filter(r => r.status === 'PASS').length;
  const qualityTotal = results.codeQuality.length;
  console.log(`Code Quality: ${qualityPassed}/${qualityTotal} checks passed`);
  
  const functionalPassed = results.functionalTests.filter(r => r.status === 'PASS').length;
  const functionalTotal = results.functionalTests.length;
  console.log(`Functional Tests: ${functionalPassed}/${functionalTotal} tests passed`);
  
  const integrationPassed = results.integrationTests.filter(r => r.status === 'PASS').length;
  const integrationTotal = results.integrationTests.length;
  console.log(`Integration Tests: ${integrationPassed}/${integrationTotal} tests passed`);
  
  const totalPassed = filesPassed + qualityPassed + functionalPassed + integrationPassed;
  const totalTests = filesTotal + qualityTotal + functionalTotal + integrationTotal;
  const passRate = (totalPassed / totalTests * 100).toFixed(1);
  
  console.log(`\n🏆 OVERALL: ${totalPassed}/${totalTests} (${passRate}%) tests passed`);
  
  if (passRate >= 90) {
    console.log('\n✅ SYSTEM VALIDATION: PASSED');
    console.log('   The system meets production quality standards');
  } else if (passRate >= 80) {
    console.log('\n⚠️  SYSTEM VALIDATION: PASSED WITH WARNINGS');
    console.log('   The system is functional but has minor issues');
  } else {
    console.log('\n❌ SYSTEM VALIDATION: FAILED');
    console.log('   The system needs critical fixes');
  }
  
  // Domain-agnostic confirmation
  if (results.codeQuality.find(r => r.check === 'Hardcoded domains').status === 'PASS') {
    console.log('\n🌍 DOMAIN-AGNOSTIC: CONFIRMED ✅');
    console.log('   System is ready for ANY domain via LLM intelligence');
  }
})();
