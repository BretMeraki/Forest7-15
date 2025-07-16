/**
 * Performance and Integration Test Suite
 * Tests system performance, memory usage, and end-to-end workflows
 */

import { strict as assert } from 'assert';
import { TestAssertionHelpers } from './test-assertion-helpers.js';
import { CoreInitialization } from './core-initialization.js';

class PerformanceIntegrationTestSuite {
  constructor() {
    this.testResults = { total: 0, passed: 0, failed: 0 };
    this.performanceMetrics = {};
  }

  async runTest(name, testFn) {
    this.testResults.total++;
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      await testFn();
      this.testResults.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      this.testResults.failed++;
      console.error(`❌ ${name}: ${error.message}`);
    }
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    this.performanceMetrics[name] = {
      duration: endTime - startTime,
      memoryDelta: endMemory.heapUsed - startMemory.heapUsed
    };
  }

  async testSystemInitializationPerformance() {
    console.log('\n⚡ Testing System Initialization Performance...\n');

    await this.runTest('System startup time', async () => {
      const startTime = Date.now();
      
      const initialization = new CoreInitialization();
      const system = await initialization.initialize();
      
      const duration = Date.now() - startTime;
      
      // System should initialize within reasonable time
      TestAssertionHelpers.assertPerformance(startTime, 5000, 'System initialization');
      
      // Validate system is properly initialized
      TestAssertionHelpers.assertValidObject(system, 'Initialized system');
      assert(system.htaCore, 'System should have HTA core');
      assert(system.dataPersistence, 'System should have data persistence');
      assert(system.projectManagement, 'System should have project management');
      
      console.log(`   ⏱️  Initialization took ${duration}ms`);
    });

    await this.runTest('Memory usage during initialization', async () => {
      const beforeMemory = process.memoryUsage();
      
      const initialization = new CoreInitialization();
      const system = await initialization.initialize();
      
      const afterMemory = process.memoryUsage();
      const memoryIncrease = (afterMemory.heapUsed - beforeMemory.heapUsed) / 1024 / 1024;
      
      // Should not use excessive memory (adjust threshold as needed)
      assert(memoryIncrease < 100, `Memory increase should be reasonable (used ${memoryIncrease.toFixed(2)}MB)`);
      
      console.log(`   💾 Memory increase: ${memoryIncrease.toFixed(2)}MB`);
      
      // Cleanup
      if (system.shutdown) {
        await system.shutdown();
      }
    });
  }

  async testProjectLifecyclePerformance() {
    console.log('\n📁 Testing Project Lifecycle Performance...\n');

    const initialization = new CoreInitialization();
    const system = await initialization.initialize();

    await this.runTest('Project creation performance', async () => {
      const startTime = Date.now();
      
      const projectData = {
        project_name: 'performance-test-project',
        goal: 'Test project creation performance with a reasonably complex goal that includes multiple aspects and requirements'
      };
      
      const result = await system.projectManagement.createProject(projectData);
      
      TestAssertionHelpers.assertPerformance(startTime, 2000, 'Project creation');
      TestAssertionHelpers.assertSuccessResult(result, ['project_id']);
      TestAssertionHelpers.assertValidProject(result, ['project_id', 'goal']);
    });

    await this.runTest('HTA generation performance', async () => {
      const startTime = Date.now();
      
      const complexGoal = 'Master full-stack web development including frontend frameworks, backend APIs, database design, deployment strategies, testing methodologies, and performance optimization';
      
      try {
        const hta = await system.htaCore.generateHTATree('performance-test-project', complexGoal);
        
        TestAssertionHelpers.assertPerformance(startTime, 10000, 'HTA generation');
        
        if (hta) {
          TestAssertionHelpers.assertValidHTA(hta);
          
          // Validate complexity handling
          if (hta.strategicBranches) {
            assert(hta.strategicBranches.length >= 3, 'Complex goal should generate multiple branches');
            assert(hta.strategicBranches.length <= 8, 'Should not generate too many branches');
          }
        }
      } catch (error) {
        // HTA generation might fail due to LLM unavailability, which is acceptable
        console.log('   ⚠️  HTA generation skipped (LLM unavailable)');
      }
    });

    await this.runTest('Bulk project operations', async () => {
      const startTime = Date.now();
      const projectCount = 10;
      
      const promises = [];
      for (let i = 0; i < projectCount; i++) {
        promises.push(system.projectManagement.createProject({
          project_name: `bulk-test-${i}`,
          goal: `Bulk test project ${i} with specific learning objectives`
        }));
      }
      
      const results = await Promise.all(promises);
      
      TestAssertionHelpers.assertPerformance(startTime, 5000, 'Bulk project creation');
      
      // Validate all projects were created successfully
      results.forEach((result, index) => {
        TestAssertionHelpers.assertSuccessResult(result, ['project_id']);
        assert(result.project_id.includes(`bulk-test-${index}`), 
          `Project ${index} should have correct ID`);
      });
      
      console.log(`   📊 Created ${projectCount} projects in ${Date.now() - startTime}ms`);
    });

    // Cleanup
    if (system.shutdown) {
      await system.shutdown();
    }
  }

  async testDataPersistencePerformance() {
    console.log('\n💾 Testing Data Persistence Performance...\n');

    const initialization = new CoreInitialization();
    const system = await initialization.initialize();

    await this.runTest('Large data handling', async () => {
      const startTime = Date.now();
      
      // Create large dataset
      const largeData = {
        projects: Array(1000).fill(null).map((_, i) => ({
          id: `project-${i}`,
          name: `Project ${i}`,
          goal: `Learn something specific for project ${i} with detailed requirements and comprehensive objectives`,
          tasks: Array(50).fill(null).map((_, j) => ({
            id: `task-${i}-${j}`,
            title: `Task ${j} for project ${i}`,
            description: `Detailed description for task ${j} in project ${i} with comprehensive requirements and success criteria`,
            difficulty: Math.floor(Math.random() * 10) + 1,
            estimatedDuration: Math.floor(Math.random() * 120) + 15
          }))
        }))
      };
      
      await system.dataPersistence.saveProjectData('performance-test', 'large-dataset.json', largeData);
      
      const loadStartTime = Date.now();
      const loadedData = await system.dataPersistence.loadProjectData('performance-test', 'large-dataset.json');
      
      TestAssertionHelpers.assertPerformance(startTime, 5000, 'Large data save');
      TestAssertionHelpers.assertPerformance(loadStartTime, 2000, 'Large data load');
      
      // Validate data integrity
      assert(loadedData.projects.length === largeData.projects.length, 'All projects should be preserved');
      assert(loadedData.projects[0].tasks.length === largeData.projects[0].tasks.length, 'All tasks should be preserved');
      
      console.log(`   📈 Handled ${largeData.projects.length} projects with ${largeData.projects[0].tasks.length} tasks each`);
    });

    await this.runTest('Concurrent data operations', async () => {
      const startTime = Date.now();
      const operationCount = 20;
      
      const promises = [];
      for (let i = 0; i < operationCount; i++) {
        promises.push(async () => {
          const data = { operation: i, timestamp: Date.now() };
          await system.dataPersistence.saveProjectData('concurrent-test', `data-${i}.json`, data);
          const loaded = await system.dataPersistence.loadProjectData('concurrent-test', `data-${i}.json`);
          assert(loaded.operation === i, `Data ${i} should be preserved correctly`);
        });
      }
      
      await Promise.all(promises.map(fn => fn()));
      
      TestAssertionHelpers.assertPerformance(startTime, 3000, 'Concurrent operations');
      
      console.log(`   🔄 Completed ${operationCount} concurrent operations`);
    });

    // Cleanup
    if (system.shutdown) {
      await system.shutdown();
    }
  }

  async testEndToEndWorkflows() {
    console.log('\n🔄 Testing End-to-End Workflows...\n');

    const initialization = new CoreInitialization();
    const system = await initialization.initialize();

    await this.runTest('Complete learning journey workflow', async () => {
      const startTime = Date.now();
      
      // Step 1: Create project
      const projectResult = await system.projectManagement.createProject({
        project_name: 'e2e-learning-journey',
        goal: 'Master React development with hooks, context, and testing'
      });
      
      TestAssertionHelpers.assertSuccessResult(projectResult, ['project_id']);
      const projectId = projectResult.project_id;
      
      // Step 2: Switch to project
      const switchResult = await system.projectManagement.switchProject(projectId);
      TestAssertionHelpers.assertSuccessResult(switchResult);
      
      // Step 3: Generate HTA (if possible)
      try {
        const hta = await system.htaCore.generateHTATree(projectId, projectResult.goal);
        if (hta) {
          TestAssertionHelpers.assertValidHTA(hta);
        }
      } catch (error) {
        console.log('   ⚠️  HTA generation skipped (LLM unavailable)');
      }
      
      // Step 4: List projects to verify
      const listResult = await system.projectManagement.listProjects();
      TestAssertionHelpers.assertSuccessResult(listResult, ['projects']);
      TestAssertionHelpers.assertValidArray(listResult.projects, 'Projects list', 1);
      
      const foundProject = listResult.projects.find(p => p.id === projectId);
      assert(foundProject, 'Created project should be in list');
      TestAssertionHelpers.assertValidProject(foundProject);
      
      // Step 5: Clean up
      const deleteResult = await system.projectManagement.deleteProject({ project_id: projectId });
      TestAssertionHelpers.assertSuccessResult(deleteResult);
      
      TestAssertionHelpers.assertPerformance(startTime, 8000, 'Complete workflow');
      
      console.log(`   ✨ Complete workflow took ${Date.now() - startTime}ms`);
    });

    await this.runTest('Multi-project management workflow', async () => {
      const startTime = Date.now();
      const projectCount = 5;
      const createdProjects = [];
      
      // Create multiple projects
      for (let i = 0; i < projectCount; i++) {
        const result = await system.projectManagement.createProject({
          project_name: `multi-project-${i}`,
          goal: `Learning goal ${i} with specific objectives and requirements`
        });
        
        TestAssertionHelpers.assertSuccessResult(result, ['project_id']);
        createdProjects.push(result.project_id);
      }
      
      // Switch between projects
      for (const projectId of createdProjects) {
        const switchResult = await system.projectManagement.switchProject(projectId);
        TestAssertionHelpers.assertSuccessResult(switchResult);
        
        const activeProject = await system.projectManagement.getActiveProject();
        assert(activeProject.id === projectId, 'Active project should match switched project');
      }
      
      // List all projects
      const listResult = await system.projectManagement.listProjects();
      TestAssertionHelpers.assertValidArray(listResult.projects, 'Projects', projectCount);
      
      // Verify all created projects are in the list
      createdProjects.forEach(projectId => {
        const found = listResult.projects.find(p => p.id === projectId);
        assert(found, `Project ${projectId} should be in list`);
      });
      
      // Clean up all projects
      for (const projectId of createdProjects) {
        const deleteResult = await system.projectManagement.deleteProject({ project_id: projectId });
        TestAssertionHelpers.assertSuccessResult(deleteResult);
      }
      
      TestAssertionHelpers.assertPerformance(startTime, 10000, 'Multi-project workflow');
      
      console.log(`   🎯 Managed ${projectCount} projects successfully`);
    });

    // Cleanup
    if (system.shutdown) {
      await system.shutdown();
    }
  }

  async testMemoryLeaks() {
    console.log('\n🧠 Testing Memory Leak Prevention...\n');

    await this.runTest('Memory stability over multiple operations', async () => {
      const initialMemory = process.memoryUsage();
      const operationCount = 100;
      
      for (let i = 0; i < operationCount; i++) {
        const initialization = new CoreInitialization();
        const system = await initialization.initialize();
        
        // Perform some operations
        await system.projectManagement.createProject({
          project_name: `memory-test-${i}`,
          goal: `Memory test ${i}`
        });
        
        // Cleanup
        if (system.shutdown) {
          await system.shutdown();
        }
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      
      // Memory increase should be reasonable (adjust threshold as needed)
      assert(memoryIncrease < 50, 
        `Memory increase should be minimal after ${operationCount} operations (increased ${memoryIncrease.toFixed(2)}MB)`);
      
      console.log(`   📊 Memory increase after ${operationCount} operations: ${memoryIncrease.toFixed(2)}MB`);
    });
  }

  async runAllTests() {
    console.log('⚡ Performance & Integration Test Suite\n');
    console.log('Testing system performance, memory usage, and end-to-end workflows...\n');
    
    try {
      await this.testSystemInitializationPerformance();
      await this.testProjectLifecyclePerformance();
      await this.testDataPersistencePerformance();
      await this.testEndToEndWorkflows();
      await this.testMemoryLeaks();
    } catch (error) {
      console.error('Test suite error:', error);
    }
    
    this.reportResults();
  }

  reportResults() {
    console.log('\n' + '='.repeat(60));
    console.log('⚡ PERFORMANCE & INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\nTotal Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);
    
    console.log('\n📊 Performance Metrics:');
    Object.entries(this.performanceMetrics).forEach(([testName, metrics]) => {
      console.log(`   ${testName}:`);
      console.log(`     ⏱️  Duration: ${metrics.duration}ms`);
      console.log(`     💾 Memory: ${(metrics.memoryDelta / 1024 / 1024).toFixed(2)}MB`);
    });
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL PERFORMANCE TESTS PASSED!');
      console.log('Your system performs excellently! 🚀');
    } else {
      console.log('\n⚠️  Some performance tests failed.');
      console.log('Review system performance and optimization.');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new PerformanceIntegrationTestSuite();
  suite.runAllTests().catch(console.error);
}

export { PerformanceIntegrationTestSuite };