/**
 * Vectorized Handlers - Extracted from core server
 * 
 * Handles all vectorized task operations and ChromaDB management
 */

export class VectorizedHandlers {
  constructor(forestDataVectorization, taskStrategyCore, projectManagement, chromaDBLifecycle) {
    this.forestDataVectorization = forestDataVectorization;
    this.taskStrategyCore = taskStrategyCore;
    this.projectManagement = projectManagement;
    this.chromaDBLifecycle = chromaDBLifecycle;
  }

  /**
   * VECTORIZED NEXT TASK - Uses semantic search for context-aware task selection
   */
  async getNextTaskVectorized(args) {
    try {
      console.error('[VectorizedTask] Starting context-aware task selection...');
      
      const activeProject = await this.projectManagement.getActiveProject();
      if (!activeProject || !activeProject.project_id) {
        return {
          content: [{ type: 'text', text: '**No Active Project** ❌\n\nCreate or switch to a project first.' }]
        };
      }
      
      const projectId = activeProject.project_id;
      const contextFromMemory = args.context_from_memory || args.contextFromMemory || '';
      const energyLevel = args.energy_level || args.energyLevel || 3;
      const timeAvailable = args.time_available || args.timeAvailable || '30 minutes';
      
      // Try adaptive task recommendation using vectorization first
      try {
        const semanticTasks = await this.forestDataVectorization.adaptiveTaskRecommendation(
          projectId,
          contextFromMemory,
          energyLevel,
          timeAvailable
        );
        
        if (semanticTasks && semanticTasks.length > 0) {
          console.error(`[VectorizedTask] ✅ Found ${semanticTasks.length} context-aware tasks`);
          
          // Format the best semantic match
          const bestMatch = semanticTasks[0];
          const taskMetadata = bestMatch.enriched_metadata || {};
          
          return {
            content: [{
              type: 'text',
              text: `🎯 **Context-Aware Task Selected**\n\n` +
                    `**Task**: ${bestMatch.metadata.title || 'Semantic Task'}\n` +
                    `**Description**: ${bestMatch.metadata.description || 'AI-selected based on your context'}\n` +
                    `**Similarity Score**: ${(bestMatch.score * 100).toFixed(1)}%\n` +
                    `**Difficulty**: ${taskMetadata.difficulty || energyLevel}/5\n` +
                    `**Duration**: ${taskMetadata.duration || timeAvailable}\n\n` +
                    `**Why this task?** Selected using semantic analysis of your context: "${contextFromMemory}"\n\n` +
                    `This task matches your current energy level (${energyLevel}/5) and available time (${timeAvailable}).\n\n` +
                    `**Context Enhancement**: Your specific situation has been considered in this recommendation.`
            }],
            task_info: {
              task_id: bestMatch.metadata.task_id,
              similarity_score: bestMatch.score,
              vectorized: true,
              semantic_match: true
            }
          };
        }
      } catch (vectorError) {
        console.error('[VectorizedTask] ⚠️ Semantic task selection failed, falling back to traditional:', vectorError.message);
        
        // Check if this is a ChromaDB corruption issue
        if (vectorError.message && (
            vectorError.message.includes('status: 500') ||
            vectorError.message.includes('CHROMADB_CORRUPTION') ||
            vectorError.message.includes('tolist') ||
            vectorError.message.includes('Internal Server Error')
        )) {
          console.error('[VectorizedTask] 🔥 ChromaDB corruption detected - automatic recovery should trigger');
        }
      }
      
      // Fallback to traditional task selection
      const traditionalResult = await this.taskStrategyCore.getNextTask(args);
      
      // Enhance traditional result with note about vectorization
      if (traditionalResult && traditionalResult.content && traditionalResult.content[0]) {
        traditionalResult.content[0].text += '\n\n*Note: Using traditional task selection (semantic enhancement available after vectorization)*';
      }
      
      return traditionalResult;
      
    } catch (error) {
      console.error('[VectorizedTask] Task selection failed:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ **Task Selection Failed**\n\nError: ${error.message}\n\nPlease check your project configuration and try again.`
        }]
      };
    }
  }

  /**
   * VECTORIZED BLOCK COMPLETION - Captures learning insights for semantic analysis
   */
  async completeBlockVectorized(args) {
    try {
      // Complete the block using traditional method first
      const traditionalResult = await this.taskStrategyCore.handleBlockCompletion(args);
      
      // Extract learning insights for vectorization
      const activeProject = await this.projectManagement.getActiveProject();
      if (activeProject && activeProject.project_id && args.learned) {
        const projectId = activeProject.project_id;
        
        try {
          // Create learning event for vectorization
          const learningEvent = {
            id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'task_completion',
            description: `Completed task: ${args.block_id || 'Unknown task'}`,
            outcome: args.outcome || 'Task completed',
            insights: args.learned || '',
            breakthroughLevel: this.assessBreakthroughLevel(args),
            taskId: args.block_id,
            timestamp: new Date().toISOString()
          };
          
          // Vectorize the learning event
          await this.forestDataVectorization.vectorizeLearningHistory(projectId, [learningEvent]);
          
          // Check if this was a breakthrough for special vectorization
          if (args.breakthrough || this.assessBreakthroughLevel(args) >= 4) {
            const breakthroughInsight = {
              id: `breakthrough_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: args.learned,
              context: `Task completion: ${args.outcome}`,
              impact: args.breakthrough ? 'high' : 'medium',
              impactLevel: this.assessBreakthroughLevel(args),
              relatedTasks: [args.block_id],
              knowledgeDomain: this.extractDomain(args.learned || args.outcome || ''),
              timestamp: new Date().toISOString()
            };
            
            await this.forestDataVectorization.vectorizeBreakthroughInsight(projectId, breakthroughInsight);
            
            console.error(`[VectorizedCompletion] ✅ Breakthrough insight vectorized for future semantic recommendations`);
          }
          
          console.error(`[VectorizedCompletion] ✅ Learning event vectorized for adaptive recommendations`);
          
          // Enhance traditional result with vectorization note
          if (traditionalResult && traditionalResult.content && traditionalResult.content[0]) {
            traditionalResult.content[0].text += '\n\n*🧠 Learning insights captured for semantic enhancement of future recommendations*';
          }
          
        } catch (vectorError) {
          console.error('[VectorizedCompletion] ⚠️ Learning vectorization failed:', vectorError.message);
        }
      }
      
      return traditionalResult;
      
    } catch (error) {
      console.error('[VectorizedCompletion] Block completion failed:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ **Block Completion Failed**\n\nError: ${error.message}\n\nPlease try again.`
        }]
      };
    }
  }

  /**
   * Get vectorization status and analytics
   */
  async getVectorizationStatus(args) {
    try {
      const activeProject = await this.projectManagement.getActiveProject();
      if (!activeProject || !activeProject.project_id) {
        return {
          content: [{
            type: 'text',
            text: '**No Active Project** ❌\n\nCreate or switch to a project first to check vectorization status.'
          }]
        };
      }

      const projectId = activeProject.project_id;
      const status = await this.forestDataVectorization.getVectorizationStatus(projectId);
      
      return {
        content: [{
          type: 'text',
          text: `**📊 Vectorization Status**\n\n` +
                `**Project**: ${activeProject.goal || 'Unknown'}\n` +
                `**Status**: ${status.isVectorized ? '✅ Vectorized' : '❌ Not Vectorized'}\n` +
                `**Vector Count**: ${status.vectorCount || 0}\n` +
                `**Last Updated**: ${status.lastUpdated || 'Never'}\n\n` +
                `**Available Operations**:\n` +
                `• Semantic task recommendations\n` +
                `• Context-aware learning paths\n` +
                `• Breakthrough insight analysis\n` +
                `• Adaptive difficulty adjustment`
        }],
        vectorization_status: status
      };
    } catch (error) {
      console.error('VectorizedHandlers.getVectorizationStatus failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**❌ Vectorization Status Check Failed**\n\nError: ${error.message}\n\nPlease check the system status and try again.`
        }],
        error: error.message
      };
    }
  }

  /**
   * Vectorize project data manually
   */
  async vectorizeProjectData(args) {
    try {
      const activeProject = await this.projectManagement.getActiveProject();
      if (!activeProject || !activeProject.project_id) {
        return {
          content: [{
            type: 'text',
            text: '**No Active Project** ❌\n\nCreate or switch to a project first to vectorize data.'
          }]
        };
      }

      const projectId = activeProject.project_id;
      const result = await this.forestDataVectorization.vectorizeProjectData(projectId);
      
      if (result.success) {
        return {
          content: [{
            type: 'text',
            text: `**✅ Project Data Vectorized**\n\n` +
                  `**Project**: ${activeProject.goal || 'Unknown'}\n` +
                  `**Vectors Created**: ${result.vectorCount || 0}\n` +
                  `**Data Types**: ${result.dataTypes?.join(', ') || 'Unknown'}\n\n` +
                  `**Enhanced Features Now Available**:\n` +
                  `• Semantic task recommendations\n` +
                  `• Context-aware learning paths\n` +
                  `• Breakthrough insight analysis\n` +
                  `• Adaptive difficulty adjustment\n\n` +
                  `Use \`get_next_task_forest\` to experience semantic task selection.`
          }],
          vectorization_result: result
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: `**❌ Vectorization Failed**\n\nError: ${result.error || 'Unknown error'}\n\nPlease check the system status and try again.`
          }],
          error: result.error
        };
      }
    } catch (error) {
      console.error('VectorizedHandlers.vectorizeProjectData failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**❌ Project Data Vectorization Failed**\n\nError: ${error.message}\n\nPlease check the system status and try again.`
        }],
        error: error.message
      };
    }
  }

  /**
   * Get ChromaDB status
   */
  async getChromaDBStatus(args) {
    try {
      if (!this.chromaDBLifecycle) {
        return {
          content: [{
            type: 'text',
            text: '**ChromaDB Not Configured** ℹ️\n\nChromaDB is not enabled for this Forest instance.\n\nVector provider: ' + (process.env.FOREST_VECTOR_PROVIDER || 'sqlitevec')
          }],
          chromadb_enabled: false
        };
      }

      const status = this.chromaDBLifecycle.getStatus();
      
      const statusText = status.isRunning ? '🟢 Running' : 
                        status.isStarting ? '🟡 Starting' : 
                        status.hasError ? '🔴 Error' : '⚪ Stopped';
      
      return {
        content: [{
          type: 'text',
          text: `**🗄️ ChromaDB Status**\n\n` +
                `**Status**: ${statusText}\n` +
                `**Port**: ${status.port || 'Unknown'}\n` +
                `**PID**: ${status.pid || 'Not running'}\n` +
                `**Uptime**: ${status.uptime || 'N/A'}\n` +
                `**Data Directory**: ${status.dataDir || 'Unknown'}\n` +
                `**Health**: ${status.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n\n` +
                `${status.hasError ? `**Error**: ${status.error}\n\n` : ''}` +
                `**Available Actions**:\n` +
                `• \`restart_chromadb_forest\` - Restart ChromaDB server\n` +
                `• \`get_vectorization_status_forest\` - Check vectorization status`
        }],
        chromadb_status: status
      };
    } catch (error) {
      console.error('VectorizedHandlers.getChromaDBStatus failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**❌ ChromaDB Status Check Failed**\n\nError: ${error.message}\n\nPlease check the system status and try again.`
        }],
        error: error.message
      };
    }
  }

  /**
   * Restart ChromaDB server
   */
  async restartChromaDB(args) {
    try {
      if (!this.chromaDBLifecycle) {
        return {
          content: [{
            type: 'text',
            text: '**ChromaDB Not Configured** ℹ️\n\nChromaDB is not enabled for this Forest instance.\n\nVector provider: ' + (process.env.FOREST_VECTOR_PROVIDER || 'sqlitevec')
          }],
          chromadb_enabled: false
        };
      }

      console.error('🔄 Restarting ChromaDB server...');
      const result = await this.chromaDBLifecycle.restart();
      
      if (result.success) {
        return {
          content: [{
            type: 'text',
            text: `**✅ ChromaDB Restarted Successfully**\n\n` +
                  `**Status**: 🟢 Running\n` +
                  `**Port**: ${result.port || 'Unknown'}\n` +
                  `**PID**: ${result.pid || 'Unknown'}\n` +
                  `**Startup Time**: ${result.startupTime || 'Unknown'}ms\n\n` +
                  `**Next Steps**:\n` +
                  `• Vector operations should now work normally\n` +
                  `• Use \`get_vectorization_status_forest\` to check status\n` +
                  `• Try \`get_next_task_forest\` for semantic recommendations`
          }],
          restart_result: result
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: `**❌ ChromaDB Restart Failed**\n\nError: ${result.error || 'Unknown error'}\n\n` +
                  `**Troubleshooting**:\n` +
                  `• Check if port ${result.port || 8000} is available\n` +
                  `• Verify ChromaDB installation\n` +
                  `• Check system logs for more details\n` +
                  `• Try \`get_chromadb_status_forest\` for more information`
          }],
          error: result.error
        };
      }
    } catch (error) {
      console.error('VectorizedHandlers.restartChromaDB failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**❌ ChromaDB Restart Failed**\n\nError: ${error.message}\n\nPlease check the system status and try again.`
        }],
        error: error.message
      };
    }
  }

  // Helper methods
  assessGoalComplexity(goal, context) {
    const goalLength = goal.length;
    const contextLength = (context || '').length;
    const complexWords = (goal.toLowerCase().match(/\b(advanced|complex|sophisticated|comprehensive|integrate|analyze|synthesize|optimize)\b/g) || []).length;
    
    if (complexWords >= 3 || goalLength > 200) return 'high';
    if (complexWords >= 1 || goalLength > 100 || contextLength > 200) return 'medium';
    return 'low';
  }
  
  extractDomain(goal) {
    const goalLower = goal.toLowerCase();
    
    if (goalLower.includes('programming') || goalLower.includes('coding') || goalLower.includes('software')) return 'software_development';
    if (goalLower.includes('machine learning') || goalLower.includes('ai') || goalLower.includes('data science')) return 'ai_ml';
    if (goalLower.includes('business') || goalLower.includes('marketing') || goalLower.includes('finance')) return 'business';
    if (goalLower.includes('design') || goalLower.includes('creative') || goalLower.includes('art')) return 'creative';
    if (goalLower.includes('science') || goalLower.includes('research') || goalLower.includes('academic')) return 'academic';
    if (goalLower.includes('language') || goalLower.includes('spanish') || goalLower.includes('french')) return 'language_learning';
    if (goalLower.includes('health') || goalLower.includes('fitness') || goalLower.includes('wellness')) return 'health_wellness';
    
    return 'general';
  }
  
  assessBreakthroughLevel(args) {
    let level = 2; // baseline
    
    if (args.breakthrough) level += 2;
    if (args.learned && args.learned.length > 100) level += 1;
    if (args.difficulty_rating && args.difficulty_rating >= 4) level += 1;
    if (args.outcome && args.outcome.toLowerCase().includes('breakthrough')) level += 1;
    if (args.learned && (args.learned.toLowerCase().includes('insight') || args.learned.toLowerCase().includes('understanding'))) level += 1;
    
    return Math.min(level, 5);
  }
}
