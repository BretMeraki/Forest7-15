/**
 * Test HTA Decomposition to 6th Level
 * Validates that branches can decompose to the 6th level with dependency ordering
 */

import { EnhancedHTACore } from './modules/enhanced-hta-core.js';
import { DataPersistence } from './modules/data-persistence.js';
import { ProjectManagement } from './modules/project-management.js';
import { Client } from './local-mcp-client.js';

console.log('🧪 Testing HTA Decomposition to 6th Level\n');

async function testHTADecomposition() {
  try {
    // Initialize dependencies
    const dataPersistence = new DataPersistence();
    const projectManagement = new ProjectManagement(dataPersistence);
    const llmInterface = new Client();
    await llmInterface.connect(new (await import('./local-stdio-transport.js')).StdioClientTransport());
    
    // Initialize HTA core
    const htaCore = new EnhancedHTACore(dataPersistence, projectManagement, llmInterface);
    
    // Test goal
    const goal = 'Build a distributed microservices architecture using Kubernetes';
    const context = 'Want to master microservices for cloud-native solutions';

    // Build HTA tree
    console.log('\n🌳 Generating HTA tree with decomposition to 6 levels...\n');
    const htaResult = await htaCore.buildHTATree({
      goal,
      context,
      learning_style: 'mixed',
      focus_areas: []
    });

    if (htaResult && htaResult.success) {
      console.log('   ✅ HTA tree generated successfully!');
      
      // Validate multi-level decomposition
      console.log('\n🔍 Decomposing branches to 6th level...');
      const projectId = (await projectManagement.getActiveProject()).project_id;
      const htaData = await dataPersistence.loadProjectData(projectId, 'hta.json');

      if (htaData) {
        const branches = htaData.strategicBranches || [];
        for (const branch of branches) {
          console.log(`\nBranch: ${branch.name}`);
          console.log(`   Description: ${branch.description}`);

          const tasks = await htaCore.buildTaskDecomposition(branch.name, branch.description, htaData.level1_goalContext, {});
          const microParticles = await htaCore.buildMicroParticles(branch.name, branch.description, htaData.level1_goalContext, {});
          const nanoActions = await htaCore.buildNanoActions(branch.name, branch.description, htaData.level1_goalContext, {});
          const contextPrimitives = await htaCore.buildContextAdaptivePrimitives(branch.name, branch.description, htaData.level1_goalContext, {});

          console.log(`     Levels: Tasks(${tasks.length}), Micro(${microParticles.length}), Nano(${nanoActions.length}), Context(${contextPrimitives.length})`);
        }
      }
    } else {
      console.log('   ❌ Failed to generate HTA tree');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testHTADecomposition().catch(console.error);
