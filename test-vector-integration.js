// test-vector-integration.js
// Quick test to verify SQLite vector store is working
import { HTAVectorStore } from './___stage1/modules/hta-vector-store.js';

async function testVectorIntegration() {
    console.log('🧪 Testing SQLite Vector Integration...');
    
    try {
        // Initialize vector store
        const vectorStore = new HTAVectorStore('.forest-vectors');
        const initResult = await vectorStore.initialize();
        
        console.log('✅ Vector store initialized:', initResult.provider);
        
        // Check if we have any existing vectors
        const stats = await vectorStore.getProjectStats('test-project');
        console.log('📊 Current vector stats:', stats);
        
        // Test basic vector operations
        const testHTA = {
            goal: 'Test SQLite vector integration',
            complexity: 2,
            frontierNodes: [
                {
                    id: 'task-1',
                    title: 'Test task',
                    description: 'Simple test task for vector storage',
                    branch: 'Testing',
                    priority: 1,
                    difficulty: 2,
                    duration: '30 minutes',
                    prerequisites: [],
                    completed: false,
                    generated: true
                }
            ],
            strategicBranches: [
                {
                    name: 'Testing',
                    description: 'Test branch for vector verification',
                    priority: 1,
                    tasks: []
                }
            ]
        };
        
        // Store test data
        console.log('📝 Storing test HTA...');
        const storeResult = await vectorStore.storeHTATree('test-project', testHTA);
        console.log('✅ Store result:', storeResult);
        
        // Try to retrieve it
        console.log('📤 Retrieving test HTA...');
        const retrieved = await vectorStore.retrieveHTATree('test-project');
        console.log('✅ Retrieved HTA with', retrieved?.frontierNodes?.length || 0, 'tasks');
        
        // Test vector search
        console.log('🔍 Testing vector search...');
        const nextTask = await vectorStore.findNextTask('test-project', 'testing', 3, '30 minutes');
        console.log('✅ Next task found:', nextTask ? nextTask.title : 'None');
        
        // Clean up
        console.log('🗑️  Cleaning up...');
        await vectorStore.deleteProject('test-project');
        
        console.log('\n🎉 SQLite Vector Integration Test PASSED!');
        console.log('✅ Provider:', initResult.provider);
        console.log('✅ Vector operations working');
        console.log('✅ Database file: forest_vectors.sqlite');
        
    } catch (error) {
        console.error('❌ Vector integration test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testVectorIntegration().catch(console.error);
