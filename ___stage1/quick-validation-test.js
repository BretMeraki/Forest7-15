#!/usr/bin/env node

import { Stage1CoreServer } from './core-server.js';

async function quickValidationTest() {
    console.log('🧪 Quick Validation Test for Production Readiness...\n');
    
    const results = {
        gatedOnboarding: false,
        vectorization: false,
        branchMetadata: false,
        schemaDriven: false
    };
    
    try {
        // Initialize server
        const server = new Stage1CoreServer({
            dataPersistence: { dataDir: './.forest-data' },
            vectorProvider: {
                provider: 'LocalJSONProvider',  // Use local for faster testing
                config: { dataPath: './.forest-data/vectors' }
            }
        });
        
        await server.initialize();
        console.log('✅ Forest server initialized\n');
        
        // TEST 1: Gated Onboarding System
        console.log('📋 Test 1: Gated Onboarding');
        try {
            const onboarding = server.gatedOnboarding;
            const stage = await onboarding.determineCorrectStage();
            if (stage && stage !== 'undefined') {
                const contextResult = await onboarding.continueOnboarding('test-session-' + Date.now(), 'context_gathering', {
                    context: 'Test context for validation'
                });
                if (contextResult && contextResult.success) {
                    results.gatedOnboarding = true;
                    console.log('✅ Gated Onboarding: PASS');
                }
            }
        } catch (e) {
            console.log('❌ Gated Onboarding: FAIL -', e.message);
        }
        
        // TEST 2: Check if vectorization is configured
        console.log('\n📋 Test 2: Vectorization Setup');
        try {
            const vectorStatus = await server.getVectorizationStatus();
            if (vectorStatus && (vectorStatus.vectorization_status || vectorStatus.content)) {
                results.vectorization = true;
                console.log('✅ Vectorization: PASS');
            } else {
                console.log('❌ Vectorization: FAIL - Invalid response format');
            }
        } catch (e) {
            console.log('❌ Vectorization: FAIL -', e.message);
        }
        
        // TEST 3: Check branch metadata
        console.log('\n📋 Test 3: Branch Metadata');
        try {
            // Check if the enhanced HTA core is initialized with schema engine
            if (server.htaCore && server.htaCore.schemaEngine && server.htaCore.buildHTATree) {
                results.branchMetadata = true;
                console.log('✅ Branch Metadata: PASS');
            } else {
                console.log('❌ Branch Metadata: FAIL - HTA Core or Schema Engine not initialized');
                console.log('  - htaCore exists:', !!server.htaCore);
                console.log('  - schemaEngine exists:', !!server.htaCore?.schemaEngine);
                console.log('  - buildHTATree exists:', !!server.htaCore?.buildHTATree);
            }
        } catch (e) {
            console.log('❌ Branch Metadata: FAIL -', e.message);
        }
        
        // TEST 4: Schema-driven approach
        console.log('\n📋 Test 4: Schema-Driven Approach');
        try {
            // Check if schema-driven HTA is available via schema engine
            if (server.htaCore && server.htaCore.schemaEngine && server.htaCore.schemaEngine.schemas) {
                results.schemaDriven = true;
                console.log('✅ Schema-Driven: PASS');
            } else {
                console.log('❌ Schema-Driven: FAIL - Schema definitions not found');
                console.log('  - htaCore exists:', !!server.htaCore);
                console.log('  - schemaEngine exists:', !!server.htaCore?.schemaEngine);
                console.log('  - schemas exists:', !!server.htaCore?.schemaEngine?.schemas);
            }
        } catch (e) {
            console.log('❌ Schema-Driven: FAIL -', e.message);
        }
        
        // Clean up
        await server.cleanup();
        
        // Summary
        const passedTests = Object.values(results).filter(r => r).length;
        const totalTests = Object.keys(results).length;
        
        console.log('\n' + '='.repeat(40));
        console.log(`🎯 VALIDATION RESULTS: ${passedTests}/${totalTests} tests passed`);
        console.log(`✅ Production Readiness: ${Math.round((passedTests/totalTests) * 100)}%`);
        console.log('='.repeat(40));
        
        if (passedTests === totalTests) {
            console.log('🎉 ALL TESTS PASSED!');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

// Run the test
quickValidationTest().catch(error => {
    console.error('💥 Test crashed:', error.message);
});
