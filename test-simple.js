/**
 * Simple Test Runner
 * Basic validation of ES module functionality and environment setup
 */

async function runSimpleTest() {
  console.log('🧪 Simple Test Starting...\n');
  
  const results = { total: 0, passed: 0, failed: 0 };
  
  // Test 1: Basic JavaScript execution
  results.total++;
  try {
    console.log('✅ Basic JavaScript execution works');
    results.passed++;
  } catch (error) {
    console.error('❌ Basic JavaScript execution failed:', error.message);
    results.failed++;
  }
  
  // Test 2: Node.js version check
  results.total++;
  try {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    if (majorVersion >= 14) {
      console.log(`✅ Node.js version compatible (${version})`);
      results.passed++;
    } else {
      throw new Error(`Node.js ${version} detected. ES modules require Node.js >= 14`);
    }
  } catch (error) {
    console.error('❌ Node.js version check failed:', error.message);
    results.failed++;
  }
  
  // Test 3: ES Module import
  results.total++;
  try {
    await import('./___stage1/test-behavior-driven.js');
    console.log('✅ ES Module import successful');
    results.passed++;
  } catch (error) {
    console.error('❌ ES Module import failed:', error.message);
    console.error('💡 Troubleshooting tips:');
    console.error('   - Ensure package.json has "type": "module"');
    console.error('   - Check if file exists: ___stage1/test-behavior-driven.js');
    console.error('   - Verify all dependencies are installed');
    results.failed++;
  }
  
  // Report results
  console.log('\n' + '='.repeat(40));
  console.log('🧪 SIMPLE TEST RESULTS');
  console.log('='.repeat(40));
  console.log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✨ Your environment is ready for the Forest system!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Execute the test
runSimpleTest().catch(error => {
  console.error('❌ Simple test runner crashed:', error.message);
  process.exit(1);
});