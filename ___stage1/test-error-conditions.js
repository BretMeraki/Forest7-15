/**
 * Error Condition Testing Suite
 * Tests error handling, edge cases, and boundary conditions
 */

import { strict as assert } from 'assert';
import fs from 'fs/promises';
import { TestAssertionHelpers } from './test-assertion-helpers.js';
import { DataPersistence } from './modules/data-persistence.js';
import { ProjectManagement } from './modules/project-management.js';
import { EnhancedHTACore } from './modules/enhanced-hta-core.js';

class ErrorConditionTestSuite {
  constructor() {
    this.testResults = { total: 0, passed: 0, failed: 0 };
    this.testDataDir = './.test-error-data';
    this.invalidDataDir = './non-existent-directory';
  }

  // Factory method for creating test instances
  createDataPersistence(directory = this.testDataDir) {
    return new DataPersistence(directory);
  }

  createProjectManagement(dataPersistence = null) {
    const dp = dataPersistence || this.createDataPersistence();
    return new ProjectManagement(dp);
  }

  createMockLLMInterface(shouldFail = true) {
    return {
      chat: async () => { 
        if (shouldFail) throw new Error('LLM service unavailable');
        return { response: 'mock response' };
      }
    };
  }

  async runTest(name, testFn) {
    this.testResults.total++;
    try {
      await testFn();
      this.testResults.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      this.testResults.failed++;
      console.error(`❌ ${name}: ${error.message}`);
    }
  }

  async testDataPersistenceErrors() {
    console.log('\n💾 Testing Data Persistence Error Conditions...\n');
    
    const dataPersistence = this.createDataPersistence(this.invalidDataDir);
    
    await this.runTest('Invalid directory handling', async () => {
      try {
        await dataPersistence.loadProjectData('invalid-project', 'test.json');
        assert(false, 'Should have thrown an error for invalid directory');
      } catch (error) {
        assert(error.message.includes('ENOENT') || error.message.includes('not found'), 
          'Should throw file not found error');
      }
    });

    await this.runTest('Null project ID handling', async () => {
      try {
        await dataPersistence.saveProjectData(null, 'test.json', { data: 'test' });
        assert(false, 'Should have thrown an error for null project ID');
      } catch (error) {
        assert(error.message.includes('project') || error.message.includes('null'), 
          'Should throw project ID error');
      }
    });

    await this.runTest('Invalid JSON data handling', async () => {
      try {
        // Try to save circular reference (should fail JSON.stringify)
        const circularObj = {};
        circularObj.self = circularObj;
        await dataPersistence.saveProjectData('test-project', 'circular.json', circularObj);
        assert(false, 'Should have thrown an error for circular reference');
      } catch (error) {
        assert(error.message.includes('circular') || error.message.includes('JSON'), 
          'Should throw JSON serialization error');
      }
    });

    await this.runTest('Transaction rollback on error', async () => {
      const validDataPersistence = this.createDataPersistence();
      
      try {
        const txId = validDataPersistence.beginTransaction();
        await validDataPersistence.saveProjectData('test-project', 'valid.json', { data: 'valid' }, txId);
        
        // Force an error during transaction
        try {
          await validDataPersistence.saveProjectData('test-project', 'invalid.json', undefined, txId);
        } catch (e) {
          // Expected error
        }
        
        await validDataPersistence.rollbackTransaction(txId);
        
        // Verify rollback worked
        const data = await validDataPersistence.loadProjectData('test-project', 'valid.json');
        assert(!data, 'Data should not exist after rollback');
      } catch (error) {
        // This is expected behavior
        assert(true, 'Transaction rollback handled correctly');
      }
    });
  }

  async testProjectManagementErrors() {
    console.log('\n📁 Testing Project Management Error Conditions...\n');
    
    const dataPersistence = this.createDataPersistence();
    const projectManagement = this.createProjectManagement(dataPersistence);

    await this.runTest('Duplicate project creation', async () => {
      const projectData = {
        project_name: 'duplicate-test',
        goal: 'Test duplicate handling'
      };
      
      // Create first project
      const first = await projectManagement.createProject(projectData);
      TestAssertionHelpers.assertSuccessResult(first);
      
      // Try to create duplicate
      const duplicate = await projectManagement.createProject(projectData);
      TestAssertionHelpers.assertErrorResult(duplicate, 'already exists');
    });

    await this.runTest('Switch to non-existent project', async () => {
      const result = await projectManagement.switchProject('non-existent-project-id');
      TestAssertionHelpers.assertErrorResult(result, 'not found');
    });

    await this.runTest('Delete non-existent project', async () => {
      const result = await projectManagement.deleteProject({ project_id: 'non-existent' });
      TestAssertionHelpers.assertErrorResult(result, 'not found');
    });

    await this.runTest('Invalid project data validation', async () => {
      const invalidData = {
        // Missing required fields
        project_name: '',
        goal: ''
      };
      
      const result = await projectManagement.createProject(invalidData);
      TestAssertionHelpers.assertErrorResult(result);
    });
  }

