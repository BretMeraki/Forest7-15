#!/usr/bin/env node

import { RealLLMInterface } from './___stage1/modules/real-llm-interface.js';

async function testRootCauseFix() {
  console.log('🧪 Testing Root Cause Fix: makeClaudeAPICall should call intelligent methods');
  console.log('=' .repeat(70));
  
  const llm = new RealLLMInterface();
  
  try {
    // Test the fixed method
    const result = await llm.makeClaudeAPICall({
      system: 'You are a test assistant',
      user: 'Generate strategic branches for forest management',
      goal: 'forest_management'
    });
    
    console.log('✅ Result type:', typeof result);
    console.log('✅ Has strategic_branches:', !!result.strategic_branches);
    console.log('✅ Has domain_context:', !!result.domain_context);
    console.log('✅ Not MCP structure:', !result.type || result.type !== 'CLAUDE_INTELLIGENCE_REQUEST');
    
    if (result.strategic_branches && Array.isArray(result.strategic_branches)) {
      console.log('🎯 SUCCESS: Enhanced generateGenericBranches() is now being called!');
      console.log('📊 Strategic branches count:', result.strategic_branches.length);
      console.log('🌟 First branch:', result.strategic_branches[0]?.name || 'N/A');
    } else {
      console.log('❌ Still not calling enhanced methods');
      console.log('📋 Result structure:', Object.keys(result));
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testRootCauseFix();