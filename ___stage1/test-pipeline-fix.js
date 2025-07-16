import { NextPipelinePresenter } from './modules/next-pipeline-presenter.js';
import { DataPersistence } from './modules/data-persistence.js';
import { HTAVectorStore } from './modules/hta-vector-store.js';
import { TaskStrategyOrchestrator } from './modules/task-strategy-orchestrator.js';
import { EnhancedHTACore } from './modules/enhanced-hta-core.js';

// Create minimal test setup
const dataPersistence = new DataPersistence();
const vectorStore = new HTAVectorStore();
const taskStrategyCore = new TaskStrategyOrchestrator();
const htaCore = new EnhancedHTACore();

const presenter = new NextPipelinePresenter(dataPersistence, vectorStore, taskStrategyCore, htaCore);

// Test the method
const params = {
  projectId: 'test-project',
  energyLevel: 4,
  timeAvailable: 60
};

presenter.generateNextPipeline(params).then(result => {
  console.log('Pipeline result:', {
    success: result.success,
    hasTasks: result.tasks !== undefined,
    taskCount: result.tasks ? result.tasks.length : 0,
    hasContent: result.content !== undefined
  });
}).catch(error => {
  console.error('Error:', error.message);
});