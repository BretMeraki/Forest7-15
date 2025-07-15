#!/usr/bin/env node

import { RealLLMInterface } from './___stage1/modules/real-llm-interface.js';

async function testHTALLMIntegration() {
  console.log('🧪 Testing HTA-LLM Integration: generateContent method');
  console.log('=' .repeat(70));
  
  const llm = new RealLLMInterface();
  
  try {
    // Test the generateContent method that HTA system uses
    const result = await llm.generateContent({
      type: 'strategicBranches',
      goal: 'Master advanced cybersecurity penetration testing',
      context: { goal: 'Master advanced cybersecurity penetration testing' },
      prompt: 'Generate strategic branches for cybersecurity learning',
      schema: {
        type: "object",
        properties: {
          strategic_branches: {
            type: "array",
            minItems: 3,
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                priority: { type: "number" }
              }
            }
          }
        }
      },
      systemMessage: 'Generate domain-specific strategic branches',
      requireDomainSpecific: true,
      avoidGenericTemplates: true
    });
    
    console.log('✅ Result type:', typeof result);
    console.log('✅ Has strategic_branches:', !!result.strategic_branches);
    console.log('✅ Strategic branches count:', result.strategic_branches?.length || 0);
    
    if (result.strategic_branches && Array.isArray(result.strategic_branches)) {
      console.log('🎯 SUCCESS: generateContent is working!');
      console.log('🌟 First branch:', result.strategic_branches[0]?.name || 'N/A');
      console.log('🌟 Second branch:', result.strategic_branches[1]?.name || 'N/A');
      console.log('🌟 Third branch:', result.strategic_branches[2]?.name || 'N/A');
      
      // Check if branches are generic or intelligent
      const firstBranch = result.strategic_branches[0]?.name || '';
      if (firstBranch.includes('Foundation Phase') || firstBranch.includes('Development Phase')) {
        console.log('❌ Still using generic templates!');
      } else {
        console.log('✅ Using intelligent, domain-specific branches!');
      }
    } else {
      console.log('❌ generateContent not returning strategic branches');
      console.log('📋 Result structure:', Object.keys(result));
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.error('Stack:', err.stack);
  }
}

testHTALLMIntegration();