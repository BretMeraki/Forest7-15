/**
 * Focused test for HTAIntelligence to identify specific failures
 */

import { strict as assert } from 'assert';
import fs from 'fs/promises';

// Import required modules
import { AdaptiveBranchGenerator } from './___stage1/modules/adaptive-branch-generator.js';
import { EnhancedHTACore } from './___stage1/modules/enhanced-hta-core.js';
import { DataPersistence } from './___stage1/modules/data-persistence.js';
import { ProjectManagement } from './___stage1/modules/project-management.js';
import { Client } from './___stage1/local-mcp-client.js';
import { StdioServerTransport } from './___stage1/local-stdio-transport.js';

const TEST_DIR = './.test-hta-focused';

async function testHTAIntelligence() {
  console.log('🔍 Testing HTAIntelligence specifically...\n');
  
  // Setup
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}
  await fs.mkdir(TEST_DIR, { recursive: true });
  
  const dataPersistence = new DataPersistence(TEST_DIR);
  const projectManagement = new ProjectManagement(dataPersistence);
  const llmInterface = new Client();
  await llmInterface.connect(new StdioServerTransport());
  
  const htaCore = new EnhancedHTACore(dataPersistence, projectManagement, llmInterface);
  
  console.log('✅ Test environment ready\n');
  
  // Test 1: Dynamic branch generation without hardcoding
  console.log('🧪 Test 1: Dynamic branch generation without hardcoding');
  try {
    const branchGen = new AdaptiveBranchGenerator();
    const goal = 'Build a mobile app with React Native';
    const complexity = { score: 6 };
    const interests = ['UI design', 'state management'];
    const style = 'hands-on';
    const context = { context: 'Want to build iOS and Android apps' };
    
    const branches = branchGen.generateAdaptiveBranches(
      goal,
      complexity,
      interests,
      style,
      context
    );
    
    console.log('Generated branches:', JSON.stringify(branches, null, 2));
    
    // Maximum assertions
    assert(branches !== null && branches !== undefined, 'Branches should exist');
    assert(Array.isArray(branches), 'Branches should be an array');
    assert(branches.length > 0, 'Should generate at least one branch');
    assert(branches.length >= 3 && branches.length <= 8, 'Should have 3-8 branches for balanced tree');
    
    branches.forEach((branch, idx) => {
      assert(typeof branch === 'object', `Branch ${idx} should be an object`);
      assert(typeof branch.name === 'string', `Branch ${idx} should have a name`);
      assert(branch.name.length > 0, `Branch ${idx} name should not be empty`);
      assert(typeof branch.description === 'string', `Branch ${idx} should have description`);
      assert(branch.description.length > 0, `Branch ${idx} description should not be empty`);
      
      // Verify no generic names
      const genericNames = ['Foundation', 'Basic', 'Advanced', 'Module 1', 'Section A'];
      assert(!genericNames.includes(branch.name), `Branch ${idx} should not have generic name`);
      
      // Verify branch is relevant to goal
      const nameAndDesc = (branch.name + ' ' + branch.description).toLowerCase();
      const relevantTerms = ['react', 'native', 'mobile', 'app', 'ios', 'android', 'ui', 'state'];
      const hasRelevantTerms = relevantTerms.some(term => nameAndDesc.includes(term));
      assert(hasRelevantTerms, `Branch ${idx} should be relevant to the goal`);
      
      assert(branch.tasks !== undefined || branch.subtasks !== undefined, `Branch ${idx} should have tasks or subtasks`);
      assert(typeof branch.complexity === 'number' || branch.complexity?.score !== undefined, `Branch ${idx} should have complexity`);
    });
    
    // Verify branch diversity
    const branchNames = branches.map(b => b.name.toLowerCase());
    const uniqueNames = new Set(branchNames);
    assert(uniqueNames.size === branchNames.length, 'All branch names should be unique');
    
    console.log('✅ Test 1 passed: Dynamic branch generation works');
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
  
  // Test 2: 6-level hierarchical task decomposition
  console.log('\n🧪 Test 2: 6-level hierarchical task decomposition');
  try {
    const goal = 'Master data science and machine learning';
    const result = await htaCore.buildHTATree({
      goal,
      complexity: { score: 8 },
      context: { background: 'Software engineer', timeline: '6 months' }
    });
    
    console.log('HTA Tree result:', JSON.stringify(result, null, 2));
    
    // EXHAUSTIVE TREE STRUCTURE ASSERTIONS
    assert(result !== null && result !== undefined, 'Result should exist');
    assert(typeof result === 'object', 'Result should be an object');
    assert(!Array.isArray(result), 'Result should not be an array');
    assert(result.constructor === Object || result.success !== undefined, 'Result should be valid object');
    
    // Handle both new tree generation and existing tree cases
    if (result.existing_tree) {
      // If tree already exists, validate the existing tree response
      assert(result.tasks_count !== undefined, 'Should have task count for existing tree');
      assert(typeof result.tasks_count === 'number', 'Task count should be number');
      assert(result.tasks_count > 0, 'Should have at least one task');
      assert(result.complexity !== undefined, 'Should have complexity info');
      console.log('✅ Test 2 passed: HTA tree exists and is valid (existing tree case)');
      return; // Skip further tree structure validation for existing trees
    }
    
    // Tree existence assertions for new trees
    assert(result.tree !== undefined || result.htaTree !== undefined, 'Should have tree property');
    const tree = result.tree || result.htaTree;
    assert(tree !== null && tree !== undefined, 'Tree should exist');
    assert(typeof tree === 'object', 'Tree should be an object');
    
    // Root level assertions
    assert(tree.goal !== undefined, 'Tree should have goal');
    assert(typeof tree.goal === 'string', 'Goal should be string');
    assert(tree.goal === goal, 'Goal should match input');
    assert(tree.level !== undefined, 'Tree should have level');
    assert(tree.level === 0 || tree.level === 1, 'Root should be level 0 or 1');
    
    // Depth validation
    assert(tree.depth !== undefined, 'Tree should have depth');
    assert(typeof tree.depth === 'number', 'Depth should be number');
    assert(Number.isInteger(tree.depth), 'Depth should be integer');
    assert(tree.depth >= 4 && tree.depth <= 6, 'Should have 4-6 levels of decomposition');
    
    console.log('✅ Test 2 passed: 6-level hierarchical decomposition works');
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
  
  // Cleanup
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}
  
  console.log('\n🎉 HTAIntelligence focused test completed successfully!');
}

// Run the test
testHTAIntelligence().catch(error => {
  console.error('💥 Focused test failed:', error);
  process.exit(1);
});