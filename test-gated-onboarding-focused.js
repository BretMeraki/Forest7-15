/**
 * Focused GatedOnboarding test to identify specific failures
 */

import { strict as assert } from 'assert';
import fs from 'fs/promises';

// Import required modules
import { GatedOnboardingFlow } from './___stage1/modules/gated-onboarding-flow.js';
import { DataPersistence } from './___stage1/modules/data-persistence.js';
import { ProjectManagement } from './___stage1/modules/project-management.js';
import { EnhancedHTACore } from './___stage1/modules/enhanced-hta-core.js';
import { CoreIntelligence } from './___stage1/modules/core-intelligence.js';

const TEST_DIR = './.test-gated-onboarding-focused';

class GatedOnboardingTestSuite {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async setup() {
    console.log('🔧 Setting up GatedOnboarding test environment...\n');
    
    // Clean test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (e) {}
    await fs.mkdir(TEST_DIR, { recursive: true });
    
    // Initialize components
    this.dataPersistence = new DataPersistence(TEST_DIR);
    this.projectManagement = new ProjectManagement(this.dataPersistence);
    this.htaCore = new EnhancedHTACore(this.dataPersistence, this.projectManagement);
    this.coreIntelligence = new CoreIntelligence();
    
    // Initialize GatedOnboardingFlow
    this.gatedOnboarding = new GatedOnboardingFlow(
      this.dataPersistence,
      this.projectManagement,
      this.htaCore,
      this.coreIntelligence,
      null // vectorStore
    );
    
    console.log('✅ GatedOnboarding test environment ready\n');
  }

  async teardown() {
    console.log('\n🧹 Cleaning up test environment...');
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (e) {}
  }

