#!/usr/bin/env node

import { Stage1CoreServer } from './core-server.js';

async function testOnboardingFix() {
    console.log('🧪 Testing Onboarding Fix...\n');
    
    try {
        // Initialize server
        const server = new Stage1CoreServer({
            dataPersistence: { dataDir: './.forest-data' },
            vectorProvider: {
                provider: 'ChromaDBProvider',
                config: { 
                    collection: 'forest_vectors',
                    url: 'http://localhost:8000'
                }
            }
        });
        
        await server.initialize();
        console.log('✅ Forest server initialized\n');
        
        // TEST: Gated Onboarding System
        console.log('📋 Testing Gated Onboarding Stage Progression');
        const onboarding = server.gatedOnboarding;
        
        // Test stage determination
        const stage = await onboarding.determineCorrectStage();
        console.log(`✅ Stage determination working: ${stage}`);
        
        // Test context gathering progression
        const contextResult = await onboarding.continueOnboarding('test-session', 'context_gathering', {
            context: 'I am a software engineer with 3 years experience looking to learn AI/ML'
        });
        
        if (contextResult && !contextResult.error && contextResult.stage_complete) {
            console.log('✅ Context gathering progression working');
            console.log('✅ TEST PASSED!');
        } else {
            console.log('❌ Context gathering progression failed');
            console.log('Result:', contextResult);
        }
        
        // Clean up
        await server.cleanup();
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testOnboardingFix().catch(error => {
    console.error('💥 Test crashed:', error.message);
});
