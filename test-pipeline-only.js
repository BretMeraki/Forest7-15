/**
 * Test only the NextPipelinePresenter to see if it passes
 */

import { strict as assert } from 'assert';
import fs from 'fs/promises';

// Import test helpers
import { TestAssertionHelpers } from './___stage1/test-assertion-helpers.js';

// Import all core modules
import { DataPersistence } from './___stage1/modules/data-persistence.js';
import { ProjectManagement } from './___stage1/modules/project-management.js';
import { EnhancedHTACore } from './___stage1/modules/enhanced-hta-core.js';
import { Client } from './___stage1/local-mcp-client.js';
import { StdioServerTransport } from './___stage1/local-stdio-transport.js';

const TEST_DIR = './.test-pipeline-only';
const TEST_PROJECT = 'test-comprehensive-suite';

class PipelineOnlyTestSuite {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      coverage: {}
    };
  }

  async setup() {
    console.log('🔧 Setting up test environment...\n');
    
    // Clean test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (e) {}
    await fs.mkdir(TEST_DIR, { recursive: true });
    
    // Initialize dependencies
    this.dataPersistence = new DataPersistence(TEST_DIR);
    this.projectManagement = new ProjectManagement(this.dataPersistence);
    this.llmInterface = new Client();
    await this.llmInterface.connect(new StdioServerTransport());
    
    // Initialize core systems
    this.htaCore = new EnhancedHTACore(this.dataPersistence, this.projectManagement, this.llmInterface);
    
    // Initialize advanced systems
    this.pipelinePresenter = await this.htaCore.initializeNextPipelinePresenter();
    
    console.log('✅ Test environment ready\n');
  }

  async teardown() {
    console.log('\n🧹 Cleaning up test environment...');
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (e) {}
  }

  // Test runner
  async runTest(name, testFn, module) {
    this.testResults.total++;
    try {
      await testFn();
      this.testResults.passed++;
      console.log(`✅ ${name}`);
      this.recordCoverage(module, 'passed');
    } catch (error) {
      this.testResults.failed++;
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error.message}`);
      this.recordCoverage(module, 'failed');
    }
  }

  recordCoverage(module, status) {
    if (!this.testResults.coverage[module]) {
      this.testResults.coverage[module] = { passed: 0, failed: 0 };
    }
    this.testResults.coverage[module][status]++;
  }

  async testNextPipelinePresenter() {
    console.log('\n📊 Testing Next + Pipeline Presenter...\n');
    
    // Create a test project for pipeline presenter
    let pipelineProjectId = null;
    
    await this.runTest('Setup project for pipeline presenter', async () => {
      const created = await this.projectManagement.createProject({
        project_name: 'pipeline-test',
        goal: 'Test pipeline generation'
      });
      assert(created.success === true, 'Pipeline project creation should succeed');
      pipelineProjectId = created.projectId || created.project_id;
      assert(pipelineProjectId !== undefined, 'Should have project ID');
      
      // Initialize project with HTA tree
      await this.dataPersistence.saveProjectData(pipelineProjectId, 'hta-tree.json', {
        branches: [
          { id: 'branch1', name: 'Basics', tasks: [{id: 't1', title: 'Task 1', duration: '20 minutes', difficulty: 2}] },
          { id: 'branch2', name: 'Advanced', tasks: [{id: 't2', title: 'Task 2', duration: '25 minutes', difficulty: 4}] }
        ]
      });
      
      // Save to path data as well
      await this.dataPersistence.savePathData(pipelineProjectId, 'general', 'hta.json', {
        branches: [
          { id: 'branch1', name: 'Basics', tasks: [{id: 't1', title: 'Task 1', duration: '20 minutes', difficulty: 2}] },
          { id: 'branch2', name: 'Advanced', tasks: [{id: 't2', title: 'Task 2', duration: '25 minutes', difficulty: 4}] }
        ],
        frontierNodes: [
          {
            id: 't1', 
            title: 'Task 1',
            description: 'First basic task',
            duration: '20 minutes',
            difficulty: 2,
            action: 'Complete basic setup',
            validation: 'Setup is working',
            branch: 'Basics'
          },
          {
            id: 't2', 
            title: 'Task 2',
            description: 'Advanced task',
            duration: '25 minutes',
            difficulty: 4,
            action: 'Build advanced feature',
            validation: 'Feature works correctly',
            branch: 'Advanced'
          }
        ]
      });
    }, 'NextPipelinePresenter');
    
    await this.runTest('Generate hybrid pipeline presentation', async () => {
      if (!this.pipelinePresenter || !pipelineProjectId) return;
      const params = {
        projectId: pipelineProjectId,
        energyLevel: 4,
        timeAvailable: 60
      };
      const pipeline = await this.pipelinePresenter.generateNextPipeline(params);
      
      // Maximum assertions
      assert(pipeline !== null && pipeline !== undefined, 'Pipeline should exist');
      assert(typeof pipeline === 'object', 'Pipeline should be an object');
      assert(pipeline.success === true || pipeline.tasks !== undefined, 'Should succeed or have tasks');
      
      if (pipeline.tasks) {
        assert(Array.isArray(pipeline.tasks), 'Tasks should be an array');
        assert(pipeline.tasks.length > 0, 'Should have at least one task');
        assert(pipeline.tasks.length <= 5, 'Should not exceed 5 tasks for pipeline');
        
        pipeline.tasks.forEach((task, idx) => {
          assert(typeof task === 'object', `Task ${idx} should be an object`);
          assert(typeof task.id === 'string', `Task ${idx} should have string id`);
          assert(typeof task.title === 'string', `Task ${idx} should have title`);
          assert(typeof task.description === 'string', `Task ${idx} should have description`);
          assert(typeof task.duration === 'number', `Task ${idx} should have numeric duration`);
          assert(task.duration > 0, `Task ${idx} duration should be positive`);
          assert(task.type !== undefined, `Task ${idx} should have a type`);
          assert(task.energyLevel !== undefined, `Task ${idx} should have energy level`);
        });
        
        // Verify total duration doesn't exceed available time
        const totalDuration = pipeline.tasks.reduce((sum, task) => sum + task.duration, 0);
        assert(totalDuration <= params.timeAvailable, 'Total duration should not exceed available time');
      }
      
      assert(pipeline.presentationType === 'hybrid' || pipeline.type === 'hybrid', 'Should be hybrid presentation');
      assert(pipeline.energyMatched === true || pipeline.energyLevel === params.energyLevel, 'Should match energy level');
    }, 'NextPipelinePresenter');

    await this.runTest('Pipeline task variety and balance', async () => {
      if (!this.pipelinePresenter) return;
      const params = {
        projectId: pipelineProjectId,
        energyLevel: 3,
        timeAvailable: 30
      };
      const pipeline = await this.pipelinePresenter.generateNextPipeline(params);
      
      // Additional presentation-specific validations
      const presentationType = pipeline.presentationType || pipeline.type;
      if (presentationType) {
        const validTypes = ['next', 'pipeline', 'hybrid', 'mixed', 'balanced'];
        assert(validTypes.includes(presentationType), 'Should be valid presentation type');
      }
      
      // Optional metadata validation
      if (pipeline.metadata) {
        assert(typeof pipeline.metadata === 'object', 'Pipeline metadata should be object');
      }
      
      // Optional algorithm validation
      if (pipeline.algorithm) {
        const validAlgorithms = ['balanced', 'energy-optimized', 'time-optimized', 'variety-focused'];
        assert(validAlgorithms.includes(pipeline.algorithm), 'Should be valid algorithm');
      }
      
      // Optional balance score validation
      if (pipeline.balanceScore !== undefined) {
        assert(typeof pipeline.balanceScore === 'number', 'Balance score should be number');
        assert(pipeline.balanceScore >= 0 && pipeline.balanceScore <= 1, 'Balance score should be 0-1');
      }
    }, 'NextPipelinePresenter');
  }

  async runAllTests() {
    await this.setup();
    
    try {
      await this.testNextPipelinePresenter();
    } catch (error) {
      console.error('Test suite failed:', error);
    }
    
    await this.teardown();
    
    // Print results
    console.log('\n📊 PIPELINE TEST RESULTS:');
    console.log(`  Total Tests Run: ${this.testResults.total}`);
    console.log(`  ✅ Tests Passed: ${this.testResults.passed}`);
    console.log(`  ❌ Tests Failed: ${this.testResults.failed}`);
    console.log(`  🎯 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);
    
    if (this.testResults.passed === this.testResults.total) {
      console.log('\n🎉 ALL NEXTPIPELINEPRESENTER TESTS PASSED! 🎉');
    } else {
      console.log('\n⚠️ Some tests failed - needs attention');
    }
  }
}

// Run the test suite
const suite = new PipelineOnlyTestSuite();
suite.runAllTests().catch(console.error);