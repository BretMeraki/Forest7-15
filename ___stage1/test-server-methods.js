#!/usr/bin/env node

/**
 * Simple test for Stage1CoreServer methods
 */

import { Stage1CoreServer } from './core-server.js';

async function testServerMethods() {
    console.log('🧪 Testing Stage1CoreServer methods...\n');
    
    try {
        // Initialize server
        const server = new Stage1CoreServer({
            dataPersistence: { dataDir: './.forest-data' }
        });
        
        await server.initialize();
        console.log('✅ Server initialized\n');
        
        // Test 1: createProject
        console.log('📋 Test 1: createProject method');
        try {
            const projectResult = await server.createProject({
                goal: 'Test project for method verification',
                context: 'Testing server methods'
            });
            console.log('✅ createProject:', projectResult.success ? 'SUCCESS' : 'FAILED');
            console.log('   Project ID:', projectResult.project_id);
        } catch (error) {
            console.log('❌ createProject failed:', error.message);
        }
        
        // Test 2: buildHTATree
        console.log('\n📋 Test 2: buildHTATree method');
        try {
            const htaResult = await server.buildHTATree({});
            console.log('✅ buildHTATree:', htaResult.success ? 'SUCCESS' : 'FAILED');
        } catch (error) {
            console.log('❌ buildHTATree failed:', error.message);
        }
        
        // Test 3: getHTAStatus
        console.log('\n📋 Test 3: getHTAStatus method');
        try {
            const statusResult = await server.getHTAStatus();
            console.log('✅ getHTAStatus:', statusResult.content ? 'SUCCESS' : 'FAILED');
        } catch (error) {
            console.log('❌ getHTAStatus failed:', error.message);
        }
        
        // Test 4: getVectorizationStatus
        console.log('\n📋 Test 4: getVectorizationStatus method');
        try {
            const vectorResult = await server.getVectorizationStatus();
            console.log('✅ getVectorizationStatus:', vectorResult.success ? 'SUCCESS' : 'FAILED');
        } catch (error) {
            console.log('❌ getVectorizationStatus failed:', error.message);
        }
        
        // Test 5: getNextTask
        console.log('\n📋 Test 5: getNextTask method');
        try {
            const taskResult = await server.getNextTask({});
            console.log('✅ getNextTask:', taskResult.content ? 'SUCCESS' : 'FAILED');
        } catch (error) {
            console.log('❌ getNextTask failed:', error.message);
        }
        
        // Clean up
        await server.cleanup();
        console.log('\n✅ Cleanup completed');
        
    } catch (error) {
        console.error('\n💥 Test failed:', error.message);
        console.error(error.stack);
    }
}

testServerMethods().catch(console.error);
