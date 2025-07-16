/**
 * Focused test for NextPipelinePresenter to identify specific failures
 */

import { strict as assert } from 'assert';
import fs from 'fs/promises';

// Import required modules
import { DataPersistence } from './___stage1/modules/data-persistence.js';
import { ProjectManagement } from './___stage1/modules/project-management.js';
import { NextPipelinePresenter } from './___stage1/modules/next-pipeline-presenter.js';
import { EnhancedHTACore } from './___stage1/modules/enhanced-hta-core.js';
import { TaskStrategyCore } from './___stage1/modules/task-strategy-core.js';

const TEST_DIR = './.test-pipeline-focused';

async function testNextPipelinePresenter() {
  console.log('🔍 Testing NextPipelinePresenter specifically...\n');
  
  // Setup
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}
  await fs.mkdir(TEST_DIR, { recursive: true });
  
  const dataPersistence = new DataPersistence(TEST_DIR);
  const projectManagement = new ProjectManagement(dataPersistence);
  
  // Create a test project
  console.log('Creating test project...');
  const created = await projectManagement.createProject({
    project_name: 'pipeline-test',
    goal: 'Test pipeline generation'
  });
  
  console.log('Project creation result:', created);
  
  if (!created.success) {
    throw new Error('Failed to create test project');
  }
  
  const projectId = created.projectId || created.project_id;
  console.log('Project ID:', projectId);
  
  // Initialize HTA data
  console.log('Setting up HTA data...');
  await dataPersistence.saveProjectData(projectId, 'hta-tree.json', {
    branches: [
      { 
        id: 'branch1', 
        name: 'Basics', 
        tasks: [
          {
            id: 't1', 
            title: 'Task 1',
            description: 'First basic task',
            duration: '30 minutes',
            difficulty: 2,
            action: 'Complete basic setup',
            validation: 'Setup is working'
          }
        ] 
      },
      { 
        id: 'branch2', 
        name: 'Advanced', 
        tasks: [
          {
            id: 't2', 
            title: 'Task 2',
            description: 'Advanced task',
            duration: '45 minutes',
            difficulty: 4,
            action: 'Build advanced feature',
            validation: 'Feature works correctly'
          }
        ] 
      }
    ],
    frontierNodes: [
      {
        id: 't1', 
        title: 'Task 1',
        description: 'First basic task',
        duration: '30 minutes',
        difficulty: 2,
        action: 'Complete basic setup',
        validation: 'Setup is working',
        branch: 'Basics'
      },
      {
        id: 't2', 
        title: 'Task 2',
        description: 'Advanced task',
        duration: '45 minutes',
        difficulty: 4,
        action: 'Build advanced feature',
        validation: 'Feature works correctly',
        branch: 'Advanced'
      }
    ]
  });
  
  // Save to path data as well (the module expects it there)
  await dataPersistence.savePathData(projectId, 'general', 'hta.json', {
    branches: [
      { 
        id: 'branch1', 
        name: 'Basics', 
        tasks: [
          {
            id: 't1', 
            title: 'Task 1',
            description: 'First basic task',
            duration: '30 minutes',
            difficulty: 2,
            action: 'Complete basic setup',
            validation: 'Setup is working'
          }
        ] 
      },
      { 
        id: 'branch2', 
        name: 'Advanced', 
        tasks: [
          {
            id: 't2', 
            title: 'Task 2',
            description: 'Advanced task',
            duration: '45 minutes',
            difficulty: 4,
            action: 'Build advanced feature',
            validation: 'Feature works correctly'
          }
        ] 
      }
    ],
    frontierNodes: [
      {
        id: 't1', 
        title: 'Task 1',
        description: 'First basic task',
        duration: '30 minutes',
        difficulty: 2,
        action: 'Complete basic setup',
        validation: 'Setup is working',
        branch: 'Basics'
      },
      {
        id: 't2', 
        title: 'Task 2',
        description: 'Advanced task',
        duration: '45 minutes',
        difficulty: 4,
        action: 'Build advanced feature',
        validation: 'Feature works correctly',
        branch: 'Advanced'
      }
    ]
  });
  
  // Initialize NextPipelinePresenter
  console.log('Initializing NextPipelinePresenter...');
  const taskStrategyCore = new TaskStrategyCore(dataPersistence, projectManagement, null);
  const pipelinePresenter = new NextPipelinePresenter(
    dataPersistence,
    null, // vectorStore
    taskStrategyCore,
    null  // htaCore
  );
  
  // Test 1: Generate pipeline with exact test suite assertions
  console.log('\n🧪 Test 1: Generate hybrid pipeline presentation');
  try {
    const params = {
      projectId: projectId,
      energyLevel: 4,
      timeAvailable: 60
    };
    
    console.log('Calling generateNextPipeline with params:', params);
    // Test the alternative calling pattern that the test suite uses
    const pipeline = await pipelinePresenter.generateNextPipeline(params);
    
    // Exact assertions from test suite
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
    
    console.log('✅ Test 1 passed: All test suite assertions pass');
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
  
  // Test 2: Pipeline task variety and balance
  console.log('\n🧪 Test 2: Pipeline task variety and balance');
  try {
    const params = {
      projectId: projectId,
      energyLevel: 3,
      timeAvailable: 30
    };
    const pipeline = await pipelinePresenter.generateNextPipeline(projectId, params);
    
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
    
    console.log('✅ Test 2 passed: Pipeline variety and balance works');
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
  
  // Cleanup
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}
  
  console.log('\n🎉 NextPipelinePresenter focused test completed successfully!');
}

// Run the test
testNextPipelinePresenter().catch(error => {
  console.error('💥 Focused test failed:', error);
  process.exit(1);
});