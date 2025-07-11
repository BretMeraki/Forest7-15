/**
 * Temperature Settings Verification Test
 * Ensures all temperature settings are maximized for creativity
 */

import { PureSchemaHTASystem } from './___stage1/modules/pure-schema-driven-hta.js';
import { MCPIntelligenceCore } from './___stage1/modules/core-intelligence.js';

async function testTemperatureSettings() {
  console.log('🌡️  Testing Temperature Settings for Maximum Creativity\n');
  
  // Test Pure Schema HTA System temperatures
  console.log('📊 Pure Schema HTA System Temperature Settings:');
  console.log('================================================');
  
  const mockLLM = {
    async request() { return { type: 'mock' }; }
  };
  
  const schema = new PureSchemaHTASystem(mockLLM);
  
  const schemaTypes = [
    'goalContext',
    'strategicBranches', 
    'taskDecomposition',
    'microParticles',
    'nanoActions',
    'contextAdaptivePrimitives',
    'contextMining',
    'domainRelevance',
    'painPointValidation',
    'treeEvolution'
  ];
  
  let allHighTemperature = true;
  
  schemaTypes.forEach(schemaType => {
    const temp = schema.getTemperatureForSchema(schemaType);
    const status = temp >= 0.8 ? '✅ HIGH' : temp >= 0.5 ? '⚠️  MEDIUM' : '❌ LOW';
    console.log(`  ${schemaType.padEnd(25)} : ${temp.toFixed(2)} ${status}`);
    
    if (temp < 0.8) allHighTemperature = false;
  });
  
  console.log(`\n📈 Default temperature: ${schema.getTemperatureForSchema('unknown').toFixed(2)}`);
  
  // Test Core Intelligence temperatures
  console.log('\n🧠 Core Intelligence Temperature Settings:');
  console.log('==========================================');
  
  const mcpCore = new MCPIntelligenceCore();
  
  // Create test requests to check temperatures
  const testRequests = [
    { name: 'Default Request', options: {} },
    { name: 'Task Generation', options: { maxTokens: 400 } },
    { name: 'Strategic Branches', options: { maxTokens: 2000 } },
    { name: 'Onboarding Analysis', options: { maxTokens: 1500 } },
    { name: 'Legacy Intelligence', options: { maxTokens: 500 } }
  ];
  
  testRequests.forEach(test => {
    const request = MCPIntelligenceCore.createIntelligenceRequest(
      'test system', 'test user', test.options
    );
    const temp = request.params.temperature;
    const status = temp >= 0.8 ? '✅ HIGH' : temp >= 0.5 ? '⚠️  MEDIUM' : '❌ LOW';
    console.log(`  ${test.name.padEnd(25)} : ${temp.toFixed(2)} ${status}`);
    
    if (temp < 0.8) allHighTemperature = false;
  });
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 TEMPERATURE SETTINGS VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  if (allHighTemperature) {
    console.log('🎉 SUCCESS: All temperature settings are HIGH (≥0.8)');
    console.log('✅ Maximum creativity enabled for HTA generation');
    console.log('✅ Diverse and varied outputs expected');
    console.log('✅ Creative learning pathways will be generated');
  } else {
    console.log('⚠️  WARNING: Some temperature settings are not maximized');
    console.log('💡 Consider increasing low temperature settings');
  }
  
  console.log('\n🔥 Temperature Benefits:');
  console.log('  • More creative strategic branches');
  console.log('  • Varied task decomposition approaches');
  console.log('  • Diverse micro-particle generation');
  console.log('  • Creative context adaptations');
  console.log('  • Unique learning pathway suggestions');
  
  console.log('\n📋 Recommended Temperature Ranges:');
  console.log('  • Goal Context: 0.8-0.9 (creative analysis)');
  console.log('  • Strategic Branches: 0.9-0.95 (maximum creativity)');
  console.log('  • Task Decomposition: 0.8-0.85 (varied approaches)');
  console.log('  • Micro-Particles: 0.85-0.9 (creative granularity)');
  console.log('  • Context Mining: 0.85-0.9 (diverse insights)');
}

// Run the test
testTemperatureSettings().catch(console.error);
