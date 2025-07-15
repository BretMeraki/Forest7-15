#!/usr/bin/env node

/**
 * PERFORMANCE TEST - Measure optimized HTA generation speed
 */

import { Stage1CoreServer } from './core-server.js';

async function measurePerformance(goal, context, domain) {
    console.log(`\n⚡ PERFORMANCE TEST: ${domain.toUpperCase()}`);
    console.log(`🎯 Goal: ${goal}`);
    
    const server = new Stage1CoreServer({
        dataPersistence: { dataDir: `./.perf-test-${domain}` },
        vectorProvider: {
            provider: 'SQLiteVecProvider',
            config: { 
                dbPath: `./.perf-test-${domain}/vectors.db`,
                enableCache: true
            }
        }
    });

    try {
        // Measure initialization
        const initStart = Date.now();
        await server.initialize();
        const initTime = Date.now() - initStart;
        console.log(`📊 Initialization: ${initTime}ms`);

        // Measure project creation
        const projectStart = Date.now();
        const projectResult = await server.createProject({ goal, context });
        const projectTime = Date.now() - projectStart;
        console.log(`📊 Project creation: ${projectTime}ms`);

        if (!projectResult.success) {
            throw new Error(`Project creation failed: ${projectResult.error}`);
        }

        // Setup onboarding bypass
        const onboardingStart = Date.now();
        await server.dataPersistence.saveProjectData(projectResult.project_id, 'onboarding_state.json', {
            current_stage: 'completed',
            goal, context,
            user_profile: { experience_level: "intermediate" },
            aggregate_context: { 
                goal, context, 
                complexity: { score: 6, level: "moderate", recommended_depth: 2 }, // Force shallow depth
                fastMode: true // Enable fast mode
            }
        });
        const onboardingTime = Date.now() - onboardingStart;
        console.log(`📊 Onboarding setup: ${onboardingTime}ms`);

        // Measure HTA tree building (the main bottleneck)
        const htaStart = Date.now();
        const buildResult = await server.buildHTATree({ 
            goal, 
            context,
            fastMode: true // Request fast mode
        });
        const htaTime = Date.now() - htaStart;
        console.log(`📊 HTA tree building: ${htaTime}ms`);

        if (!buildResult.success) {
            throw new Error(`HTA build failed: ${buildResult.error}`);
        }

        // Measure content retrieval
        const contentStart = Date.now();
        const status = await server.getHTAStatus();
        const contentTime = Date.now() - contentStart;
        console.log(`📊 Content retrieval: ${contentTime}ms`);

        const totalTime = initTime + projectTime + onboardingTime + htaTime + contentTime;
        console.log(`🏆 TOTAL TIME: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);

        // Analyze content quality
        if (status?.content?.[0]?.text) {
            const content = status.content[0].text;
            console.log(`📄 Content length: ${content.length} characters`);
            console.log(`📝 Sample: "${content.substring(0, 200)}..."`);
        }

        await server.cleanup();

        return {
            domain,
            success: true,
            times: {
                initialization: initTime,
                projectCreation: projectTime,
                onboardingSetup: onboardingTime,
                htaBuilding: htaTime,
                contentRetrieval: contentTime,
                total: totalTime
            },
            contentLength: status?.content?.[0]?.text?.length || 0
        };

    } catch (error) {
        await server.cleanup();
        console.error(`❌ Performance test failed: ${error.message}`);
        return {
            domain,
            success: false,
            error: error.message
        };
    }
}

async function runPerformanceTests() {
    console.log('⚡ PERFORMANCE OPTIMIZATION VALIDATION');
    console.log('=' * 60);
    
    const testCases = [
        {
            goal: "Learn basic pottery techniques",
            context: "Beginner with no experience",
            domain: "pottery"
        },
        {
            goal: "Master JavaScript programming",
            context: "Intermediate developer",
            domain: "programming"
        }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
        const result = await measurePerformance(testCase.goal, testCase.context, testCase.domain);
        results.push(result);
    }
    
    // Performance analysis
    console.log(`\n${'='.repeat(60)}`);
    console.log('🏆 PERFORMANCE ANALYSIS');
    console.log(`${'='.repeat(60)}`);
    
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length > 0) {
        const avgTotal = successfulResults.reduce((sum, r) => sum + r.times.total, 0) / successfulResults.length;
        const avgHTA = successfulResults.reduce((sum, r) => sum + r.times.htaBuilding, 0) / successfulResults.length;
        
        console.log(`📊 Average total time: ${avgTotal.toFixed(0)}ms (${(avgTotal/1000).toFixed(1)}s)`);
        console.log(`📊 Average HTA building: ${avgHTA.toFixed(0)}ms (${(avgHTA/1000).toFixed(1)}s)`);
        
        if (avgTotal < 10000) { // Under 10 seconds
            console.log(`✅ PERFORMANCE EXCELLENT: Under 10 seconds`);
        } else if (avgTotal < 30000) { // Under 30 seconds
            console.log(`✅ PERFORMANCE GOOD: Under 30 seconds`);
        } else {
            console.log(`⚠️ PERFORMANCE NEEDS WORK: Over 30 seconds`);
        }
        
        console.log(`\n📋 Detailed breakdown:`);
        successfulResults.forEach(result => {
            console.log(`   ${result.domain}: ${result.times.total}ms total, ${result.times.htaBuilding}ms HTA`);
        });
    } else {
        console.log(`❌ All performance tests failed`);
    }
}

runPerformanceTests().catch(error => {
    console.error('💥 Performance test crashed:', error.message);
    process.exit(1);
});