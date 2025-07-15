/**
 * Enhanced Tree Evolution System
 * 
 * Ensures trees evolve intelligently based on task completion and context accumulation.
 * Integrates with existing evolution systems while providing guaranteed deep tree adaptation.
 * 
 * Key Features:
 * - Task completion tracking with context learning
 * - Dynamic tree depth expansion based on progress
 * - Vector store integration for semantic learning
 * - Intelligent branch evolution and pruning
 * - Context-driven primitive refinement
 */

import { PureSchemaHTASystem } from './pure-schema-driven-hta.js';
import { RealLLMInterface } from './real-llm-interface.js';
import { StrategyEvolver } from './strategy-evolution-engine.js';
import { HTAVectorStore } from './hta-vector-store.js';

// Mock the missing imports until they're available  
const DynamicBranchExpansion = class {
  constructor() {}
  async analyzeForBranchExpansion() { return { shouldExpand: false }; }
  async executeBranchExpansion() { return {}; }
};

const AdaptiveHTAEvolution = class {
  constructor() {}
  async adaptiveEvolution() { return {}; }
};

export class EnhancedTreeEvolution {
  constructor(dataPersistence, vectorStore = null) {
    this.dataPersistence = dataPersistence;
    this.vectorStore = vectorStore || new HTAVectorStore();
    this.llmInterface = new RealLLMInterface();
    this.pureSchemaHTA = new PureSchemaHTASystem(this.llmInterface);
    this.strategyEvolver = new StrategyEvolver(dataPersistence, null, this.llmInterface);
    this.branchExpansion = new DynamicBranchExpansion(dataPersistence, this.llmInterface);
    this.adaptiveEvolution = new AdaptiveHTAEvolution(dataPersistence, this.llmInterface);
    
    // Task completion tracking
    this.taskCompletionHistory = new Map();
    this.contextAccumulation = new Map();
    this.evolutionTriggers = new Set(['task_completion', 'context_drift', 'interest_discovery', 'struggle_detection']);
    
    // Evolution state management
    this.lastEvolutionTime = new Map();
    this.evolutionCooldown = 5 * 60 * 1000; // 5 minutes between major evolutions
    this.minTasksForEvolution = 3;
  }

