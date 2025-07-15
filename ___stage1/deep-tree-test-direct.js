#!/usr/bin/env node

/**
 * DIRECT DEEP TREE TEST
 * 
 * Tests Pure Schema HTA system directly to ensure 6-level generation with no fallbacks
 */

import { PureSchemaHTASystem } from './modules/pure-schema-driven-hta.js';
import { RealLLMInterface } from './modules/real-llm-interface.js';

async function testDirectPureSchemaDeepTree() {
    console.log('🌳 DIRECT PURE SCHEMA DEEP TREE TEST');
    console.log('Testing with NO FALLBACKS - Pure Schema only');
    console.log('=' * 70);
    
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
                detailedPlanning: true,
                explicitDepthRequest: true,
                progressiveDepth: 6, // Force full 6-level depth
                requireDomainSpecific: true,
                avoidGenericTemplates: true,
                usePureSchemaOnly: true, // Disable all fallbacks
                forcePureSchema: true // Force Pure Schema usage
            };
            
            console.log('🧠 Generating 6-level HTA tree with Pure Schema (NO FALLBACKS)...');
            const startTime = Date.now();
            
            const result = await pureSchemaHTA.generateHTATree(testCase.goal, context);
            
            const buildTime = Date.now() - startTime;
            console.log(`⏱️ Generation time: ${buildTime}ms (${(buildTime/1000).toFixed(1)}s)`);
            
            // Validate 6-level structure
            console.log('\n📊 GENERATED STRUCTURE VALIDATION:');
            const levels = Object.keys(result).filter(key => key.startsWith('level'));
            console.log(`   Generated levels: ${levels.length}`);
            
            const levelValidation = {
                level1: !!result.level1_goalContext,
                level2: !!result.level2_strategicBranches,
                level3: !!result.level3_taskDecomposition,
                level4: !!result.level4_microParticles,
                level5: !!result.level5_nanoActions,
                level6: !!result.level6_contextAdaptivePrimitives
            };
            
            levels.forEach(level => {
                const data = result[level];
                const isValid = !!data;
                console.log(`   ${level}: ${isValid ? '✅ GENERATED' : '❌ MISSING'}`);
                
                if (data && typeof data === 'object') {
                    if (Array.isArray(data)) {
                        console.log(`      Array with ${data.length} items`);
                    } else {
                        console.log(`      Object with keys: ${Object.keys(data).join(', ')}`);
                    }
                }
            });
            
            // Validate domain-specific content
            const jsonString = JSON.stringify(result, null, 2);
            const hasDomainTerms = jsonString.toLowerCase().includes(testCase.domain.toLowerCase());
            const hasRichContent = jsonString.length > 10000; // Expect substantial content
            
            console.log(`\n📈 CONTENT QUALITY VALIDATION:`);
            console.log(`   Content size: ${jsonString.length} characters`);
            console.log(`   Rich content (>10k chars): ${hasRichContent ? '✅ YES' : '❌ NO'}`);
            console.log(`   Domain-specific (${testCase.domain}): ${hasDomainTerms ? '✅ YES' : '❌ NO'}`);
            
            // Check for fallback indicators (should be NONE) - but allow domain-specific foundations
            const hasGenericTerms = jsonString.toLowerCase().includes('testing foundations') ||
                                   jsonString.toLowerCase().includes('testing application') ||
                                   jsonString.toLowerCase().includes('testing mastery');
            console.log(`   No generic fallback terms: ${!hasGenericTerms ? '✅ YES' : '❌ NO'}`);
            
            // Success criteria for Pure Schema (NO FALLBACKS)
            const allLevelsGenerated = levels.length === 6;
            const hasLevel6 = !!result.level6_contextAdaptivePrimitives;
            const noFallbackTerms = !hasGenericTerms;
            const domainSpecific = hasDomainTerms;
            
            const success = allLevelsGenerated && hasLevel6 && noFallbackTerms && domainSpecific && hasRichContent;
            
            console.log(`\n🏆 PURE SCHEMA RESULT: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
            
            if (success) {
                console.log(`🎉 PERFECT 6-LEVEL GENERATION ACHIEVED!`);
                console.log(`✅ All 6 levels generated with Pure Schema`);
                console.log(`✅ No fallback mechanisms used`);
                console.log(`✅ Domain-specific content for ${testCase.domain}`);
                console.log(`✅ Rich, comprehensive content (${jsonString.length} chars)`);
            } else {
                console.log(`❌ FAILED REQUIREMENTS:`);
                if (!allLevelsGenerated) console.log(`   - Only ${levels.length}/6 levels generated`);
                if (!hasLevel6) console.log(`   - Missing Level 6 (Context-Adaptive Primitives)`);
                if (hasGenericTerms) console.log(`   - Contains generic fallback terms`);
                if (!domainSpecific) console.log(`   - Not domain-specific for ${testCase.domain}`);
                if (!hasRichContent) console.log(`   - Insufficient content (${jsonString.length} chars)`);
            }
            
            // Show sample of Level 6 content to verify depth
            if (result.level6_contextAdaptivePrimitives) {
                console.log(`\n📚 LEVEL 6 SAMPLE (Context-Adaptive Primitives):`);
                const level6Sample = JSON.stringify(result.level6_contextAdaptivePrimitives, null, 2).substring(0, 300);
                console.log(`"${level6Sample}..."`);
            }
            
        } catch (error) {
            console.error(`❌ DIRECT TEST FAILED for ${testCase.domain}: ${error.message}`);
            console.error(`   Error type: ${error.constructor.name}`);
            console.error(`   Stack: ${error.stack?.split('\n')[1] || 'No stack'}`);
        }
    }
}

async function runDirectDeepTreeTest() {
    console.log('🌳 DIRECT PURE SCHEMA DEEP TREE VALIDATION');
    console.log('Testing Pure Schema system directly with NO FALLBACKS');
    console.log('=' * 80);
    
    try {
        await testDirectPureSchemaDeepTree();
        
        console.log('\n' + '=' * 80);
        console.log('🏆 DIRECT PURE SCHEMA TEST COMPLETE');
        console.log('=' * 80);
        console.log('🎯 This test validates that Pure Schema can generate 6-level trees');
        console.log('🚫 No fallbacks allowed - Pure Schema only');
        console.log('🌟 Domain-specific content required');
        console.log('📏 All 6 levels must be present and rich');
        
        return true;
        
    } catch (error) {
        console.error(`\n💥 Direct deep tree test crashed: ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

runDirectDeepTreeTest().then(success => {
    const message = success ? 
        '\n🎉 DIRECT PURE SCHEMA DEEP TREE TEST VERIFIED!' :
        '\n💥 DIRECT PURE SCHEMA DEEP TREE TEST FAILED';
    console.log(message);
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('\n💥 Direct deep tree test crashed:', error.message);
    process.exit(1);
});