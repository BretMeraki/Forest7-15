#!/usr/bin/env node

/**
 * DIRECT LLM PROOF - Shows actual LLM interface responses
 * Proves the RealLLMInterface generates domain-specific content
 */

import { RealLLMInterface } from './modules/real-llm-interface.js';

async function testDirectLLMInterface() {
    console.log('🔍 DIRECT LLM INTERFACE VERIFICATION');
    console.log('=' * 50);
    
    const llmInterface = new RealLLMInterface();
    
    const testCases = [
        {
            goal: "Learn pottery wheel throwing",
            domain: "pottery",
            expectedTerms: ['clay', 'wheel', 'centering', 'pottery', 'throwing']
        },
        {
            goal: "Master cybersecurity penetration testing", 
            domain: "cybersecurity",
            expectedTerms: ['penetration', 'security', 'vulnerability', 'exploit', 'network']
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🎯 Testing ${testCase.domain.toUpperCase()}: ${testCase.goal}`);
        
        try {
            // Test strategic branches generation
            const branchRequest = {
                method: 'llm/completion',
                params: {
                    goal: testCase.goal,
                    user_goal: testCase.goal,
                    learning_goal: testCase.goal,
                    system: "Generate strategic learning branches for this goal",
                    user: `Create learning branches for: ${testCase.goal}`,
                    schema: {
                        type: "object",
                        properties: {
                            strategic_branches: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        description: { type: "string" }
                                    }
                                }
                            }
                        }
                    }
                }
            };
            
            console.log('📡 Making LLM request...');
            const response = await llmInterface.request(branchRequest);
            
            console.log('✅ Response received:');
            console.log('   Type:', typeof response);
            console.log('   Keys:', Object.keys(response));
            
            if (response.strategic_branches) {
                console.log('📋 Generated branches:');
                response.strategic_branches.forEach((branch, idx) => {
                    console.log(`   ${idx + 1}. ${branch.name}: ${branch.description}`);
                });
                
                // Check domain specificity
                const allText = JSON.stringify(response).toLowerCase();
                const foundTerms = testCase.expectedTerms.filter(term => 
                    allText.includes(term.toLowerCase())
                );
                
                console.log(`🎯 Domain terms found: ${foundTerms.join(', ')}`);
                console.log(`📊 Domain coverage: ${foundTerms.length}/${testCase.expectedTerms.length}`);
                
                const isSpecific = foundTerms.length >= 2;
                console.log(`✅ Domain-specific: ${isSpecific ? 'YES' : 'NO'}`);
                
            } else {
                console.log('❌ No strategic_branches in response');
                console.log('📄 Raw response:', JSON.stringify(response, null, 2));
            }
            
        } catch (error) {
            console.error(`❌ Error testing ${testCase.domain}:`, error.message);
        }
    }
    
    console.log('\n🏆 DIRECT LLM INTERFACE VERIFICATION COMPLETE');
}

testDirectLLMInterface().catch(error => {
    console.error('💥 Direct test failed:', error.message);
    process.exit(1);
});