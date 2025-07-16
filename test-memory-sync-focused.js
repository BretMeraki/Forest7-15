/**
 * Focused test for MemorySync to identify specific failures
 */

import { strict as assert } from 'assert';
import fs from 'fs/promises';

// Import required modules
import { DataPersistence } from './___stage1/modules/data-persistence.js';
import { MemorySync } from './___stage1/modules/memory-sync.js';

const TEST_DIR = './.test-memory-sync-focused';
const TEST_PROJECT = 'test-comprehensive-suite';

async function testMemorySync() {
  console.log('🔍 Testing MemorySync specifically...\n');
  
  // Setup
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}
  await fs.mkdir(TEST_DIR, { recursive: true });
  
  const dataPersistence = new DataPersistence(TEST_DIR);
  const memorySync = new MemorySync(dataPersistence);
  
  console.log('✅ Test environment ready\n');
  
  // Test 1: Memory sync queue and processing
  console.log('🧪 Test 1: Memory sync queue and processing');
  try {
    // Queue a sync operation
    const projectId = TEST_PROJECT;
    const path = 'test-path';
    const priority = 'high';
    
    console.log('Calling queueSync...');
    const queueResult = await memorySync.queueSync(projectId, path, priority);
    console.log('Queue result:', queueResult);
    
    assert(queueResult === true || queueResult?.success === true, 'Queue operation should succeed');
    
    // Get queue status
    console.log('Getting queue status...');
    const status = await memorySync.getQueueStatus();
    console.log('Queue status:', JSON.stringify(status, null, 2));
    
    assert(status !== null && status !== undefined, 'Status should exist');
    assert(typeof status === 'object', 'Status should be an object');
    assert(typeof status.pendingSyncs === 'number', 'Should have pendingSyncs count');
    assert(status.pendingSyncs >= 0, 'Pending syncs should be non-negative');
    
    if (status.queue) {
      assert(Array.isArray(status.queue), 'Queue should be an array');
      const ourSync = status.queue.find(item =>
        item.projectId === projectId && item.path === path
      );
      if (ourSync) {
        assert(ourSync.priority === priority, 'Priority should match');
        assert(typeof ourSync.timestamp === 'number', 'Should have timestamp');
      }
    }
    
    assert(status.isProcessing !== undefined, 'Should have processing status');
    assert(typeof status.isProcessing === 'boolean', 'Processing status should be boolean');
    
    console.log('✅ Test 1 passed: Memory sync queue and processing works');
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
  
  // Test 2: Context preservation across sessions
  console.log('\n🧪 Test 2: Context preservation across sessions');
  try {
    const context = {
      learned: 'Docker basics',
      timestamp: Date.now(),
      progress: 0.45,
      skills: ['containers', 'images', 'volumes'],
      metadata: {
        lastSession: Date.now() - 3600000,
        totalTime: 7200000,
        completedTasks: 12
      }
    };
    
    // Save context
    console.log('Saving context...');
    const saveResult = await memorySync.saveContext(TEST_PROJECT, context);
    console.log('Save result:', saveResult);
    
    assert(saveResult === true || saveResult?.success === true, 'Context save should succeed');
    
    // Load context
    console.log('Loading context...');
    const loaded = await memorySync.loadContext(TEST_PROJECT);
    console.log('Loaded context:', JSON.stringify(loaded, null, 2));
    
    assert(loaded !== null && loaded !== undefined, 'Loaded context should exist');
    assert(typeof loaded === 'object', 'Loaded context should be an object');
    assert(loaded.learned === context.learned, 'Learned content should match');
    assert(loaded.timestamp === context.timestamp, 'Timestamp should match');
    assert(loaded.progress === context.progress, 'Progress should match');
    assert(Array.isArray(loaded.skills), 'Skills should be an array');
    assert(loaded.skills.length === context.skills.length, 'Skills array length should match');
    assert(loaded.skills.every((skill, idx) => skill === context.skills[idx]), 'All skills should match');
    assert(loaded.metadata !== undefined, 'Metadata should exist');
    assert(loaded.metadata.lastSession === context.metadata.lastSession, 'Last session should match');
    assert(loaded.metadata.totalTime === context.metadata.totalTime, 'Total time should match');
    assert(loaded.metadata.completedTasks === context.metadata.completedTasks, 'Completed tasks should match');
    
    console.log('✅ Test 2 passed: Context preservation across sessions works');
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
  
  // Cleanup
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (e) {}
  
  console.log('\n🎉 MemorySync focused test completed successfully!');
}

// Run the test
testMemorySync().catch(error => {
  console.error('💥 Focused test failed:', error);
  process.exit(1);
});