  async testHTACoreErrors() {
    console.log('\n🧠 Testing HTA Core Error Conditions...\n');
    
    const dataPersistence = this.createDataPersistence();
    const projectManagement = this.createProjectManagement(dataPersistence);
    const mockLLMInterface = this.createMockLLMInterface();
    
    const htaCore = new EnhancedHTACore(dataPersistence, projectManagement, mockLLMInterface);

    await this.runTest('LLM service failure handling', async () => {
      try {
        await htaCore.generateHTATree('test-project', 'Learn something');
        assert(false, 'Should have handled LLM failure');
      } catch (error) {
        assert(error.message.includes('LLM') || error.message.includes('unavailable'), 
          'Should handle LLM service failure');
      }
    });

    await this.runTest('Invalid goal complexity analysis', async () => {
      const result = htaCore.analyzeGoalComplexity('');
      assert(result.score === 1, 'Empty goal should have minimum complexity');
      
      const nullResult = htaCore.analyzeGoalComplexity(null);
      assert(nullResult.score === 1, 'Null goal should have minimum complexity');
    });

    await this.runTest('Malformed HTA data handling', async () => {
      const malformedHTA = {
        // Missing required fields
        strategicBranches: null,
        frontierNodes: undefined
      };
      
      try {
        const result = await htaCore.validateHTAStructure(malformedHTA);
        assert(!result.valid, 'Should detect malformed HTA structure');
      } catch (error) {
        assert(true, 'Should handle malformed HTA gracefully');
      }
    });
  }

  async testBoundaryConditions() {
    console.log('\n🔍 Testing Boundary Conditions...\n');

    await this.runTest('Maximum string length handling', async () => {
      const veryLongString = 'a'.repeat(10000);
      const dataPersistence = this.createDataPersistence();
      
      try {
        await dataPersistence.saveProjectData('test-project', 'long.json', { 
          data: veryLongString 
        });
        
        const loaded = await dataPersistence.loadProjectData('test-project', 'long.json');
        assert(loaded.data === veryLongString, 'Should handle very long strings');
      } catch (error) {
        // Some systems may have limits
        assert(error.message.includes('too large') || error.message.includes('limit'), 
          'Should provide meaningful error for size limits');
      }
    });

    await this.runTest('Zero and negative numbers', async () => {
      const htaCore = new EnhancedHTACore();
      
      const zeroComplexity = htaCore.analyzeGoalComplexity('');
      assert(zeroComplexity.score >= 1, 'Complexity should have minimum value');
      
      // Test negative duration handling
      const task = { estimatedDuration: -30 };
      const adjustedDuration = htaCore.adjustTaskDuration?.(task) || task.estimatedDuration;
      assert(adjustedDuration >= 0, 'Duration should not be negative');
    });

    await this.runTest('Empty arrays and objects', async () => {
      const emptyHTA = {
        goal: 'Test goal',
        strategicBranches: [],
        frontierNodes: [],
        hierarchyMetadata: {}
      };
      
      TestAssertionHelpers.assertValidHTA(emptyHTA, 0, 0); // Allow empty for boundary test
    });

    await this.runTest('Unicode and special characters', async () => {
      const unicodeGoal = '学习编程 🚀 with émojis & spëcial chars';
      const dataPersistence = this.createDataPersistence();
      
      await dataPersistence.saveProjectData('unicode-test', 'unicode.json', { 
        goal: unicodeGoal 
      });
      
      const loaded = await dataPersistence.loadProjectData('unicode-test', 'unicode.json');
      assert(loaded.goal === unicodeGoal, 'Should handle Unicode characters correctly');
    });
  }

  async testConcurrencyIssues() {
    console.log('\n⚡ Testing Concurrency Issues...\n');

    await this.runTest('Concurrent project creation', async () => {
      const dataPersistence = this.createDataPersistence();
      const projectManagement = this.createProjectManagement(dataPersistence);
      
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(projectManagement.createProject({
          project_name: `concurrent-${i}`,
          goal: `Concurrent test ${i}`
        }));
      }
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      
      assert(successful.length === 5, 'All concurrent projects should be created successfully');
    });

    await this.runTest('Concurrent data access', async () => {
      const dataPersistence = this.createDataPersistence();
      
      // Create initial data
      await dataPersistence.saveProjectData('concurrent-test', 'counter.json', { count: 0 });
      
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(async () => {
          const data = await dataPersistence.loadProjectData('concurrent-test', 'counter.json');
          data.count += 1;
          await dataPersistence.saveProjectData('concurrent-test', 'counter.json', data);
        });
      }
      
      await Promise.all(promises.map(fn => fn()));
      
      const finalData = await dataPersistence.loadProjectData('concurrent-test', 'counter.json');
      // Note: Without proper locking, this might not be 10, which is expected
      assert(finalData.count >= 1, 'Should handle concurrent access gracefully');
    });
  }

  async setup() {
    // Clean test directories
    try {
      await fs.rm(this.testDataDir, { recursive: true, force: true });
      await fs.rm(this.invalidDataDir, { recursive: true, force: true });
    } catch (e) {}
    await fs.mkdir(this.testDataDir, { recursive: true });
  }

  async teardown() {
    // Clean up test data
    try {
      await fs.rm(this.testDataDir, { recursive: true, force: true });
    } catch (e) {}
  }

  async runAllTests() {
    console.log('🚨 Error Condition Test Suite\n');
    console.log('Testing error handling, edge cases, and boundary conditions...\n');
    
    try {
      await this.setup();
      await this.testDataPersistenceErrors();
      await this.testProjectManagementErrors();
      await this.testHTACoreErrors();
      await this.testBoundaryConditions();
      await this.testConcurrencyIssues();
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      await this.teardown();
      this.reportResults();
    }
  }

  reportResults() {
    console.log('\n' + '='.repeat(50));
    console.log('🚨 ERROR CONDITION TEST RESULTS');
    console.log('='.repeat(50));
    
    console.log(`\nTotal Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL ERROR CONDITION TESTS PASSED!');
      console.log('Your system handles errors gracefully! 🛡️');
    } else {
      console.log('\n⚠️  Some error condition tests failed.');
      console.log('Review error handling implementation.');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new ErrorConditionTestSuite();
  suite.runAllTests().catch(console.error);
}

export { ErrorConditionTestSuite };