  // Test runner
  async runTest(name, testFn) {
    this.testResults.total++;
    try {
      await testFn();
      this.testResults.passed++;
      console.log(`✅ ${name}`);
      this.testResults.details.push({ name, status: 'passed' });
    } catch (error) {
      this.testResults.failed++;
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error.message}`);
      this.testResults.details.push({ name, status: 'failed', error: error.message });
    }
  }

  async testGatedOnboardingFlow() {
    console.log('\n🎯 Testing GatedOnboarding Flow...\n');
    
    // Test 1: Constructor and initialization
    await this.runTest('Constructor and dependency injection', async () => {
      assert(this.gatedOnboarding !== null, 'GatedOnboardingFlow should be instantiated');
      assert(this.gatedOnboarding.dataPersistence !== null, 'Should have dataPersistence');
      assert(this.gatedOnboarding.projectManagement !== null, 'Should have projectManagement');
      assert(this.gatedOnboarding.htaCore !== null, 'Should have htaCore');
      assert(this.gatedOnboarding.coreIntelligence !== null, 'Should have coreIntelligence');
      
      // Check for proper initialization
      assert(this.gatedOnboarding.onboardingStates instanceof Map, 'Should have onboardingStates Map');
      assert(this.gatedOnboarding.activeOnboardingSessions instanceof Map, 'Should have activeOnboardingSessions Map');
    });

    // Test 2: Stage 1 - Goal capture
    await this.runTest('Stage 1: Goal capture with proper response format', async () => {
      const goal = 'Learn advanced JavaScript programming';
      const result = await this.gatedOnboarding.startNewProject(goal);
      
      // Check response structure
      assert(typeof result === 'object', 'Result should be an object');
      assert(typeof result.success === 'boolean', 'Should have success property');
      assert(typeof result.stage === 'string', 'Should have stage property');
      assert(typeof result.gate_status === 'string', 'Should have gate_status property');
      
      if (result.success) {
        assert(typeof result.projectId === 'string', 'Should have projectId when successful');
        assert(typeof result.message === 'string', 'Should have message when successful');
        assert(typeof result.next_stage === 'string', 'Should have next_stage when successful');
        assert(typeof result.validated_goal === 'string', 'Should have validated_goal when successful');
      }
    });

    // Test 3: Stage 2 - Context gathering
    await this.runTest('Stage 2: Context gathering with proper response format', async () => {
      // First create a project
      const goalResult = await this.gatedOnboarding.startNewProject('Learn advanced JavaScript programming');
      if (!goalResult.success) {
        throw new Error('Failed to create project for context test');
      }
      
      const contextData = {
        background: 'I have basic programming knowledge',
        timeline: '3 months',
        motivation: 'Career advancement'
      };
      
      const result = await this.gatedOnboarding.gatherContext(goalResult.projectId, contextData);
      
      // Check response structure
      assert(typeof result === 'object', 'Result should be an object');
      assert(typeof result.success === 'boolean', 'Should have success property');
      assert(typeof result.stage === 'string', 'Should have stage property');
      assert(typeof result.gate_status === 'string', 'Should have gate_status property');
      
      if (result.success) {
        assert(typeof result.message === 'string', 'Should have message when successful');
        assert(typeof result.next_stage === 'string', 'Should have next_stage when successful');
        assert(typeof result.context_summary === 'object', 'Should have context_summary when successful');
      }
    });

    // Test 4: Stage 3 - Dynamic questionnaire
    await this.runTest('Stage 3: Dynamic questionnaire with proper response format', async () => {
      // Create project and gather context first
      const goalResult = await this.gatedOnboarding.startNewProject('Learn advanced JavaScript programming');
      if (!goalResult.success) {
        throw new Error('Failed to create project for questionnaire test');
      }
      
      const contextResult = await this.gatedOnboarding.gatherContext(goalResult.projectId, {
        background: 'I have basic programming knowledge',
        timeline: '3 months'
      });
      
      const result = await this.gatedOnboarding.startDynamicQuestionnaire(goalResult.projectId, { autoComplete: true });
      
      // Check response structure
      assert(typeof result === 'object', 'Result should be an object');
      assert(typeof result.success === 'boolean', 'Should have success property');
      assert(typeof result.stage === 'string', 'Should have stage property');
      assert(typeof result.gate_status === 'string', 'Should have gate_status property');
      
      if (result.success) {
        assert(typeof result.message === 'string', 'Should have message when successful');
        assert(Array.isArray(result.questions), 'Should have questions array when successful');
        assert(result.questions.length > 0, 'Should have at least one question');
        
        // Check question structure
        const question = result.questions[0];
        assert(typeof question.id === 'string', 'Question should have id');
        assert(typeof question.question === 'string' || typeof question.text === 'string', 'Question should have question text');
        assert(typeof question.type === 'string', 'Question should have type');
      }
    });

    // Test 5: Stage 4 - Complexity analysis
    await this.runTest('Stage 4: Complexity analysis with proper response format', async () => {
      const result = await this.gatedOnboarding.performComplexityAnalysis('test-project-id');
      
      // Check response structure
      assert(typeof result === 'object', 'Result should be an object');
      assert(typeof result.success === 'boolean', 'Should have success property');
      assert(typeof result.stage === 'string', 'Should have stage property');
      assert(typeof result.gate_status === 'string', 'Should have gate_status property');
      
      if (result.success) {
        assert(typeof result.message === 'string', 'Should have message when successful');
        assert(typeof result.next_stage === 'string', 'Should have next_stage when successful');
        assert(typeof result.complexity === 'object', 'Should have complexity object when successful');
        
        // Check complexity structure
        assert(typeof result.complexity.score === 'number' || typeof result.complexity.level === 'string', 
               'Complexity should have score or level');
      }
    });

    // Test 6: Stage 5 - HTA tree generation
    await this.runTest('Stage 5: HTA tree generation with proper response format', async () => {
      const result = await this.gatedOnboarding.generateHTATree('test-project-id');
      
      // Check response structure
      assert(typeof result === 'object', 'Result should be an object');
      assert(typeof result.success === 'boolean', 'Should have success property');
      assert(typeof result.stage === 'string', 'Should have stage property');
      assert(typeof result.gate_status === 'string', 'Should have gate_status property');
      
      if (result.success) {
        assert(typeof result.message === 'string', 'Should have message when successful');
        assert(typeof result.tree === 'object', 'Should have tree object when successful');
        
        // Check tree structure - the goal is in htaTree, not tree
        const tree = result.htaTree || result.tree;
        console.log('Tree type:', typeof tree);
        console.log('Tree keys:', Object.keys(tree || {}));
        console.log('Tree goal:', tree?.goal);
        console.log('Tree goal type:', typeof tree?.goal);
        
        assert(typeof tree === 'object', 'Tree should be an object');
        assert(typeof tree.goal === 'string', 'Tree should have goal');
        assert(typeof tree.depth === 'number', 'Tree should have depth');
        assert(Array.isArray(tree.branches), 'Tree should have branches array');
      }
    });
  }

  async runAllTests() {
    await this.setup();
    
    try {
      await this.testGatedOnboardingFlow();
    } catch (error) {
      console.error('Test suite failed:', error);
    }
    
    await this.teardown();
    
    // Print results
    console.log('\n📊 GATED ONBOARDING TEST RESULTS:');
    console.log(`  Total Tests Run: ${this.testResults.total}`);
    console.log(`  ✅ Tests Passed: ${this.testResults.passed}`);
    console.log(`  ❌ Tests Failed: ${this.testResults.failed}`);
    console.log(`  🎯 Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%`);
    
    console.log('\n📋 Test Details:');
    this.testResults.details.forEach(detail => {
      if (detail.status === 'failed') {
        console.log(`  ❌ ${detail.name}: ${detail.error}`);
      } else {
        console.log(`  ✅ ${detail.name}`);
      }
    });
    
    if (this.testResults.passed === this.testResults.total) {
      console.log('\n🎉 ALL GATED ONBOARDING TESTS PASSED! 🎉');
    } else {
      console.log('\n⚠️ Some tests failed - needs attention');
    }
  }
}

// Run the test suite
const suite = new GatedOnboardingTestSuite();
suite.runAllTests().catch(console.error);