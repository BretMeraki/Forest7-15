// Debug version of behavioral test runner
console.log('Starting behavioral test with debug output...');

const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => {
    console.error('❌ Test timed out after 30 seconds');
    reject(new Error('Test timeout'));
  }, 30000);
});

const testPromise = import('./___stage1/test-behavior-driven.js')
  .then(module => {
    console.log('✅ Test module loaded');
    const { BehaviorDrivenTestSuite } = module;
    const suite = new BehaviorDrivenTestSuite();
    console.log('✅ Test suite created');
    
    return suite.runAllTests();
  })
  .then(() => {
    console.log('✅ All tests completed');
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  });

Promise.race([testPromise, timeoutPromise])
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed or timed out:', error.message);
    process.exit(1);
  });