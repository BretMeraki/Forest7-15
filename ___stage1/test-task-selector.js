// Test script to verify TaskSelector functionality
import { TaskSelector } from './modules/task-logic/task-selector.js';
import { DataPersistence } from './modules/data-persistence.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTaskSelector() {
    console.log('=== Testing TaskSelector Implementation ===\n');
    
    try {
        // Test 1: Check if TaskSelector exists
        console.log('1. Checking TaskSelector class exists:', typeof TaskSelector);
        
        // Test 2: Check if selectOptimalTask is a static method
        console.log('2. Is selectOptimalTask a static method?', typeof TaskSelector.selectOptimalTask === 'function');
        
        // Test 3: Create instance and check for instance method
        const dataDir = path.join(__dirname, '.forest-data');
        const dataPersistence = new DataPersistence(dataDir);
        const taskSelector = new TaskSelector(dataPersistence);
        
        console.log('3. Is selectOptimalTask an instance method?', typeof taskSelector.selectOptimalTask === 'function');
        
        // Test 4: Check method signature
        if (taskSelector.selectOptimalTask) {
            console.log('4. Method signature check:');
            console.log('   - Method name:', taskSelector.selectOptimalTask.name);
            console.log('   - Parameter count:', taskSelector.selectOptimalTask.length);
        }
        
        // Test 5: Try calling the method with mock data
        console.log('\n5. Testing method call with mock data...');
        const mockHtaData = {
            frontierNodes: [
                {
                    id: 'test-task-1',
                    title: 'Test Task 1',
                    difficulty: 3,
                    estimated_time: 30,
                    status: 'pending'
                }
            ]
        };
        
        const result = await taskSelector.selectOptimalTask('test-project', mockHtaData, {
            energyLevel: 3,
            timeAvailable: 30
        });
        
        console.log('   - Method executed successfully:', result !== undefined);
        console.log('   - Selected task:', result?.title || 'None');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
    }
}

testTaskSelector().catch(console.error);
