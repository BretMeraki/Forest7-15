#!/usr/bin/env node

/**
 * PURE SCHEMA SYSTEM TEST
 * Tests the Pure Schema HTA system directly to verify 6-level generation
 */

import { PureSchemaHTASystem } from './modules/pure-schema-driven-hta.js';
import { RealLLMInterface } from './modules/real-llm-interface.js';

async function testPureSchemaDepth() {
    console.log('🧠 PURE SCHEMA HTA SYSTEM DEEP TREE TEST');
    console.log('=' * 60);
    
    const llmInterface = new RealLLMInterface();
    const pureSchemaHTA = new PureSchemaHTASystem(llmInterface);
    
    const testCases = [
        {
            goal: "Master advanced pottery wheel throwing techniques",
            context: "Experienced beginner with basic hand-building skills",
            domain: "pottery"
        },
        {
            goal: "Develop expertise in cybersecurity penetration testing", 
            context: "Network administrator with security fundamentals",
            domain: "cybersecurity"
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🎯 Testing ${testCase.domain.toUpperCase()}: ${testCase.goal}`);
        
        try {
            const context = {
                learningStyle: "mixed",
                focusAreas: [],
                context: testCase.context,
                userConstraints: {},
                lifePreferences: {},
                urgency: "moderate",
                available_resources: {
                    time: "flexible",
                    budget: "moderate",
                    tools: "standard",
                    support: "self-directed"
                },
                detailedPlanning: true, // Request detailed planning
                explicitDepthRequest: true, // Explicit request for depth
                progressiveDepth: 6 // Force full 6-level depth
            };
            
            console.log('🌳 Generating comprehensive 6-level HTA tree...');
            const startTime = Date.now();
            
            const result = await pureSchemaHTA.generateHTATree(testCase.goal, context);
            
            const buildTime = Date.now() - startTime;
            console.log(`⏱️ Generation time: ${buildTime}ms (${(buildTime/1000).toFixed(1)}s)`);
            
            // Analyze the structure
            console.log('\n📊 GENERATED STRUCTURE:');
            const levels = Object.keys(result).filter(key => key.startsWith('level'));
            console.log(`   Generated levels: ${levels.length}`);
            
            levels.forEach(level => {
                const data = result[level];
                console.log(`   ${level}: ${data ? '✅ Generated' : '❌ Missing'}`);
                if (data && typeof data === 'object') {
                    console.log(`      Keys: ${Object.keys(data).join(', ')}`);
                    if (data.strategic_branches && Array.isArray(data.strategic_branches)) {
                        console.log(`      Branches: ${data.strategic_branches.length}`);
                    }
                    if (Array.isArray(data)) {
                        console.log(`      Items: ${data.length}`);
                    }
                }
            });
            
            // Check depth achievement
            const maxDepth = levels.length;
            const hasLevel6 = !!result.level6_contextAdaptivePrimitives;
            
            console.log(`\n📏 DEPTH ANALYSIS:`);
            console.log(`   Maximum depth reached: ${maxDepth}`);
            console.log(`   Has Level 6 primitives: ${hasLevel6 ? '✅ YES' : '❌ NO'}`);
            console.log(`   Available depth: ${result.availableDepth || 'undefined'}`);
            console.log(`   Max depth setting: ${result.maxDepth || 'undefined'}`);
            
            // Quality check
            const jsonString = JSON.stringify(result, null, 2);
            const hasRichContent = jsonString.length > 5000;
            const hasDomainTerms = jsonString.toLowerCase().includes(testCase.domain.toLowerCase());
            
            console.log(`\n📈 QUALITY ANALYSIS:`);
            console.log(`   Content size: ${jsonString.length} characters`);
            console.log(`   Rich content: ${hasRichContent ? '✅ YES' : '❌ NO'}`);
            console.log(`   Domain-specific: ${hasDomainTerms ? '✅ YES' : '❌ NO'}`);
            
            // Success criteria
            const success = maxDepth >= 4 && hasRichContent;
            console.log(`\n🏆 RESULT: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
            
            if (maxDepth >= 6) {
                console.log(`🎉 COMPREHENSIVE 6-LEVEL TREE ACHIEVED!`);
            } else if (maxDepth >= 4) {
                console.log(`✅ Good depth achieved (${maxDepth} levels)`);
            } else {
                console.log(`❌ Insufficient depth (only ${maxDepth} levels)`);
            }
            
        } catch (error) {
            console.error(`❌ Test failed for ${testCase.domain}: ${error.message}`);
            console.error(error.stack);
        }
    }
}

testPureSchemaDepth().then(() => {
    console.log('\n🏁 PURE SCHEMA DEPTH TEST COMPLETE');
}).catch(error => {
    console.error('\n💥 Pure schema test crashed:', error.message);
    process.exit(1);
});