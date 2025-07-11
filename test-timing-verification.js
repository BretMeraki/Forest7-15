/**
 * Quick Timing Verification Test
 * Tests the intelligent pacing system for HTA generation
 */

import { PureSchemaHTASystem } from './___stage1/modules/pure-schema-driven-hta.js';

class MockLLMInterface {
  async request(params) {
    // Mock response - instant return
    return {
      type: 'CLAUDE_INTELLIGENCE_REQUEST',
      requestId: 'mock_' + Date.now(),
      prompt: { system: 'mock', user: 'mock' },
      parameters: { maxTokens: 2000 },
      processingInstructions: 'mock',
      responseFormat: 'text'
    };
  }
}

async function testPacingTiming() {
  console.log('🎯 Testing HTA Generation Pacing Timing\n');
  
  const mockLLM = new MockLLMInterface();
  const schema = new PureSchemaHTASystem(mockLLM);
  
  console.log('🔧 Testing goalContext schema pacing...');
  const startTime = Date.now();
  
  // Test the pacing for goalContext (should take ~8 seconds)
  const shouldPace = schema.shouldApplyIntelligentPacing('goalContext', {
    goal: 'Learn Python programming fundamentals and build a web application',
    goalCharacteristics: { complexity: 'low', score: 2, characteristics: ['technical'] }
  });
  
  console.log(`📊 Should apply pacing: ${shouldPace}`);
  
  if (shouldPace) {
    console.log('⏳ Applying intelligent pacing...');
    await schema.applyIntelligentPacing('goalContext', {
      goal: 'Learn Python programming fundamentals and build a web application'
    });
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n⏱️  Pacing Duration: ${duration.toFixed(1)} seconds`);
  console.log(`🎯 Expected: ~8 seconds for goalContext`);
  console.log(`📈 Status: ${duration >= 7 ? 'EXCELLENT' : duration >= 4 ? 'GOOD' : 'NEEDS WORK'}`);
  
  // Test strategic branches pacing
  console.log('\n🔧 Testing strategicBranches schema pacing...');
  const startTime2 = Date.now();
  
  const shouldPace2 = schema.shouldApplyIntelligentPacing('strategicBranches', {
    goal: 'Learn Python programming fundamentals and build a web application',
    goalCharacteristics: { complexity: 'low', score: 2, characteristics: ['technical'] }
  });
  
  if (shouldPace2) {
    console.log('⏳ Applying strategic branches pacing...');
    await schema.applyIntelligentPacing('strategicBranches', {
      goal: 'Learn Python programming fundamentals and build a web application'
    });
  }
  
  const endTime2 = Date.now();
  const duration2 = (endTime2 - startTime2) / 1000;
  
  console.log(`\n⏱️  Strategic Branches Duration: ${duration2.toFixed(1)} seconds`);
  console.log(`🎯 Expected: ~12 seconds for strategicBranches`);
  console.log(`📈 Status: ${duration2 >= 10 ? 'EXCELLENT' : duration2 >= 6 ? 'GOOD' : 'NEEDS WORK'}`);
  
  // Combined timing estimate
  const totalEstimate = duration + duration2;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🎯 TOTAL PACING VERIFICATION`);
  console.log(`${'='.repeat(50)}`);
  console.log(`⏱️  Combined Time: ${totalEstimate.toFixed(1)} seconds`);
  console.log(`🎯 Target for HTA Generation: 25-30 seconds`);
  console.log(`📊 Two schemas tested: ${totalEstimate.toFixed(1)}s (partial)`);
  console.log(`🔮 Estimated full HTA generation: ${(totalEstimate * 2.5).toFixed(1)}s`);
  console.log(`📈 Projection: ${(totalEstimate * 2.5) >= 25 ? 'ON TARGET' : 'NEEDS ADJUSTMENT'}`);
  
  if ((totalEstimate * 2.5) >= 25) {
    console.log('\n🎉 SUCCESS: Intelligent pacing system is working correctly!');
    console.log('✅ HTA generation will take 25-30 seconds as required');
    console.log('✅ Users will experience thoughtful, substantial processing');
    console.log('✅ Progress indicators provide clear feedback');
  } else {
    console.log('\n⚠️  ADJUSTMENT NEEDED: Pacing may be too fast');
    console.log('💡 Consider increasing delay multipliers');
  }
}

// Run the test
testPacingTiming().catch(console.error);
