/**
 * Base Test Suite Class
 * Common patterns and utilities for all test suites
 */

import { strict as assert } from 'assert';
import { TestAssertionHelpers } from './test-assertion-helpers.js';

export class BaseTestSuite {
  constructor(suiteName = 'Test Suite') {
    this.suiteName = suiteName;
    this.testResults = { total: 0, passed: 0, failed: 0, skipped: 0 };
    this.performanceMetrics = new Map();
    this.createdResources = new Set();
    this.startTime = Date.now();
  }

  // Enhanced test runner with performance tracking
  async runTest(name, testFn, options = {}) {
    const { timeout = 10000, skipIf = false, module = 'General' } = options;
    
    this.testResults.total++;
    
    if (skipIf) {
      this.testResults.skipped++;
      console.log(`⏭️  ${name} (skipped)`);
      return;
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    const resourcesBeforeTest = new Set(this.createdResources);
    
    try {
      // Add timeout wrapper
      await this.withTimeout(testFn, timeout, name);
      
      const duration = Date.now() - startTime;
      const memoryDelta = process.memoryUsage().heapUsed - startMemory;
      
      this.testResults.passed++;
      this.recordPerformance(module, name, duration, memoryDelta);
      console.log(`✅ ${name} (${duration}ms)`);
      
    } catch (error) {
      this.testResults.failed++;
      console.error(`❌ ${name}: ${error.message}`);
      
      // Auto-cleanup on failure
      await this.cleanupTestResources(resourcesBeforeTest);
    }
  }

  async withTimeout(testFn, timeoutMs, testName) {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${testName} timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    
    return Promise.race([testFn(), timeoutPromise]);
  }

  recordPerformance(module, testName, duration, memoryDelta) {
    if (!this.performanceMetrics.has(module)) {
      this.performanceMetrics.set(module, []);
    }
    this.performanceMetrics.get(module).push({
      name: testName,
      duration,
      memoryDelta: memoryDelta / 1024 / 1024 // Convert to MB
    });
  }

  // Common assertion patterns
  assertValidProjectCreation(project, expectedBehavior = 'create project') {
    TestAssertionHelpers.assertValidObject(project, 'Project result');
    assert(project.success === true, `User should be able to ${expectedBehavior}`);
    TestAssertionHelpers.assertValidString(project.project_id, 'Project ID');
    
    if (project.success) {
      this.createdResources.add(project.project_id);
    }
    
    return project;
  }

  assertValidSystemResponse(response, operation = 'system operation') {
    TestAssertionHelpers.assertValidObject(response, 'System response');
    assert(response.success !== false, `${operation} should not fail`);
    return response;
  }

  // Resource cleanup utilities
  async cleanupTestResources(resourcesBeforeTest) {
    const newResources = [...this.createdResources].filter(
      resource => !resourcesBeforeTest.has(resource)
    );
    
    if (newResources.length > 0 && this.system?.projectManagement) {
      await this.cleanupProjects(newResources);
    }
  }

  async cleanupProjects(projectIds) {
    const cleanupPromises = projectIds.map(async (id) => {
      try {
        await this.system.projectManagement.deleteProject({ project_id: id });
        this.createdResources.delete(id);
      } catch (error) {
        console.warn(`Failed to cleanup project ${id}:`, error.message);
      }
    });
    
    await Promise.allSettled(cleanupPromises);
  }

  // Enhanced reporting
  reportResults() {
    const totalDuration = Date.now() - this.startTime;
    const successRate = (this.testResults.passed / this.testResults.total) * 100;
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 ${this.suiteName.toUpperCase()} RESULTS`);
    console.log('='.repeat(60));
    
    console.log(`\n📈 Test Statistics:`);
    console.log(`   Total: ${this.testResults.total}`);
    console.log(`   ✅ Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.failed}`);
    console.log(`   ⏭️  Skipped: ${this.testResults.skipped}`);
    console.log(`   📊 Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    
    this.reportPerformanceMetrics();
    
    if (this.testResults.failed === 0) {
      console.log(`\n🎉 ALL ${this.suiteName.toUpperCase()} TESTS PASSED! 🚀`);
    } else {
      console.log(`\n⚠️  ${this.testResults.failed} test(s) failed in ${this.suiteName}`);
    }
    
    console.log('\n' + '='.repeat(60));
  }

  reportPerformanceMetrics() {
    if (this.performanceMetrics.size === 0) return;
    
    console.log(`\n⚡ Performance Metrics:`);
    
    for (const [module, tests] of this.performanceMetrics) {
      const avgDuration = tests.reduce((sum, t) => sum + t.duration, 0) / tests.length;
      const maxDuration = Math.max(...tests.map(t => t.duration));
      const totalMemory = tests.reduce((sum, t) => sum + t.memoryDelta, 0);
      
      console.log(`   ${module}:`);
      console.log(`     Avg: ${avgDuration.toFixed(1)}ms`);
      console.log(`     Max: ${maxDuration}ms`);
      console.log(`     Memory: ${totalMemory.toFixed(2)}MB`);
      
      // Flag performance issues
      const slowTests = tests.filter(t => t.duration > 2000);
      if (slowTests.length > 0) {
        console.log(`     ⚠️  Slow: ${slowTests.map(t => t.name).join(', ')}`);
      }
    }
  }

  // Test data generators
  generateTestProject(suffix = '') {
    return {
      project_name: `test-project-${Date.now()}${suffix}`,
      goal: `Test goal for automated testing ${suffix}`.trim()
    };
  }

  generateComplexGoal() {
    const domains = ['web development', 'data science', 'mobile apps', 'machine learning'];
    const technologies = ['React', 'Python', 'Node.js', 'TensorFlow'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const tech = technologies[Math.floor(Math.random() * technologies.length)];
    
    return `Master ${domain} using ${tech} with comprehensive understanding of best practices, testing, and deployment`;
  }
}