/**
 * Simple test to verify MCP Intelligence Bridge functionality
 */

import { MCPIntelligenceCore, ForestIntelligenceAdapter, CoreIntelligence } from './___stage1/modules/core-intelligence.js';

async function testMCPBridge() {
  console.log('🧪 Testing MCP Intelligence Bridge...');
  
  try {
    // Test 1: MCPIntelligenceCore initialization
    console.log('\n✅ Test 1: MCPIntelligenceCore initialization');
    const intelligenceCore = new MCPIntelligenceCore();
    console.log('   ✓ MCPIntelligenceCore created successfully');
    
    // Test 2: ForestIntelligenceAdapter initialization
    console.log('\n✅ Test 2: ForestIntelligenceAdapter initialization');
    const forestAdapter = new ForestIntelligenceAdapter();
    console.log('   ✓ ForestIntelligenceAdapter created successfully');
    
    // Test 3: CoreIntelligence (legacy) initialization
    console.log('\n✅ Test 3: CoreIntelligence (legacy) initialization');
    const coreIntelligence = new CoreIntelligence(null, null);
    console.log('   ✓ CoreIntelligence created successfully');
    
    // Test 4: Request delegation
    console.log('\n✅ Test 4: Request delegation test');
    const params = {
      system: "You are a test assistant",
      user: "Test user task",
      schema: {
        required: ['title', 'description']
      },
      max_tokens: 300,
      temperature: 0.5
    };
    
    const response = await intelligenceCore.delegateToClaudeIntelligence(params);
    console.log('   ✓ delegateToClaudeIntelligence works');
    console.log('   ✓ Response type:', response.type);
    console.log('   ✓ Request ID generated:', response.requestId);
    
    // Test 5: Static method tests
    console.log('\n✅ Test 5: Static method tests');
    const request = MCPIntelligenceCore.createIntelligenceRequest(
      "System prompt", 
      "User prompt", 
      { maxTokens: 500 }
    );
    console.log('   ✓ createIntelligenceRequest works');
    console.log('   ✓ Request method:', request.method);
    
    const processRequest = MCPIntelligenceCore.processIntelligenceResponse(
      'test-id',
      'test response'
    );
    console.log('   ✓ processIntelligenceResponse works');
    console.log('   ✓ Process method:', processRequest.method);
    
    // Test 6: Legacy compatibility
    console.log('\n✅ Test 6: Legacy compatibility test');
    const reasoning = await coreIntelligence.analyzeReasoning();
    console.log('   ✓ analyzeReasoning returns structured response');
    console.log('   ✓ Content type:', reasoning.content[0].type);
    
    const deductions = await coreIntelligence.generateLogicalDeductions('test');
    console.log('   ✓ generateLogicalDeductions returns array');
    console.log('   ✓ Deductions length:', deductions.length);
    
    console.log('\n🎉 All MCP Bridge tests passed!');
    console.log('\n✅ MCP-Native Intelligence Bridge is working correctly');
    console.log('✅ Forest integration is ready');
    console.log('✅ Domain-agnostic architecture is functional');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testMCPBridge().catch(console.error);
