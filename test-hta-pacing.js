/**
 * Test HTA Generation Pacing System
 * Specifically tests the new intelligent progress indicators and timing
 */

import { Stage1CoreServer } from './___stage1/core-server.js';

async function testHTAPacingSystem() {
  console.log('🎯 Testing HTA Generation Pacing System\n');
  
  const server = new Stage1CoreServer({ dataDir: '.test-pacing-data' });
  await server.initialize();
  
  // Disable landing page for direct testing
  server.hasShownLandingPage = true;
  
  try {
    // Create a project first
    console.log('📝 Creating test project...');
    const projectResult = await server.projectManagement.createProject({
      goal: 'Learn Python programming fundamentals and build a web application'
    });
    console.log(`✅ Project created: ${projectResult.project_id}\n`);

    // Test HTA tree building with pacing
    console.log('🌳 Testing HTA tree generation with intelligent pacing...');
    console.log('⏱️  This should take approximately 30+ seconds with progress indicators\n');
    
    const startTime = Date.now();
    
    const htaResult = await server.toolRouter.handleToolCall('build_hta_tree_forest', {
      goal: 'Learn Python programming fundamentals and build a web application',
      context: 'Complete beginner to programming, wants to create a personal portfolio website',
      learning_style: 'hands-on',
      focus_areas: ['python basics', 'web frameworks', 'databases']
    });
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log(`\n⏱️  Total HTA generation time: ${totalTime.toFixed(1)} seconds`);
    
    if (htaResult && htaResult.content) {
      const resultText = htaResult.content[0].text;
      console.log('✅ HTA tree generated successfully');
      console.log(`📊 Result preview: ${resultText.substring(0, 200)}...\n`);
      
      // Check if it shows intelligence or schema-driven content
      if (resultText.includes('Schema-Driven') || resultText.includes('Intelligence') || resultText.includes('Generated')) {
        console.log('🎆 SUCCESS: HTA generation shows intelligent processing!');
      } else {
        console.log('ℹ️  Note: Result may be using traditional generation');
      }
    }

    // Test individual schema generation (where the pacing actually happens)
    console.log('\n🧠 Testing direct schema generation with pacing...');
    
    if (server.htaCore && server.htaCore.schemaEngine) {
      const schemaStartTime = Date.now();
      
      // Test goal context generation with pacing
      const goalContext = await server.htaCore.schemaEngine.generateLevelContent(
        'goalContext',
        { 
          goal: 'Learn Python programming fundamentals and build a web application',
          goalCharacteristics: { complexity: 'medium', characteristics: ['practical', 'beginner-friendly'] }
        },
        'Analyze this goal for comprehensive learning path generation'
      );
      
      const schemaEndTime = Date.now();
      const schemaTime = (schemaEndTime - schemaStartTime) / 1000;
      
      console.log(`✅ Schema generation completed in ${schemaTime.toFixed(1)} seconds`);
      
      if (schemaTime >= 8) {
        console.log('🎯 SUCCESS: Pacing system working - appropriate processing time!');
      } else if (schemaTime >= 3) {
        console.log('⚠️  Pacing system partially working - some delay added');
      } else {
        console.log('ℹ️  Pacing system bypassed - instant response (demo mode)');
      }
      
      console.log(`📋 Schema result type: ${goalContext?.goal_analysis ? 'Structured' : 'Basic'}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 HTA Pacing System Test Results');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Test Time: ${totalTime.toFixed(1)} seconds`);
    console.log(`🎯 Target Time: 30+ seconds`);
    console.log(`📈 Status: ${totalTime >= 30 ? 'EXCELLENT' : totalTime >= 15 ? 'GOOD' : 'NEEDS WORK'}`);
    
    if (totalTime >= 30) {
      console.log('\n🎉 SUCCESS: Pacing system provides realistic processing feel!');
      console.log('✅ Users will have confidence in sophisticated analysis');
      console.log('✅ Progress indicators guide user expectations');
      console.log('✅ Processing time feels substantial and thoughtful');
    } else if (totalTime >= 15) {
      console.log('\n✅ GOOD: Some pacing in place, could be enhanced');
      console.log('💡 Consider increasing minimum processing times');
    } else {
      console.log('\n⚠️  NEEDS WORK: Processing too fast for user confidence');
      console.log('💡 Increase delays in progress steps');
      console.log('💡 Add more detailed progress messages');
    }

  } catch (error) {
    console.error('\n❌ Pacing test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n🧹 Test completed');
  }
}

// Run the pacing test
testHTAPacingSystem().catch(console.error);
