/**
 * Task Selection Engine - Intelligent task selection and recommendation
 * Handles next task selection, goal-focused batching, and context-aware recommendations
 * Enhanced with continuous AST context integration for code-aware task selection
 */

import { WebContext } from './stubs/web-context.js';
import { FILE_NAMES, DEFAULT_PATHS, TASK_CONFIG, SCORING, THRESHOLDS } from './memory-sync.js';
import { TaskScorer, TaskSelector as TaskLogicSelector, TaskFormatter } from '../../modules/task-logic/index.js';
import { AmbiguousDesiresManager } from './ambiguous-desires/index.js';
import { ASTParserStub } from './ast-parser-stub.js';
import { ClaudeASTAnalyzer } from './claude-ast-analyzer.js';
import { EnhancedHTACore } from './enhanced-hta-core.js';
import fs from 'fs/promises';
import path from 'path';

export class TaskSelector {
  constructor(dataPersistence, projectManagement = null, llmInterface = null) {
    this.dataPersistence = dataPersistence;
    this.projectManagement = projectManagement;
    this.webContext = new WebContext(dataPersistence, llmInterface);
    this.logger = console;
    this.ambiguousDesiresManager = new AmbiguousDesiresManager(dataPersistence, llmInterface);
    
    // Initialize AST-driven context components
    this.astParser = new ASTParserStub();
    this.astAnalyzer = new ClaudeASTAnalyzer(llmInterface);
    this.enhancedHTACore = new EnhancedHTACore(dataPersistence, llmInterface);
    
    // AST context caching for performance
    this.astContextCache = new Map();
    this.lastASTUpdateTime = new Map();
    this.astUpdateInterval = 60000; // 1 minute default
  }

