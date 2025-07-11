/**
 * Test Script: HTA Tree Generation Parameter Passing Fix
 * 
 * This script tests the parameter passing fix for the HTA tree generation
 * to ensure the goal parameter is correctly passed through the MCP intelligence bridge.
 */

import { Stage1CoreServer } from './___stage1/core-server.js';

async function testHTAParameterFix() {
  console.log('🔧 Testing HTA Parameter Fix\n');
  
  const server = new Stage1CoreServer({ dataDir: '.test-hta-param-fix' });
  await server.initialize();
  
  // Disable landing page for direct testing
  server.hasShownLandingPage = true;
  
  try {
    // Create a project with a clear goal
    console.log('📝 Creating project with clear goal...');
    
    const testGoal = 'Learn Python programming fundamentals';
    const projectResult = await server.projectManagement.createProject({
      goal: testGoal
    });
    console.log(`✅ Project created: ${projectResult.project_id}`);
    
    // Try to build HTA tree - this should now work with our debugging
    console.log('\n🌳 Testing HTA tree generation with parameter debugging...');
    console.log('🎯 Goal:', testGoal);
    
    const startTime = Date.now();
    
    try {
      const htaResult = await server.toolRouter.handleToolCall('build_hta_tree_forest', {
        goal: testGoal,
        context: 'Testing parameter passing fix',
        learning_style: 'mixed',
        focus_areas: ['basics', 'syntax', 'practice']
      });
      
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      
      console.log(`\n⏱️  Generation time: ${totalTime.toFixed(1)} seconds`);
      
      if (htaResult && htaResult.success) {
        console.log('✅ HTA tree generation SUCCEEDED!');
        console.log('📊 Result preview:');
        console.log('- Success:', htaResult.success);
        console.log('- Tasks count:', htaResult.tasks_count);
        console.log('- Strategic branches:', htaResult.strategic_branches);
        console.log('- Six-level architecture:', htaResult.six_level_architecture);
      } else {
        console.log('❌ HTA tree generation FAILED');
        if (htaResult && htaResult.content) {
          console.log('Error content:', htaResult.content[0]?.text);
        }
      }
      
    } catch (error) {
      console.error('❌ HTA generation error:', error.message);
      
      // Check if it's the old "goal is not defined" error
      if (error.message.includes('goal is not defined')) {
        console.error('🚨 STILL GETTING "goal is not defined" ERROR');
        console.error('This indicates the parameter fix needs more work');
      } else {
        console.error('📝 Different error - parameter fix may be working');
      }
    }
    
    // Test parameter extraction separately
    console.log('\n🔍 Testing parameter extraction...');
    const activeProject = await server.projectManagement.getActiveProject();
    const config = await server.dataPersistence.loadProjectData(activeProject.project_id, 'config.json');
    
    console.log('Project config goal:', config?.goal);
    console.log('Project config context:', config?.context);
    
    // Test bridge call directly
    console.log('\n🌉 Testing MCP bridge call...');
    if (server.htaCore?.claudeInterface) {
      try {
        const bridgeTest = await server.htaCore.claudeInterface.request({
          method: 'llm/completion',
          params: {
            goal: testGoal,
            user_goal: testGoal,
            learning_goal: testGoal,
            prompt: 'Test prompt',
            system: 'You are a test assistant',
            max_tokens: 100
          }
        });
        console.log('✅ Bridge call succeeded');
        console.log('Response type:', typeof bridgeTest);
      } catch (bridgeError) {
        console.error('❌ Bridge call failed:', bridgeError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n✨ Test completed');
}

// Run the test
testHTAParameterFix().catch(console.error);
