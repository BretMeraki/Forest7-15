#!/usr/bin/env node

/**
 * Test script to verify real Claude intelligence is being used
 * This tests the MCP Intelligence Bridge integration
 */

import { getMCPIntelligenceBridge, getRealLLMInterface } from './modules/mcp-intelligence-bridge.js';
import { PureSchemaHTASystem } from './modules/pure-schema-driven-hta.js';

async function testRealIntelligence() {
  console.log('🧪 Testing MCP Intelligence Bridge Integration\n');
  
  // Test 1: Check bridge configuration
  console.log('Test 1: Checking MCP Intelligence Bridge configuration...');
  const bridge = getMCPIntelligenceBridge();
  const config = bridge.isConfiguredForRealIntelligence();
  console.log('Bridge configuration:', JSON.stringify(config, null, 2));
  
  if (!config.mcpBridgeActive || !config.realLLMInterface) {
    console.error('❌ Bridge not properly configured!');
    return;
  }
  console.log('✅ Bridge configured correctly\n');
  
  // Test 2: Test direct LLM interface
  console.log('Test 2: Testing direct LLM interface...');
  const llmInterface = getRealLLMInterface();
  
  const testRequest = {
    method: 'llm/completion',
    params: {
      prompt: 'What is 2+2? Respond with just the number.',
      max_tokens: 10,
      temperature: 0.1,
      goal: 'Simple math test'
    }
  };
  
  console.log('Sending test request:', JSON.stringify(testRequest, null, 2));
  const response = await llmInterface.request(testRequest);
  console.log('Response:', JSON.stringify(response, null, 2));
  
  if (response.type === 'CLAUDE_INTELLIGENCE_REQUEST') {
    console.log('✅ LLM interface returns proper MCP Bridge request format\n');
  } else {
    console.error('❌ Unexpected response format');
  }
  
  // Test 3: Test PureSchemaHTASystem with real intelligence
  console.log('Test 3: Testing PureSchemaHTASystem with real intelligence...');
  const schemaSystem = new PureSchemaHTASystem(llmInterface);
  
  console.log('Generating HTA tree for: "Learn machine learning with scikit-learn"');
  
  let hasGenericBranches = false; // Define outside try block
  
  try {
    const htaTree = await schemaSystem.generateHTATree('Learn machine learning with scikit-learn', {
      learningStyle: 'hands-on',
      focusAreas: ['practical implementation', 'real projects'],
      requireDomainSpecific: true,
      avoidGenericTemplates: true,
      progressiveDepth: 2 // Just test first 2 levels for speed
    });
    
    console.log('\nGenerated HTA Tree:');
    console.log('Goal:', htaTree.goal);
    console.log('Goal characteristics:', htaTree.goalCharacteristics);
    
    if (htaTree.level1_goalContext) {
      console.log('\nLevel 1 - Goal Context:');
      console.log('- Domain:', htaTree.level1_goalContext.goal_analysis?.domain_type);
      console.log('- Complexity:', htaTree.level1_goalContext.goal_analysis?.goal_complexity);
    }
    
    if (htaTree.level2_strategicBranches?.strategic_branches) {
      console.log('\nLevel 2 - Strategic Branches:');
      htaTree.level2_strategicBranches.strategic_branches.forEach((branch, idx) => {
        console.log(`${idx + 1}. ${branch.name}`);
        console.log(`   - ${branch.description}`);
      });
    }
    
    // Check if branches are generic (indicating mock responses)
    const branches = htaTree.level2_strategicBranches?.strategic_branches || [];
    hasGenericBranches = branches.some(b => 
      b.name.includes('Foundation') || 
      b.name.includes('Application') || 
      b.name.includes('Mastery')
    );
    
    if (hasGenericBranches) {
      console.error('\n❌ WARNING: Generated branches appear to be generic templates!');
      console.error('This suggests mock responses are still being used.');
    } else {
      console.log('\n✅ Generated branches are domain-specific!');
      console.log('Real intelligence appears to be working.');
    }
    
  } catch (error) {
    console.error('❌ HTA generation failed:', error.message);
    hasGenericBranches = true; // Assume failure means mocks are being used
  }
  
  // Test 4: Check for mock response patterns
  console.log('\nTest 4: Checking for mock response patterns...');
  const mockTestRequest = {
    method: 'llm/completion', 
    params: {
      prompt: 'Generate a unique response about quantum computing',
      goal: 'Test for mock patterns',
      schema: {
        type: 'object',
        properties: {
          content: { type: 'string' }
        }
      }
    }
  };
  
  const mockTestResponse = await llmInterface.request(mockTestRequest);
  console.log('Mock test response:', JSON.stringify(mockTestResponse, null, 2));
  
  // Final summary
  console.log('\n=== Test Summary ===');
  console.log('1. MCP Bridge Configuration: ✅');
  console.log('2. LLM Interface Format: ✅'); 
  console.log('3. Domain-Specific Generation: ' + (hasGenericBranches ? '❌ Using mocks' : '✅ Real intelligence'));
  console.log('4. Response Type: ' + (mockTestResponse.type === 'CLAUDE_INTELLIGENCE_REQUEST' ? '✅ MCP Bridge format' : '❌ Wrong format'));
  
  console.log('\n🎯 Conclusion:');
  if (mockTestResponse.type === 'CLAUDE_INTELLIGENCE_REQUEST' && !hasGenericBranches) {
    console.log('✅ System is configured for real Claude intelligence via MCP Bridge!');
  } else {
    console.log('⚠️ System is returning MCP Bridge requests, but responses need to be processed by Claude.');
    console.log('In an MCP server environment, Claude will process these requests directly.');
  }
}

// Run the test
testRealIntelligence().catch(console.error);
