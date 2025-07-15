/**
 * Test Dynamic HTA Generation
 * Validates that the system generates adaptive, context-aware HTA trees without hardcoding
 */

import { EnhancedHTACore } from './modules/enhanced-hta-core.js';
import { DataPersistence } from './modules/data-persistence.js';
import { ProjectManagement } from './modules/project-management.js';
import { Client } from './local-mcp-client.js';

console.log('🧪 Testing Dynamic HTA Generation Without Hardcoding\n');

async function testDynamicHTAGeneration() {
  try {
    // Initialize dependencies
    const dataPersistence = new DataPersistence();
    const projectManagement = new ProjectManagement(dataPersistence);
    const llmInterface = new Client();
    // Connect the client (simulate connection)
await llmInterface.connect(new (await import('./local-stdio-transport.js')).StdioClientTransport());
    
    // Initialize Enhanced HTA Core
    const htaCore = new EnhancedHTACore(dataPersistence, projectManagement, llmInterface);
    
    // Test cases with diverse goals to verify no hardcoding
    const testCases = [
      {
        name: 'Technical Goal',
        goal: 'Build a distributed microservices architecture using Kubernetes',
        context: 'I want to learn modern cloud-native development practices',
        expectedCharacteristics: ['technical', 'system-building', 'infrastructure']
      },
      {
        name: 'Creative Goal',
        goal: 'Master watercolor painting techniques for landscape art',
        context: 'I want to express myself artistically and create beautiful paintings',
        expectedCharacteristics: ['creative', 'artistic', 'skill-based']
      },
      {
        name: 'Business Goal',
        goal: 'Launch a sustainable e-commerce business selling eco-friendly products',
        context: 'I want to build a business that makes a positive environmental impact',
        expectedCharacteristics: ['business', 'entrepreneurial', 'market-focused']
      },
      {
        name: 'Unique/Unusual Goal',
        goal: 'Become proficient in medieval blacksmithing techniques',
        context: 'I want to learn traditional craftsmanship and create functional metal items',
        expectedCharacteristics: ['craft', 'hands-on', 'traditional']
      }
    ];
    
    console.log('📋 Running tests on diverse goals to ensure dynamic generation...\n');
    
    for (const testCase of testCases) {
      console.log(`\n🎯 Test: ${testCase.name}`);
      console.log(`   Goal: "${testCase.goal}"`);
      console.log(`   Context: "${testCase.context}"`);
      
      try {
        // Create a test project
        const projectName = `test-dynamic-${testCase.name.toLowerCase().replace(/\s+/g, '-')}`;
        await projectManagement.createProject({
          project_name: projectName,
          goal: testCase.goal,
          context: testCase.context
        });
        
        // Build HTA tree
        console.log('\n   🌳 Generating HTA tree...');
        const htaResult = await htaCore.buildHTATree({
          goal: testCase.goal,
          context: testCase.context,
          learning_style: 'mixed',
          focus_areas: []
        });
        
        // Validate the result
        if (htaResult && htaResult.success !== false) {
          console.log('   ✅ HTA tree generated successfully');
          
          // Load the generated HTA data
          const projectId = (await projectManagement.getActiveProject()).project_id;
          const htaData = await dataPersistence.loadProjectData(projectId, 'hta.json');
          
          if (htaData) {
            // Analyze generated branches for uniqueness
            console.log('\n   📊 Analyzing generated branches:');
            if (htaData.strategicBranches && htaData.strategicBranches.length > 0) {
              htaData.strategicBranches.forEach((branch, index) => {
                console.log(`      ${index + 1}. ${branch.name} - ${branch.description || 'No description'}`);
              });
              
              // Check for generic/hardcoded patterns
              const genericPatterns = ['Foundation', 'Research', 'Implementation', 'Mastery', 'Capability'];
              const hasGenericPatterns = htaData.strategicBranches.some(branch => 
                genericPatterns.includes(branch.name)
              );
              
              if (hasGenericPatterns) {
                console.log('   ⚠️  WARNING: Generic patterns detected - may indicate hardcoding');
              } else {
                console.log('   ✅ Branches appear to be dynamically generated for this specific goal');
              }
            }
            
            // Analyze frontier tasks
            if (htaData.frontierNodes && htaData.frontierNodes.length > 0) {
              console.log(`\n   📝 Generated ${htaData.frontierNodes.length} frontier tasks`);
              console.log('   Sample tasks:');
              htaData.frontierNodes.slice(0, 3).forEach((task, index) => {
                console.log(`      - ${task.title}`);
              });
            }
            
            // Check goal characteristics detection
            if (htaData.goalCharacteristics) {
              console.log('\n   🔍 Goal characteristics detected:');
              console.log(`      Complexity: ${htaData.goalCharacteristics.complexity || 'Not assessed'}`);
              console.log(`      Characteristics: ${(htaData.goalCharacteristics.characteristics || []).join(', ')}`);
            }
          }
        } else {
          console.log('   ❌ Failed to generate HTA tree');
          if (htaResult && htaResult.error) {
            console.log(`      Error: ${htaResult.error}`);
          }
        }
        
        // Clean up test project
        await projectManagement.deleteProject({ project_id: projectName });
        
      } catch (error) {
        console.error(`   ❌ Test failed: ${error.message}`);
      }
    }
    
    console.log('\n\n📊 Test Summary:');
    console.log('The system should generate unique, goal-specific branches and tasks for each test case.');
    console.log('If you see similar or generic patterns across different goals, there may be hardcoding issues.');
    console.log('\n✨ Dynamic generation indicators to look for:');
    console.log('   - Branch names that reflect the specific domain (e.g., "Kubernetes Orchestration" vs generic "Implementation")');
    console.log('   - Task descriptions that incorporate goal-specific terminology');
    console.log('   - Different branch structures for different types of goals');
    console.log('   - Context-aware adaptations based on the provided context');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testDynamicHTAGeneration().catch(console.error);
