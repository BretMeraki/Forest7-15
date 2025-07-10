/**
 * Test HTA with a Unique Goal and Rich Context
 * Goal: Former chef transitioning to become a freelance UX/UI designer
 */

import { Stage1CoreServer } from './___stage1/core-server.js';

async function testUniqueGoalWithContext() {
  console.log('🎯 Testing HTA with Unique Goal and Rich Context\n');
  
  const server = new Stage1CoreServer({ dataDir: '.test-unique-goal-data' });
  await server.initialize();
  
  // Disable landing page for direct testing
  server.hasShownLandingPage = true;
  
  try {
    // Create a project with a unique, contextually rich goal
    console.log('📝 Creating project with unique career transition goal...');
    
    const uniqueGoal = 'Transition from professional chef to freelance UX/UI designer within 8 months';
    const richContext = `Background: 10 years as a professional chef in high-end restaurants, burned out from kitchen stress. 
    Has strong visual sense from food plating and presentation. Comfortable with technology but no formal design training. 
    Single parent with limited evening/weekend time. Budget constraints mean preferring free/low-cost learning resources. 
    Goal is to build a portfolio and land first freelance clients by month 8. Interested in designing for food/hospitality industry initially.`;
    
    const projectResult = await server.projectManagement.createProject({
      goal: uniqueGoal
    });
    console.log(`✅ Project created: ${projectResult.project_id}\n`);

    // Test HTA tree building with rich context
    console.log('🌳 Generating HTA tree for career transition with constraints...');
    console.log('📋 Goal:', uniqueGoal);
    console.log('🎭 Context:', richContext.substring(0, 100) + '...\n');
    
    const startTime = Date.now();
    
    const htaResult = await server.toolRouter.handleToolCall('build_hta_tree_forest', {
      goal: uniqueGoal,
      context: richContext,
      learning_style: 'visual-practical',
      focus_areas: ['design fundamentals', 'portfolio building', 'client acquisition'],
      constraints: {
        time: 'limited evenings/weekends only',
        budget: 'minimal - prefer free resources',
        timeline: '8 months to first clients'
      },
      background: {
        profession: 'professional chef',
        experience_years: 10,
        transferable_skills: ['visual presentation', 'attention to detail', 'client service'],
        technology_comfort: 'intermediate'
      },
      target_specialization: 'food and hospitality industry design'
    });
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log(`\n⏱️  Total generation time: ${totalTime.toFixed(1)} seconds`);
    
    if (htaResult && htaResult.content) {
      const resultText = htaResult.content[0].text;
      console.log('✅ HTA tree generated successfully');
      console.log('📊 Generated content preview:');
      console.log('=' .repeat(60));
      console.log(resultText);
      console.log('=' .repeat(60));
      
      // Analyze the generated content for domain-specific elements
      console.log('\n🔍 Analyzing generated content...');
      
      // Check for UX/UI design terms
      const designTerms = ['ux', 'ui', 'design', 'wireframe', 'prototype', 'user', 'interface', 'figma', 'adobe', 'sketch'];
      const foundDesignTerms = designTerms.filter(term => 
        resultText.toLowerCase().includes(term)
      );
      
      // Check for career transition awareness
      const transitionTerms = ['portfolio', 'freelance', 'client', 'career', 'transition', 'chef', 'background'];
      const foundTransitionTerms = transitionTerms.filter(term => 
        resultText.toLowerCase().includes(term)
      );
      
      // Check for constraint awareness (time, budget)
      const constraintTerms = ['time', 'budget', 'evening', 'weekend', 'free', 'cost', 'month'];
      const foundConstraintTerms = constraintTerms.filter(term => 
        resultText.toLowerCase().includes(term)
      );
      
      console.log(`🎨 Design-related terms found: ${foundDesignTerms.length > 0 ? foundDesignTerms.join(', ') : 'None'}`);
      console.log(`🔄 Career transition terms found: ${foundTransitionTerms.length > 0 ? foundTransitionTerms.join(', ') : 'None'}`);
      console.log(`⏰ Constraint awareness terms found: ${foundConstraintTerms.length > 0 ? foundConstraintTerms.join(', ') : 'None'}`);
      
      // Evaluate context integration
      let contextScore = 0;
      if (foundDesignTerms.length >= 3) contextScore += 3;
      if (foundTransitionTerms.length >= 2) contextScore += 2;
      if (foundConstraintTerms.length >= 2) contextScore += 2;
      
      console.log(`\n📈 Context Integration Score: ${contextScore}/7`);
      
      if (contextScore >= 6) {
        console.log('🎉 EXCELLENT: High context awareness in generated content!');
      } else if (contextScore >= 4) {
        console.log('✅ GOOD: Moderate context integration');
      } else {
        console.log('⚠️  NEEDS WORK: Limited context integration');
      }
      
      // Check if it still has meta-system contamination
      const metaTerms = ['mcp bridge', 'schema', 'vector', 'intelligence bridge'];
      const foundMetaTerms = metaTerms.filter(term => 
        resultText.toLowerCase().includes(term)
      );
      
      if (foundMetaTerms.length === 0) {
        console.log('✅ No meta-system contamination detected');
      } else {
        console.log(`⚠️  Found meta-system terms: ${foundMetaTerms.join(', ')}`);
      }
    }

    // Additional test: Check if tasks are contextually appropriate
    console.log('\n🎯 Summary of Test Results:');
    console.log('================================');
    console.log(`Goal: Career transition from chef to UX/UI designer`);
    console.log(`Context richness: High (background, constraints, timeline)`);
    console.log(`Generation time: ${totalTime.toFixed(1)}s`);
    console.log(`Expected: Design-focused tasks with career transition awareness`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n🧹 Test completed');
  }
}

// Run the test
testUniqueGoalWithContext().catch(console.error);