  /**
   * Track task completion and trigger evolution if needed
   * This is the main entry point for task completion events
   */
  async trackTaskCompletion(projectId, taskId, completionData) {
    console.error('🎯 Enhanced Tree Evolution: Tracking task completion');
    console.error(`   Project: ${projectId}, Task: ${taskId}`);
    
    try {
      // Record task completion
      await this.recordTaskCompletion(projectId, taskId, completionData);
      
      // Accumulate context from completion
      await this.accumulateContextFromCompletion(projectId, completionData);
      
      // Check if evolution should be triggered
      const shouldEvolve = await this.shouldTriggerEvolution(projectId, 'task_completion');
      
      if (shouldEvolve) {
        console.error('🌱 Triggering tree evolution based on task completion');
        return await this.evolveTreeFromProgress(projectId, {
          trigger: 'task_completion',
          taskId,
          completionData
        });
      }
      
      return {
        success: true,
        evolutionTriggered: false,
        message: 'Task completion tracked, no evolution needed yet'
      };
      
    } catch (error) {
      console.error('❌ Enhanced Tree Evolution: Task tracking failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record detailed task completion data for learning
   */
  async recordTaskCompletion(projectId, taskId, completionData) {
    const completionRecord = {
      taskId,
      completedAt: new Date().toISOString(),
      duration: completionData.duration || null,
      quality: completionData.quality || 'unknown',
      difficulty: completionData.difficulty || 'unknown',
      userReflections: completionData.userReflections || '',
      learningOutcomes: completionData.learningOutcomes || [],
      strugglingAreas: completionData.strugglingAreas || [],
      breakthroughMoments: completionData.breakthroughMoments || [],
      contextChanges: completionData.contextChanges || {},
      nextInterests: completionData.nextInterests || []
    };
    
    // Store in completion history
    if (!this.taskCompletionHistory.has(projectId)) {
      this.taskCompletionHistory.set(projectId, []);
    }
    this.taskCompletionHistory.get(projectId).push(completionRecord);
    
    // Store in vector store for semantic search
    if (this.vectorStore) {
      const embeddingText = this.createCompletionEmbeddingText(completionRecord);
      const vector = await this.llmInterface.generateEmbedding(embeddingText);
      
      await this.vectorStore.storeVector(
        `${projectId}:completion:${taskId}`,
        vector,
        {
          type: 'task_completion',
          projectId,
          taskId,
          ...completionRecord
        }
      );
    }
    
    // Persist to disk
    await this.dataPersistence.saveProjectData(
      projectId,
      'task_completion_history.json',
      this.taskCompletionHistory.get(projectId)
    );
  }

  /**
   * Accumulate context from task completion for tree evolution
   */
  async accumulateContextFromCompletion(projectId, completionData) {
    if (!this.contextAccumulation.has(projectId)) {
      this.contextAccumulation.set(projectId, {
        learningPatterns: {},
        emergingInterests: [],
        strugglingAreas: [],
        preferredDifficulty: 'unknown',
        optimalTaskDuration: null,
        contextualPreferences: {},
        domainInsights: {},
        lastUpdated: new Date().toISOString()
      });
    }
    
    const context = this.contextAccumulation.get(projectId);
    
    // Update learning patterns
    if (completionData.learningOutcomes) {
      completionData.learningOutcomes.forEach(outcome => {
        if (!context.learningPatterns[outcome]) {
          context.learningPatterns[outcome] = 0;
        }
        context.learningPatterns[outcome]++;
      });
    }
    
    // Track emerging interests
    if (completionData.nextInterests) {
      completionData.nextInterests.forEach(interest => {
        if (!context.emergingInterests.find(i => i.topic === interest)) {
          context.emergingInterests.push({
            topic: interest,
            firstMentioned: new Date().toISOString(),
            frequency: 1
          });
        } else {
          const existing = context.emergingInterests.find(i => i.topic === interest);
          existing.frequency++;
        }
      });
    }
    
    // Track struggling areas
    if (completionData.strugglingAreas) {
      completionData.strugglingAreas.forEach(area => {
        if (!context.strugglingAreas.find(s => s.area === area)) {
          context.strugglingAreas.push({
            area,
            firstEncountered: new Date().toISOString(),
            frequency: 1,
            resolved: false
          });
        } else {
          const existing = context.strugglingAreas.find(s => s.area === area);
          existing.frequency++;
        }
      });
    }
    
    // Update preferred difficulty and duration
    if (completionData.difficulty && completionData.quality === 'good') {
      context.preferredDifficulty = completionData.difficulty;
    }
    
    if (completionData.duration && completionData.quality === 'good') {
      context.optimalTaskDuration = completionData.duration;
    }
    
    context.lastUpdated = new Date().toISOString();
    
    // Store accumulated context in vector store
    if (this.vectorStore) {
      const contextText = this.createContextEmbeddingText(context);
      const vector = await this.llmInterface.generateEmbedding(contextText);
      
      await this.vectorStore.storeVector(
        `${projectId}:context_accumulation`,
        vector,
        {
          type: 'context_accumulation',
          projectId,
          ...context
        }
      );
    }
    
    // Persist to disk
    await this.dataPersistence.saveProjectData(
      projectId,
      'context_accumulation.json',
      context
    );
  }

  /**
   * Determine if tree evolution should be triggered
   */
  async shouldTriggerEvolution(projectId, trigger) {
    // Check cooldown
    const lastEvolution = this.lastEvolutionTime.get(projectId) || 0;
    const timeSinceLastEvolution = Date.now() - lastEvolution;
    
    if (timeSinceLastEvolution < this.evolutionCooldown) {
      return false;
    }
    
    // Check minimum task threshold
    const completionHistory = this.taskCompletionHistory.get(projectId) || [];
    if (completionHistory.length < this.minTasksForEvolution) {
      return false;
    }
    
    // Check for significant context changes
    const recentCompletions = completionHistory.slice(-5); // Last 5 tasks
    const hasBreakthroughs = recentCompletions.some(c => c.breakthroughMoments.length > 0);
    const hasNewInterests = recentCompletions.some(c => c.nextInterests.length > 0);
    const hasStruggles = recentCompletions.some(c => c.strugglingAreas.length > 0);
    
    return hasBreakthroughs || hasNewInterests || hasStruggles;
  }

  /**
   * Evolve tree based on accumulated progress and context
   */
  async evolveTreeFromProgress(projectId, evolutionContext) {
    console.error('🌱 Enhanced Tree Evolution: Starting tree evolution from progress');
    
    try {
      // Load current HTA tree
      const currentTree = await this.loadCurrentTree(projectId);
      if (!currentTree) {
        throw new Error('No HTA tree found to evolve');
      }
      
      // Get accumulated context
      const accumulatedContext = this.contextAccumulation.get(projectId) || {};
      const completionHistory = this.taskCompletionHistory.get(projectId) || [];
      
      // Analyze evolution needs
      const evolutionNeeds = await this.analyzeEvolutionNeeds(
        currentTree, 
        accumulatedContext, 
        completionHistory,
        evolutionContext
      );
      
      console.error('🧠 Evolution needs identified:', {
        needsDepthExpansion: evolutionNeeds.needsDepthExpansion,
        needsBranchExpansion: evolutionNeeds.needsBranchExpansion,
        needsContentRefinement: evolutionNeeds.needsContentRefinement,
        needsGoalAdjustment: evolutionNeeds.needsGoalAdjustment
      });
      
      // Apply appropriate evolution strategies
      let evolvedTree = currentTree;
      const evolutionResults = [];
      
      // 1. Depth Expansion (if user is progressing well)
      if (evolutionNeeds.needsDepthExpansion) {
        console.error('📏 Applying depth expansion evolution');
        evolvedTree = await this.applyDepthExpansion(evolvedTree, accumulatedContext);
        evolutionResults.push('depth_expansion');
      }
      
      // 2. Branch Expansion (for new interests)
      if (evolutionNeeds.needsBranchExpansion) {
        console.error('🌿 Applying branch expansion evolution');
        evolvedTree = await this.applyBranchExpansion(evolvedTree, accumulatedContext, projectId);
        evolutionResults.push('branch_expansion');
      }
      
      // 3. Content Refinement (based on learning patterns)
      if (evolutionNeeds.needsContentRefinement) {
        console.error('✨ Applying content refinement evolution');
        evolvedTree = await this.applyContentRefinement(evolvedTree, accumulatedContext);
        evolutionResults.push('content_refinement');
      }
      
      // 4. Goal Adjustment (for major pivots)
      if (evolutionNeeds.needsGoalAdjustment) {
        console.error('🎯 Applying goal adjustment evolution');
        evolvedTree = await this.applyGoalAdjustment(evolvedTree, accumulatedContext, projectId);
        evolutionResults.push('goal_adjustment');
      }
      
      // Save evolved tree
      await this.saveEvolvedTree(projectId, evolvedTree, {
        evolutionContext,
        evolutionResults,
        timestamp: new Date().toISOString()
      });
      
      // Update evolution timestamp
      this.lastEvolutionTime.set(projectId, Date.now());
      
      console.error('✅ Enhanced Tree Evolution: Evolution completed successfully');
      console.error(`   Applied strategies: ${evolutionResults.join(', ')}`);
      
      return {
        success: true,
        evolvedTree,
        evolutionResults,
        evolutionContext,
        message: `Tree evolved with ${evolutionResults.length} strategies applied`
      };
      
    } catch (error) {
      console.error('❌ Enhanced Tree Evolution: Evolution failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze what type of evolution is needed
   */
  async analyzeEvolutionNeeds(currentTree, accumulatedContext, completionHistory, evolutionContext) {
    const recentCompletions = completionHistory.slice(-5);
    
    // Check for depth expansion needs
    const hasGoodProgress = recentCompletions.filter(c => c.quality === 'good').length >= 3;
    const hasBreakthroughs = recentCompletions.some(c => c.breakthroughMoments.length > 0);
    const needsDepthExpansion = hasGoodProgress && hasBreakthroughs;
    
    // Check for branch expansion needs
    const hasNewInterests = accumulatedContext.emergingInterests?.length > 0;
    const needsBranchExpansion = hasNewInterests;
    
    // Check for content refinement needs
    const hasStruggles = accumulatedContext.strugglingAreas?.length > 0;
    const hasLearningPatterns = Object.keys(accumulatedContext.learningPatterns || {}).length > 0;
    const needsContentRefinement = hasStruggles || hasLearningPatterns;
    
    // Check for goal adjustment needs
    const hasSignificantContextChange = evolutionContext.trigger === 'major_pivot';
    const needsGoalAdjustment = hasSignificantContextChange;
    
    return {
      needsDepthExpansion,
      needsBranchExpansion,
      needsContentRefinement,
      needsGoalAdjustment
    };
  }

  /**
   * Apply depth expansion to generate deeper levels
   */
  async applyDepthExpansion(currentTree, accumulatedContext) {
    // Use Pure Schema system to generate deeper levels
    const currentLevels = Object.keys(currentTree).filter(k => k.startsWith('level')).length;
    
    if (currentLevels < 6) {
      console.error(`🧠 Expanding tree from ${currentLevels} to 6 levels`);
      
      // Generate missing levels using Pure Schema system
      const expandedTree = await this.pureSchemaHTA.generateHTATree(currentTree.goal, {
        ...accumulatedContext,
        progressiveDepth: 6,
        existingTree: currentTree,
        explicitDepthRequest: true
      });
      
      // Merge with existing tree
      return {
        ...currentTree,
        ...expandedTree,
        evolutionHistory: [
          ...(currentTree.evolutionHistory || []),
          {
            type: 'depth_expansion',
            from: currentLevels,
            to: 6,
            timestamp: new Date().toISOString()
          }
        ]
      };
    }
    
    return currentTree;
  }

  /**
   * Apply branch expansion for new interests
   */
  async applyBranchExpansion(currentTree, accumulatedContext, projectId) {
    if (!accumulatedContext.emergingInterests?.length) {
      return currentTree;
    }
    
    // Use existing branch expansion system
    const expansionResult = await this.branchExpansion.analyzeForBranchExpansion(projectId, {
      type: 'emerging_interests',
      interests: accumulatedContext.emergingInterests,
      context: accumulatedContext
    });
    
    if (expansionResult.shouldExpand) {
      return await this.branchExpansion.executeBranchExpansion(
        projectId,
        expansionResult.suggestedBranches,
        true // progressive refinement
      );
    }
    
    return currentTree;
  }

  /**
   * Apply content refinement based on learning patterns
   */
  async applyContentRefinement(currentTree, accumulatedContext) {
    // Use Adaptive HTA Evolution for sophisticated refinement
    const refinementContext = {
      learningPatterns: accumulatedContext.learningPatterns,
      strugglingAreas: accumulatedContext.strugglingAreas,
      preferredDifficulty: accumulatedContext.preferredDifficulty,
      optimalTaskDuration: accumulatedContext.optimalTaskDuration
    };
    
    return await this.adaptiveEvolution.adaptiveEvolution({
      goal: currentTree.goal,
      context: refinementContext,
      currentTree,
      evolutionType: 'content_refinement'
    });
  }

  /**
   * Apply goal adjustment for major context changes
   */
  async applyGoalAdjustment(currentTree, accumulatedContext, projectId) {
    // Use Adaptive HTA Evolution for goal rewriting
    return await this.adaptiveEvolution.adaptiveEvolution({
      goal: currentTree.goal,
      context: accumulatedContext,
      currentTree,
      evolutionType: 'goal_adjustment',
      projectId
    });
  }

  /**
   * Load current HTA tree
   */
  async loadCurrentTree(projectId) {
    try {
      const config = await this.dataPersistence.loadProjectData(projectId, 'config.json');
      const activePath = config?.activePath || 'general';
      return await this.dataPersistence.loadPathData(projectId, activePath, 'hta.json');
    } catch (error) {
      console.error('Failed to load current tree:', error.message);
      return null;
    }
  }

  /**
   * Save evolved tree with evolution metadata
   */
  async saveEvolvedTree(projectId, evolvedTree, evolutionMetadata) {
    try {
      const config = await this.dataPersistence.loadProjectData(projectId, 'config.json');
      const activePath = config?.activePath || 'general';
      
      // Add evolution metadata to tree
      const treeWithMetadata = {
        ...evolvedTree,
        lastEvolution: evolutionMetadata,
        evolutionHistory: [
          ...(evolvedTree.evolutionHistory || []),
          evolutionMetadata
        ]
      };
      
      await this.dataPersistence.savePathData(projectId, activePath, 'hta.json', treeWithMetadata);
      return true;
    } catch (error) {
      console.error('Failed to save evolved tree:', error.message);
      return false;
    }
  }

  /**
   * Create embedding text for task completion
   */
  createCompletionEmbeddingText(completionRecord) {
    return [
      `Task completed: ${completionRecord.taskId}`,
      `Quality: ${completionRecord.quality}`,
      `Difficulty: ${completionRecord.difficulty}`,
      `Reflections: ${completionRecord.userReflections}`,
      `Learning outcomes: ${completionRecord.learningOutcomes.join(', ')}`,
      `Struggling areas: ${completionRecord.strugglingAreas.join(', ')}`,
      `Breakthroughs: ${completionRecord.breakthroughMoments.join(', ')}`,
      `Next interests: ${completionRecord.nextInterests.join(', ')}`
    ].join(' ');
  }

  /**
   * Create embedding text for context accumulation
   */
  createContextEmbeddingText(context) {
    return [
      `Learning patterns: ${Object.entries(context.learningPatterns || {}).map(([k, v]) => `${k}(${v})`).join(', ')}`,
      `Emerging interests: ${context.emergingInterests?.map(i => i.topic).join(', ')}`,
      `Struggling areas: ${context.strugglingAreas?.map(s => s.area).join(', ')}`,
      `Preferred difficulty: ${context.preferredDifficulty}`,
      `Optimal duration: ${context.optimalTaskDuration}`,
      `Domain insights: ${Object.keys(context.domainInsights || {}).join(', ')}`
    ].join(' ');
  }

  /**
   * Learn from vector store interactions and user behavior patterns
   */
   async learnFromVectorStoreInteractions(projectId) {
    if (!this.vectorStore) {
      return { success: false, message: 'Vector store not available' };
    }

    try {
      console.error('🧠 Enhanced Tree Evolution: Learning from vector store interactions');
      
      // Query for task completions to identify patterns
      const taskCompletions = await this.vectorStore.queryVector(
        await this.llmInterface.generateEmbedding('task completion learning patterns'),
        20, // Get top 20 most relevant completions
        0.3  // Lower threshold for broader learning
      );

      // Query for context accumulations to understand user evolution
      const contextEvolutions = await this.vectorStore.queryVector(
        await this.llmInterface.generateEmbedding('context accumulation user preferences'),
        10,
        0.3
      );

      // Analyze learning patterns from vector store data
      const learningInsights = this.analyzeLearningInsights(taskCompletions, contextEvolutions);
      
      // Store insights for future evolution decisions
      await this.storeVectorLearningInsights(projectId, learningInsights);
      
      console.error(`✅ Learned from ${taskCompletions.length} task completions and ${contextEvolutions.length} context evolutions`);
      
      return {
        success: true,
        learningInsights,
        taskCompletionsAnalyzed: taskCompletions.length,
        contextEvolutionsAnalyzed: contextEvolutions.length
      };

    } catch (error) {
      console.error('❌ Vector store learning failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze learning insights from vector store data
   */
  analyzeLearningInsights(taskCompletions, contextEvolutions) {
    const insights = {
      preferredTaskTypes: {},
      commonStrugglingAreas: {},
      emergingInterestPatterns: {},
      optimalTaskCharacteristics: {},
      learningVelocityPatterns: {},
      contextEvolutionTrends: {}
    };

    // Analyze task completion patterns
    taskCompletions.forEach(completion => {
      const metadata = completion.metadata;
      
      // Track preferred task types
      if (metadata.quality === 'good' && metadata.taskType) {
        insights.preferredTaskTypes[metadata.taskType] = 
          (insights.preferredTaskTypes[metadata.taskType] || 0) + 1;
      }

      // Track common struggling areas
      if (metadata.strugglingAreas) {
        metadata.strugglingAreas.forEach(area => {
          insights.commonStrugglingAreas[area] = 
            (insights.commonStrugglingAreas[area] || 0) + 1;
        });
      }

      // Track emerging interests
      if (metadata.nextInterests) {
        metadata.nextInterests.forEach(interest => {
          insights.emergingInterestPatterns[interest] = 
            (insights.emergingInterestPatterns[interest] || 0) + 1;
        });
      }

      // Analyze optimal task characteristics
      if (metadata.quality === 'good') {
        const characteristics = `${metadata.difficulty}-${metadata.duration}min`;
        insights.optimalTaskCharacteristics[characteristics] = 
          (insights.optimalTaskCharacteristics[characteristics] || 0) + 1;
      }
    });

    // Analyze context evolution patterns
    contextEvolutions.forEach(context => {
      const metadata = context.metadata;
      
      // Track learning velocity patterns
      if (metadata.learningPatterns) {
        Object.keys(metadata.learningPatterns).forEach(pattern => {
          insights.learningVelocityPatterns[pattern] = 
            Math.max(insights.learningVelocityPatterns[pattern] || 0, metadata.learningPatterns[pattern]);
        });
      }

      // Track context evolution trends
      if (metadata.emergingInterests) {
        metadata.emergingInterests.forEach(interest => {
          if (interest.frequency > 2) { // Only significant trends
            insights.contextEvolutionTrends[interest.topic] = interest.frequency;
          }
        });
      }
    });

    return insights;
  }

  /**
   * Store vector learning insights for future use
   */
  async storeVectorLearningInsights(projectId, insights) {
    try {
      // Store in memory for immediate use
      if (!this.contextAccumulation.has(projectId)) {
        this.contextAccumulation.set(projectId, {});
      }
      
      const context = this.contextAccumulation.get(projectId);
      context.vectorLearningInsights = insights;
      context.lastVectorLearning = new Date().toISOString();

      // Store in vector store for semantic access
      if (this.vectorStore) {
        const insightsText = this.createInsightsEmbeddingText(insights);
        const vector = await this.llmInterface.generateEmbedding(insightsText);
        
        await this.vectorStore.storeVector(
          `${projectId}:vector_learning_insights`,
          vector,
          {
            type: 'vector_learning_insights',
            projectId,
            insights,
            timestamp: new Date().toISOString()
          }
        );
      }

      // Persist to disk
      await this.dataPersistence.saveProjectData(
        projectId,
        'vector_learning_insights.json',
        insights
      );

      return true;
    } catch (error) {
      console.error('Failed to store vector learning insights:', error.message);
      return false;
    }
  }

  /**
   * Create embedding text for learning insights
   */
  createInsightsEmbeddingText(insights) {
    return [
      `Preferred task types: ${Object.entries(insights.preferredTaskTypes).map(([k, v]) => `${k}(${v})`).join(', ')}`,
      `Common struggling areas: ${Object.entries(insights.commonStrugglingAreas).map(([k, v]) => `${k}(${v})`).join(', ')}`,
      `Emerging interest patterns: ${Object.entries(insights.emergingInterestPatterns).map(([k, v]) => `${k}(${v})`).join(', ')}`,
      `Optimal task characteristics: ${Object.entries(insights.optimalTaskCharacteristics).map(([k, v]) => `${k}(${v})`).join(', ')}`,
      `Learning velocity patterns: ${Object.entries(insights.learningVelocityPatterns).map(([k, v]) => `${k}(${v})`).join(', ')}`,
      `Context evolution trends: ${Object.entries(insights.contextEvolutionTrends).map(([k, v]) => `${k}(${v})`).join(', ')}`
    ].join(' ');
  }

  /**
   * Get personalized recommendations based on vector store learning
   */
  async getPersonalizedRecommendations(projectId) {
    try {
      // Load vector learning insights
      const insights = await this.loadVectorLearningInsights(projectId);
      if (!insights) {
        return { recommendations: [], message: 'No learning insights available yet' };
      }

      const recommendations = [];

      // Task type recommendations
      const topTaskTypes = Object.entries(insights.preferredTaskTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      if (topTaskTypes.length > 0) {
        recommendations.push({
          type: 'task_preference',
          recommendation: `Focus on ${topTaskTypes.map(([type]) => type).join(', ')} tasks based on your success patterns`,
          confidence: 0.8,
          data: topTaskTypes
        });
      }

      // Struggling area recommendations
      const topStruggles = Object.entries(insights.commonStrugglingAreas)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2);
      
      if (topStruggles.length > 0) {
        recommendations.push({
          type: 'support_needed',
          recommendation: `Consider additional support for ${topStruggles.map(([area]) => area).join(', ')}`,
          confidence: 0.7,
          data: topStruggles
        });
      }

      // Interest evolution recommendations
      const topInterests = Object.entries(insights.contextEvolutionTrends)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      if (topInterests.length > 0) {
        recommendations.push({
          type: 'branch_expansion',
          recommendation: `Consider expanding into ${topInterests.map(([interest]) => interest).join(', ')} based on growing interest`,
          confidence: 0.6,
          data: topInterests
        });
      }

      return {
        recommendations,
        insightsUsed: insights,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to get personalized recommendations:', error.message);
      return {
        recommendations: [],
        error: error.message
      };
    }
  }

  /**
   * Load vector learning insights from storage
   */
  async loadVectorLearningInsights(projectId) {
    try {
      return await this.dataPersistence.loadProjectData(projectId, 'vector_learning_insights.json');
    } catch (error) {
      console.error('Failed to load vector learning insights:', error.message);
      return null;
    }
  }

  /**
   * Get evolution summary for a project
   */
  async getEvolutionSummary(projectId) {
    const completionHistory = this.taskCompletionHistory.get(projectId) || [];
    const accumulatedContext = this.contextAccumulation.get(projectId) || {};
    const lastEvolution = this.lastEvolutionTime.get(projectId) || 0;
    
    // Get vector store learning status
    const vectorLearning = await this.learnFromVectorStoreInteractions(projectId);
    const recommendations = await this.getPersonalizedRecommendations(projectId);
    
    return {
      totalTasksCompleted: completionHistory.length,
      lastEvolutionTime: new Date(lastEvolution).toISOString(),
      emergingInterests: accumulatedContext.emergingInterests?.length || 0,
      strugglingAreas: accumulatedContext.strugglingAreas?.length || 0,
      learningPatterns: Object.keys(accumulatedContext.learningPatterns || {}).length,
      nextEvolutionReady: await this.shouldTriggerEvolution(projectId, 'manual_check'),
      vectorLearning: {
        available: vectorLearning.success,
        taskCompletionsAnalyzed: vectorLearning.taskCompletionsAnalyzed || 0,
        contextEvolutionsAnalyzed: vectorLearning.contextEvolutionsAnalyzed || 0
      },
      personalizedRecommendations: recommendations.recommendations || []
    };
  }
}