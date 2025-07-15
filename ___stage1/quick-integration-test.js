/**
 * Quick integration test to verify tool handler access
 */

import { CoreInitialization } from './core-initialization.js';

async function quickTest() {
    console.log('🧪 Quick Integration Test\n');
    
    try {
        // Initialize
        console.log('1. Initializing system...');
        const coreInit = new CoreInitialization();
        const server = await coreInit.initialize();
        console.log('✅ System initialized\n');
        
        // Check modules
        console.log('2. Checking modules...');
        const modules = ['dataPersistence', 'projectManagement', 'htaCore', 'taskStrategyCore', 'coreIntelligence', 'memorySync', 'mcpCore'];
        for (const mod of modules) {
            console.log(`   ${server[mod] ? '✅' : '❌'} ${mod}`);
        }
        console.log();
        
        // Check MCP tools
        console.log('3. Checking MCP tools...');
        const availableTools = server.mcpCore.getAvailableTools();
        console.log(`   ✅ ${availableTools.length} tools available`);
        console.log();
        
        // Check tool router
        console.log('4. Checking tool router...');
        console.log(`   ${server.toolRouter ? '✅' : '❌'} toolRouter exists`);
        console.log(`   ${typeof server.toolRouter.handleToolCall === 'function' ? '✅' : '❌'} handleToolCall method exists`);
        console.log();
        
        // Test a simple tool call
        console.log('5. Testing tool call...');
        const result = await server.toolRouter.handleToolCall('list_projects_forest', {});
        console.log(`   ${result ? '✅' : '❌'} Tool call returned result`);
        console.log(`   Result has content: ${result.content ? 'yes' : 'no'}`);
        console.log(`   Result has projects: ${result.projects ? 'yes' : 'no'}`);
        console.log();
        
        // Cleanup
        await coreInit.shutdown();
        console.log('✅ Test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

quickTest();