  async getNextTask(args, dependencies = {}) {
    const contextFromMemory = args.context_from_memory || args.contextFromMemory || '';
    const energyLevel = args.energy_level || args.energyLevel || 3;
    const timeAvailable = args.time_available || args.timeAvailable || '30 minutes';
    
    const { vectorStore, goalContext, vectorStoreInitialized, goalContextInitialized } = dependencies;

    try {
      if (!this.projectManagement) {
        throw new Error('ProjectManagement not available in TaskSelector');
      }

      const activeProject = await this.projectManagement.getActiveProject();
      if (!activeProject || !activeProject.project_id) {
        throw new Error('No active project found. Please create or switch to a project first.');
      }

      const projectId = activeProject.project_id;
      const config = await this.dataPersistence.loadProjectData(projectId, FILE_NAMES.CONFIG);
      
      if (!config) {
        const { ProjectConfigurationError } = await import('../errors.js');
        throw new ProjectConfigurationError(projectId, FILE_NAMES.CONFIG, null, {
          operation: 'getNextTask',
        });
      }

      // Build goal-focused context for intelligent task selection
      let goalAchievementContext = null;
      if (goalContextInitialized) {
        try {
          goalAchievementContext = await goalContext.buildGoalAchievementContext({
            project_id: projectId,
            context_from_memory: contextFromMemory,
            energy_level: energyLevel,
            time_available: timeAvailable,
            ...args
          });
          console.error('[TaskSelector] Generated goal achievement context');
        } catch (error) {
          console.warn('[TaskSelector] Goal context generation failed:', error.message);
        }
      }

      // Check for ambiguous desires before task selection
      if (this.ambiguousDesiresManager) {
        const ambiguousCheck = await this.checkAmbiguousDesires(config, contextFromMemory, projectId);
        if (ambiguousCheck) return ambiguousCheck;
      }

      const activePath = config?.activePath || 'general';

      // Try vector-based HTA loading first, then fallback to traditional
      let htaData = null;
      try {
        if (vectorStoreInitialized) {
          // Check if vector store has the HTA
          if (await vectorStore.htaExists(projectId)) {
            htaData = await vectorStore.retrieveHTATree(projectId);
            console.error(`[TaskSelector] Retrieved HTA from vector store for project ${projectId}`);
          }
          
          // If vector store available and goal context exists, use goal-focused task batch selection
          if (htaData && goalAchievementContext) {
            const goalFocusedTaskBatch = await this.selectGoalFocusedTaskBatch(
              projectId, 
              htaData, 
              goalAchievementContext, 
              config,
              vectorStore
            );
            
            if (goalFocusedTaskBatch && goalFocusedTaskBatch.tasks?.length > 0) {
              return goalFocusedTaskBatch;
            }
          }
        }
      } catch (vectorError) {
        console.error('[TaskSelector] Vector store retrieval failed:', vectorError.message);
      }
      
      // Fallback to traditional storage if vector store fails
      if (!htaData) {
        htaData = await this.loadPathHTA(projectId, activePath);
        if (htaData) {
          console.error(`[TaskSelector] Retrieved HTA from traditional storage for project ${projectId}`);
        }
      }

      if (!htaData || !htaData.frontierNodes || htaData.frontierNodes.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '**No Tasks Available** 🌱\n\nUse `build_hta_tree_forest` to create your strategic learning framework first.',
            },
          ],
        };
      }

      // Apply intelligent task filtering and scoring
      const availableTasks = htaData.frontierNodes.filter(task => !task.completed);
      
      if (availableTasks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '**All Tasks Completed!** 🎉\n\nCongratulations! You\'ve completed all available tasks. Use `evolve_strategy_forest` to expand your learning journey.',
            },
          ],
        };
      }

      // Score and select the best task
      const selectedTask = await this.selectBestTask(availableTasks, {
        energyLevel,
        timeAvailable,
        contextFromMemory,
        goalAchievementContext,
        config
      });

      return this.formatTaskResponse(selectedTask, availableTasks.length);

    } catch (error) {
      console.error('TaskSelector.getNextTask failed:', error);
      return {
        content: [
          {
            type: 'text',
            text: `**Task Selection Failed**\n\nError: ${error.message}\n\nPlease check your project configuration and try again.`,
          },
        ],
        error: error.message,
      };
    }
  }

  async checkAmbiguousDesires(config, contextFromMemory, projectId) {
    const goal = config.goal;
    const context = contextFromMemory || config.context || '';
    
    // Lightweight check for uncertainty and pivots
    const goalClarity = await this.ambiguousDesiresManager.assessGoalClarity(goal, context);
    const evolution = await this.ambiguousDesiresManager.analyzeGoalEvolution(projectId);
    
    // If high uncertainty or recent pivots, suggest clarification or evolution
    if (goalClarity.uncertaintyLevel > 0.7) {
      return {
        content: [
          {
            type: 'suggestion',
            text: "Your recent feedback suggests your goals may be unclear. Would you like to start a clarification dialogue to refine your learning path?",
            action: 'start_clarification_dialogue_forest',
            details: goalClarity.summary,
            recommendation: goalClarity.recommendation
          }
        ],
        proactive: true
      };
    }
    
    if (evolution.pivotAnalysis?.recentPivots?.length > 0) {
      return {
        content: [
          {
            type: 'suggestion',
            text: "I've noticed you're exploring several new topics. To help focus your efforts, I recommend we evolve your strategy. Shall I proceed?",
            action: 'evolve_strategy_forest',
            details: evolution.pivotAnalysis,
            recommendation: evolution.recommendations?.[0] || ''
          }
        ],
        proactive: true
      };
    }

    return null;
  }

  async selectGoalFocusedTaskBatch(projectId, htaData, goalAchievementContext, config, vectorStore) {
    try {
      // Use vector store for similarity-based task selection
      const contextQuery = goalAchievementContext.narrative || config.goal;
      const similarTasks = await vectorStore.findSimilarTasks(contextQuery, 5);
      
      if (similarTasks && similarTasks.length > 0) {
        const availableTasks = htaData.frontierNodes.filter(task => !task.completed);
        const goalFocusedTasks = availableTasks.filter(task => 
          similarTasks.some(similar => similar.id === task.id)
        );

        if (goalFocusedTasks.length > 0) {
          return {
            content: [
              {
                type: 'text',
                text: `**Goal-Focused Tasks** 🎯\n\nBased on your current goal context, here are the most relevant tasks:`,
              },
            ],
            tasks: goalFocusedTasks.slice(0, 3), // Top 3 most relevant
            goal_focused: true,
            context_used: goalAchievementContext.narrative
          };
        }
      }
    } catch (error) {
      console.warn('[TaskSelector] Goal-focused task selection failed:', error.message);
    }
    
    return null;
  }

  async selectBestTask(availableTasks, criteria) {
    const { energyLevel, timeAvailable, contextFromMemory, goalAchievementContext, config } = criteria;
    
    // Simple scoring algorithm - can be enhanced
    let bestTask = availableTasks[0];
    let bestScore = 0;

    for (const task of availableTasks) {
      let score = 0;
      
      // Energy level matching
      const taskDifficulty = task.difficulty || 3;
      if (Math.abs(taskDifficulty - energyLevel) <= 1) {
        score += 30;
      }
      
      // Time availability matching
      const estimatedDuration = this.parseTimeToMinutes(task.estimated_duration || '30 minutes');
      const availableMinutes = this.parseTimeToMinutes(timeAvailable);
      if (estimatedDuration <= availableMinutes) {
        score += 25;
      }
      
      // Priority scoring
      if (task.priority === 'high') score += 20;
      else if (task.priority === 'medium') score += 10;
      
      // Context relevance (simple keyword matching)
      if (contextFromMemory && task.description) {
        const contextWords = contextFromMemory.toLowerCase().split(/\s+/);
        const taskWords = task.description.toLowerCase().split(/\s+/);
        const matches = contextWords.filter(word => taskWords.includes(word));
        score += matches.length * 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTask = task;
      }
    }

    return bestTask;
  }

  parseTimeToMinutes(timeString) {
    const match = timeString.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/i);
    if (!match) return 30; // Default 30 minutes
    
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('hour') || unit.startsWith('hr')) {
      return value * 60;
    }
    return value;
  }

  formatTaskResponse(task, totalAvailable) {
    return {
      content: [
        {
          type: 'text',
          text: `**Next Task** 🎯\n\n**${task.title}**\n\n${task.description}\n\n**Difficulty**: ${task.difficulty || 3}/5\n**Estimated Time**: ${task.estimated_duration || '30 minutes'}\n**Priority**: ${task.priority || 'medium'}\n\n**Progress**: ${totalAvailable} tasks remaining`,
        },
      ],
      task,
      remaining_tasks: totalAvailable,
    };
  }

  async loadPathHTA(projectId, pathName) {
    try {
      return await this.dataPersistence.loadPathData(projectId, pathName, FILE_NAMES.HTA);
    } catch (error) {
      console.warn(`[TaskSelector] Could not load HTA for path ${pathName}:`, error.message);
      return null;
    }
  }

  async handleBlockCompletion(data) {
    // Task-specific block completion logic
    console.log('[TaskSelector] Processing block completion:', data.blockId);
    
    // Update task status, learning patterns, etc.
    // This would contain task-focused completion logic
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      taskUpdated: true
    };
  }

  /**
   * Continuously update AST context for code-related HTA nodes
   * @param {string} projectId - Project identifier
   * @param {Object} htaData - Current HTA tree data
   * @param {boolean} forceUpdate - Force update regardless of cache
   */
  async updateASTContext(projectId, htaData, forceUpdate = false) {
    try {
      const cacheKey = `${projectId}-ast-context`;
      const lastUpdate = this.lastASTUpdateTime.get(cacheKey);
      const now = Date.now();
      
      // Skip if recently updated and not forced
      if (!forceUpdate && lastUpdate && (now - lastUpdate) < this.astUpdateInterval) {
        return this.astContextCache.get(cacheKey);
      }
      
      // Scan for code-related tasks and goals
      const codeRelatedTasks = this.identifyCodeRelatedTasks(htaData);
      
      if (codeRelatedTasks.length === 0) {
        console.log('[TaskSelector] No code-related tasks found, skipping AST context update');
        return null;
      }
      
      // Use EnhancedHTACore to get enriched context
      const enrichedContext = await this.enhancedHTACore.getEnrichedContext(projectId, htaData);
      
      // Parse relevant code files for AST insights
      const astInsights = await this.parseProjectCodeFiles(projectId, codeRelatedTasks);
      
      // Merge AST insights with HTA context
      const astContext = {
        projectId,
        lastUpdated: now,
        codeRelatedTasks,
        astInsights,
        enrichedContext,
        htaNodes: this.mapASTToHTANodes(htaData, astInsights)
      };
      
      // Cache the context
      this.astContextCache.set(cacheKey, astContext);
      this.lastASTUpdateTime.set(cacheKey, now);
      
      console.log(`[TaskSelector] Updated AST context for project ${projectId}`);
      return astContext;
      
    } catch (error) {
      console.error('[TaskSelector] AST context update failed:', error);
      return null;
    }
  }

  /**
   * Identify tasks in HTA tree that are code-related
   * @param {Object} htaData - HTA tree data
   * @returns {Array} Array of code-related tasks
   */
  identifyCodeRelatedTasks(htaData) {
    const codeKeywords = ['code', 'implement', 'function', 'class', 'method', 'api', 'debug', 'refactor', 'test'];
    const codeRelatedTasks = [];
    
    // Check frontier nodes
    if (htaData.frontierNodes) {
      for (const task of htaData.frontierNodes) {
        if (this.isCodeRelatedTask(task, codeKeywords)) {
          codeRelatedTasks.push(task);
        }
      }
    }
    
    // Check strategic branches
    if (htaData.strategicBranches) {
      for (const branch of htaData.strategicBranches) {
        if (branch.tasks) {
          for (const task of branch.tasks) {
            if (this.isCodeRelatedTask(task, codeKeywords)) {
              codeRelatedTasks.push(task);
            }
          }
        }
      }
    }
    
    return codeRelatedTasks;
  }

  /**
   * Check if a task is code-related based on keywords
   * @param {Object} task - Task object
   * @param {Array} keywords - Code-related keywords
   * @returns {boolean} True if task is code-related
   */
  isCodeRelatedTask(task, keywords) {
    const taskText = `${task.title || ''} ${task.description || ''} ${task.tags?.join(' ') || ''}`.toLowerCase();
    return keywords.some(keyword => taskText.includes(keyword));
  }

  /**
   * Parse code files in project for AST insights
   * @param {string} projectId - Project identifier
   * @param {Array} codeRelatedTasks - Code-related tasks
   * @returns {Object} AST insights
   */
  async parseProjectCodeFiles(projectId, codeRelatedTasks) {
    try {
      const project = await this.dataPersistence.loadProjectData(projectId, FILE_NAMES.CONFIG);
      const projectPath = project?.project_path || process.cwd();
      
      // Find relevant code files
      const codeFiles = await this.findCodeFiles(projectPath);
      
      if (codeFiles.length === 0) {
        return { files: [], insights: [] };
      }
      
      // Parse each code file
      const astInsights = [];
      for (const filePath of codeFiles.slice(0, 20)) { // Limit to 20 files for performance
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const ast = await this.astParser.parseFile(filePath, content);
          
          if (ast) {
            // Use Claude AST analyzer for deeper insights
            const analysis = await this.astAnalyzer.analyzeAST(ast, filePath);
            
            astInsights.push({
              filePath,
              ast,
              analysis,
              relevantToTasks: this.mapFileToTasks(filePath, codeRelatedTasks)
            });
          }
        } catch (fileError) {
          console.warn(`[TaskSelector] Failed to parse ${filePath}:`, fileError.message);
        }
      }
      
      return {
        files: codeFiles,
        insights: astInsights,
        totalFiles: codeFiles.length,
        parsedFiles: astInsights.length
      };
      
    } catch (error) {
      console.error('[TaskSelector] Project code parsing failed:', error);
      return { files: [], insights: [] };
    }
  }

  /**
   * Find code files in project directory
   * @param {string} projectPath - Project directory path
   * @returns {Array} Array of code file paths
   */
  async findCodeFiles(projectPath) {
    try {
      const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.rb', '.php', '.go'];
      const codeFiles = [];
      
      const scanDirectory = async (dirPath) => {
        try {
          const items = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
              // Skip node_modules, .git, and other common non-source directories
              if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item.name)) {
                await scanDirectory(fullPath);
              }
            } else if (item.isFile()) {
              const ext = path.extname(item.name);
              if (codeExtensions.includes(ext)) {
                codeFiles.push(fullPath);
              }
            }
          }
        } catch (dirError) {
          console.warn(`[TaskSelector] Failed to scan directory ${dirPath}:`, dirError.message);
        }
      };
      
      await scanDirectory(projectPath);
      return codeFiles;
      
    } catch (error) {
      console.error('[TaskSelector] Code file discovery failed:', error);
      return [];
    }
  }

  /**
   * Map file relevance to specific tasks
   * @param {string} filePath - File path
   * @param {Array} tasks - Array of tasks
   * @returns {Array} Array of relevant task IDs
   */
  mapFileToTasks(filePath, tasks) {
    const fileName = path.basename(filePath).toLowerCase();
    const relevantTasks = [];
    
    for (const task of tasks) {
      const taskText = `${task.title || ''} ${task.description || ''}`.toLowerCase();
      
      // Simple relevance matching - can be enhanced
      if (taskText.includes(fileName.replace(/\.[^.]+$/, '')) || 
          taskText.includes(path.dirname(filePath).split(path.sep).pop())) {
        relevantTasks.push(task.id);
      }
    }
    
    return relevantTasks;
  }

  /**
   * Map AST insights to HTA nodes for contextual awareness
   * @param {Object} htaData - HTA tree data
   * @param {Object} astInsights - AST parsing insights
   * @returns {Object} Mapping of HTA nodes to AST context
   */
  mapASTToHTANodes(htaData, astInsights) {
    const nodeMapping = {};
    
    // Map frontier nodes
    if (htaData.frontierNodes) {
      for (const node of htaData.frontierNodes) {
        nodeMapping[node.id] = {
          nodeId: node.id,
          nodeType: 'frontier',
          relevantFiles: astInsights.insights.filter(insight => 
            insight.relevantToTasks.includes(node.id)
          ),
          contextualInsights: this.extractContextualInsights(node, astInsights)
        };
      }
    }
    
    // Map strategic branches
    if (htaData.strategicBranches) {
      for (const branch of htaData.strategicBranches) {
        nodeMapping[branch.id] = {
          nodeId: branch.id,
          nodeType: 'strategic_branch',
          relevantFiles: astInsights.insights.filter(insight => 
            branch.tasks?.some(task => insight.relevantToTasks.includes(task.id))
          ),
          contextualInsights: this.extractContextualInsights(branch, astInsights)
        };
      }
    }
    
    return nodeMapping;
  }

  /**
   * Extract contextual insights for a specific HTA node
   * @param {Object} node - HTA node
   * @param {Object} astInsights - AST insights
   * @returns {Object} Contextual insights for the node
   */
  extractContextualInsights(node, astInsights) {
    const insights = {
      codePatterns: [],
      dependencies: [],
      complexity: null,
      suggestedApproach: null
    };
    
    // Extract patterns from relevant files
    const relevantInsights = astInsights.insights.filter(insight => 
      insight.relevantToTasks.includes(node.id)
    );
    
    for (const insight of relevantInsights) {
      if (insight.analysis) {
        if (insight.analysis.patterns) {
          insights.codePatterns.push(...insight.analysis.patterns);
        }
        if (insight.analysis.dependencies) {
          insights.dependencies.push(...insight.analysis.dependencies);
        }
        if (insight.analysis.complexity) {
          insights.complexity = insight.analysis.complexity;
        }
        if (insight.analysis.suggestedApproach) {
          insights.suggestedApproach = insight.analysis.suggestedApproach;
        }
      }
    }
    
    return insights;
  }

  /**
   * Get AST-enhanced task selection with continuous context awareness
   * @param {Object} criteria - Task selection criteria
   * @param {string} projectId - Project identifier
   * @param {Object} htaData - HTA tree data
   * @returns {Object} Enhanced task selection with AST context
   */
  async getASTEnhancedTaskSelection(criteria, projectId, htaData) {
    try {
      // Update AST context
      const astContext = await this.updateASTContext(projectId, htaData);
      
      if (!astContext) {
        // Fall back to normal task selection
        return await this.selectBestTask(htaData.frontierNodes?.filter(task => !task.completed) || [], criteria);
      }
      
      // Enhanced task selection with AST context
      const availableTasks = htaData.frontierNodes?.filter(task => !task.completed) || [];
      
      let bestTask = null;
      let bestScore = 0;
      
      for (const task of availableTasks) {
        let score = await this.scoreTaskWithAST(task, criteria, astContext);
        
        if (score > bestScore) {
          bestScore = score;
          bestTask = task;
        }
      }
      
      // Enhance task with AST context
      if (bestTask && astContext.htaNodes[bestTask.id]) {
        bestTask.astContext = astContext.htaNodes[bestTask.id];
      }
      
      return bestTask;
      
    } catch (error) {
      console.error('[TaskSelector] AST-enhanced task selection failed:', error);
      // Fall back to normal task selection
      return await this.selectBestTask(htaData.frontierNodes?.filter(task => !task.completed) || [], criteria);
    }
  }

  /**
   * Score a task with AST context awareness
   * @param {Object} task - Task to score
   * @param {Object} criteria - Selection criteria
   * @param {Object} astContext - AST context
   * @returns {number} Task score
   */
  async scoreTaskWithAST(task, criteria, astContext) {
    // Start with base score
    let score = 0;
    
    const { energyLevel, timeAvailable, contextFromMemory } = criteria;
    
    // Apply base scoring
    const taskDifficulty = task.difficulty || 3;
    if (Math.abs(taskDifficulty - energyLevel) <= 1) {
      score += 30;
    }
    
    const estimatedDuration = this.parseTimeToMinutes(task.estimated_duration || '30 minutes');
    const availableMinutes = this.parseTimeToMinutes(timeAvailable);
    if (estimatedDuration <= availableMinutes) {
      score += 25;
    }
    
    if (task.priority === 'high') score += 20;
    else if (task.priority === 'medium') score += 10;
    
    // AST-enhanced scoring
    const nodeContext = astContext.htaNodes[task.id];
    if (nodeContext) {
      // Bonus for tasks with relevant code files
      if (nodeContext.relevantFiles.length > 0) {
        score += 15;
      }
      
      // Complexity-based scoring
      if (nodeContext.contextualInsights.complexity) {
        const complexityScore = this.scoreComplexity(nodeContext.contextualInsights.complexity, energyLevel);
        score += complexityScore;
      }
      
      // Pattern-based scoring
      if (nodeContext.contextualInsights.codePatterns.length > 0) {
        score += 10;
      }
      
      // Context relevance from AST
      if (contextFromMemory) {
        const astRelevance = this.calculateASTRelevance(contextFromMemory, nodeContext);
        score += astRelevance;
      }
    }
    
    return score;
  }

  /**
   * Score complexity against user energy level
   * @param {Object} complexity - Complexity analysis
   * @param {number} energyLevel - User energy level
   * @returns {number} Complexity score
   */
  scoreComplexity(complexity, energyLevel) {
    if (!complexity.level) return 0;
    
    const complexityLevel = complexity.level;
    const energyComplexityMatch = Math.abs(complexityLevel - energyLevel);
    
    if (energyComplexityMatch <= 1) return 15;
    if (energyComplexityMatch <= 2) return 5;
    return -5; // Penalty for poor match
  }

  /**
   * Calculate AST relevance to user context
   * @param {string} contextFromMemory - User context
   * @param {Object} nodeContext - AST node context
   * @returns {number} Relevance score
   */
  calculateASTRelevance(contextFromMemory, nodeContext) {
    let relevance = 0;
    const contextWords = contextFromMemory.toLowerCase().split(/\s+/);
    
    // Check patterns
    for (const pattern of nodeContext.contextualInsights.codePatterns) {
      if (contextWords.some(word => pattern.toLowerCase().includes(word))) {
        relevance += 8;
      }
    }
    
    // Check dependencies
    for (const dependency of nodeContext.contextualInsights.dependencies) {
      if (contextWords.some(word => dependency.toLowerCase().includes(word))) {
        relevance += 5;
      }
    }
    
    // Check file paths
    for (const fileInsight of nodeContext.relevantFiles) {
      const filePath = fileInsight.filePath.toLowerCase();
      if (contextWords.some(word => filePath.includes(word))) {
        relevance += 3;
      }
    }
    
    return relevance;
  }
}
