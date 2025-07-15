/**
 * Interactive HTA Generation Test
 * Allows testing with any custom goal to verify dynamic generation
 */

import { EnhancedHTACore } from './modules/enhanced-hta-core.js';
import { DataPersistence } from './modules/data-persistence.js';
import { ProjectManagement } from './modules/project-management.js';
import { Client } from './local-mcp-client.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

console.log('🧪 Interactive Dynamic HTA Generation Test\n');
console.log('This test allows you to enter any goal and see how the system generates');
console.log('a dynamic, context-aware HTA tree without hardcoding.\n');

async function testInteractiveHTA() {
  try {
    // Initialize dependencies
    const dataPersistence = new DataPersistence();
    const projectManagement = new ProjectManagement(dataPersistence);
    const llmInterface = new Client();
    const htaCore = new EnhancedHTACore(dataPersistence, projectManagement, llmInterface);
    
    // Get user input
    const goal = await question('Enter your learning goal: ');
    const context = await question('Enter additional context (or press Enter to skip): ');
    const learningStyle = await question('Enter learning style (hands-on/theoretical/mixed) [default: mixed]: ') || 'mixed';
    
    console.log('\n🌳 Generating dynamic HTA tree for your goal...\n');
    
    // Create a test project
    const projectName = `test-interactive-${Date.now()}`;
await projectManagement.createProject({
      project_name: projectName,
      goal: goal,
      context: context || ''
    });

    // Connect the client (simulate connection)
    await llmInterface.connect(new (await import('./local-stdio-transport.js')).StdioClientTransport());
    
    
    // Build HTA tree
    const startTime = Date.now();
    const htaResult = await htaCore.buildHTATree({
      goal: goal,
      context: context || '',
      learning_style: learningStyle,
      focus_areas: []
    });
    const generationTime = Date.now() - startTime;
    
    console.log(`\n⏱️  Generation completed in ${generationTime}ms\n`);
    
    // Analyze and display results
    if (htaResult && htaResult.success !== false) {
      console.log('✅ HTA tree generated successfully!\n');
      
      // Load the generated HTA data
      const projectId = (await projectManagement.getActiveProject()).project_id;
      const htaData = await dataPersistence.loadProjectData(projectId, 'hta.json');
      
      if (htaData) {
        // Display goal analysis
        console.log('🎯 GOAL ANALYSIS:');
        console.log(`Goal: "${goal}"`);
        if (htaData.goalCharacteristics) {
          console.log(`Complexity: ${htaData.goalCharacteristics.complexity || 'Not assessed'}`);
          console.log(`Characteristics: ${(htaData.goalCharacteristics.characteristics || []).join(', ')}`);
          console.log(`Domain Archetype: ${htaData.domainArchetype?.name || 'General'}`);
        }
        
        // Display strategic branches
        console.log('\n🌿 STRATEGIC BRANCHES:');
        if (htaData.strategicBranches && htaData.strategicBranches.length > 0) {
          htaData.strategicBranches.forEach((branch, index) => {
            console.log(`\n${index + 1}. ${branch.name}`);
            console.log(`   Description: ${branch.description || 'No description'}`);
            console.log(`   Focus: ${branch.focus || 'balanced'}`);
            if (branch.characteristics) {
              const chars = Object.entries(branch.characteristics)
                .filter(([key, value]) => value === true)
                .map(([key]) => key.replace(/_/g, ' '));
              if (chars.length > 0) {
                console.log(`   Characteristics: ${chars.join(', ')}`);
              }
            }
          });
        } else {
          console.log('No strategic branches generated');
        }
        
        // Display sample tasks
        console.log('\n📝 SAMPLE FRONTIER TASKS:');
        if (htaData.frontierNodes && htaData.frontierNodes.length > 0) {
          console.log(`Total tasks generated: ${htaData.frontierNodes.length}\n`);
          htaData.frontierNodes.slice(0, 5).forEach((task, index) => {
            console.log(`${index + 1}. ${task.title}`);
            console.log(`   Branch: ${task.branch || 'Unknown'}`);
            console.log(`   Duration: ${task.duration || 'Not specified'}`);
            console.log(`   Difficulty: ${task.difficulty || 'Not specified'}/5`);
            if (task.description) {
              console.log(`   Description: ${task.description.substring(0, 100)}...`);
            }
            console.log('');
          });
          
          if (htaData.frontierNodes.length > 5) {
            console.log(`... and ${htaData.frontierNodes.length - 5} more tasks`);
          }
        } else {
          console.log('No tasks generated');
        }
        
        // Analysis of dynamic generation
        console.log('\n🔍 DYNAMIC GENERATION ANALYSIS:');
        
        // Check for generic patterns
        const genericBranchPatterns = ['Foundation', 'Research', 'Implementation', 'Mastery', 'Capability'];
        const genericTaskPatterns = ['Learn basics', 'Study fundamentals', 'Practice skills', 'Apply knowledge'];
        
        const hasGenericBranches = htaData.strategicBranches?.some(branch => 
          genericBranchPatterns.some(pattern => branch.name === pattern)
        );
        
        const hasGenericTasks = htaData.frontierNodes?.some(task => 
          genericTaskPatterns.some(pattern => task.title.toLowerCase().includes(pattern.toLowerCase()))
        );
        
        if (!hasGenericBranches && !hasGenericTasks) {
          console.log('✅ Excellent! The generated content appears to be highly specific to your goal.');
          console.log('   No generic patterns detected in branches or tasks.');
        } else {
          if (hasGenericBranches) {
            console.log('⚠️  Some generic branch names detected. This might indicate partial hardcoding.');
          }
          if (hasGenericTasks) {
            console.log('⚠️  Some generic task patterns detected. Consider reviewing task generation.');
          }
        }
        
        // Check goal-specific terminology
        const goalWords = goal.toLowerCase().split(/\s+/).filter(word => word.length > 3);
        const branchText = htaData.strategicBranches?.map(b => b.name + ' ' + b.description).join(' ').toLowerCase() || '';
        const taskText = htaData.frontierNodes?.map(t => t.title + ' ' + (t.description || '')).join(' ').toLowerCase() || '';
        
        const goalWordMatches = goalWords.filter(word => 
          branchText.includes(word) || taskText.includes(word)
        );
        
        const terminologyScore = goalWords.length > 0 ? 
          (goalWordMatches.length / goalWords.length) * 100 : 0;
        
        console.log(`\n📊 Goal-specific terminology usage: ${terminologyScore.toFixed(1)}%`);
        if (terminologyScore > 70) {
          console.log('   ✅ High correlation with goal terminology - good dynamic adaptation!');
        } else if (terminologyScore > 40) {
          console.log('   ⚠️  Moderate correlation - could be more goal-specific');
        } else {
          console.log('   ❌ Low correlation - may need to improve dynamic generation');
        }
        
      }
    } else {
      console.log('❌ Failed to generate HTA tree');
      if (htaResult && htaResult.error) {
        console.log(`Error: ${htaResult.error}`);
      }
    }
    
    // Clean up
    await projectManagement.deleteProject({ project_id: projectName });
    
    // Ask if user wants to test another goal
    const again = await question('\nWould you like to test another goal? (y/n): ');
    if (again.toLowerCase() === 'y') {
      console.log('\n' + '='.repeat(60) + '\n');
      await testInteractiveHTA();
    } else {
      console.log('\n✨ Test complete! The system should generate unique content for each goal.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    rl.close();
  }
}

// Run the interactive test
testInteractiveHTA().catch(console.error);
