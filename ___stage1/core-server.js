/**
 * Stage1 Core Server - Consolidated Forest MCP Server
 * Uses the new consolidated module architecture
 */

// @ts-nocheck

import { Server } from './local-mcp-server.js';
import { StdioServerTransport } from './local-stdio-transport.js';
import { EnhancedHTACore } from './modules/enhanced-hta-core.js';
import { BackgroundProcessor } from './modules/utils/background-processor.js';
import HTAExpansionAgent from './modules/utils/hta-expansion-agent.js';
import { TaskStrategyCore } from './modules/task-strategy-core.js';
import { CoreIntelligence } from './modules/core-intelligence.js';
import { getRealCoreIntelligence, getMCPIntelligenceBridge } from './modules/mcp-intelligence-bridge.js';
import { ConsolidatedMcpCore } from './modules/mcp-core-consolidated.js';
import { DataPersistence } from './modules/data-persistence.js';
import { ProjectManagement } from './modules/project-management.js';
import { MemorySync } from './modules/memory-sync.js';
import { buildClaudeContext } from './utils/claude-context-builder.js';
import { validateToolCall } from './utils/tool-schemas.js';
import { AmbiguousDesiresManager } from './modules/ambiguous-desires/index.js';
import { GatedOnboardingFlow } from './modules/gated-onboarding-flow.js';
import { NextPipelinePresenter } from './modules/next-pipeline-presenter.js';
import { GatedOnboardingHandlers } from './modules/gated-onboarding-handlers.js';
import { VectorizedHandlers } from './modules/vectorized-handlers.js';
import { DiagnosticHandlers } from './modules/diagnostic-handlers.js';
import { ForestDataVectorization } from './modules/forest-data-vectorization.js';
import { ClaudeDiagnosticHelper } from './utils/claude-diagnostic-helper.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Replaced pino with simple stderr console logger to avoid JSON log leakage


// Structured logger – level controlled via LOG_LEVEL env var
const logger = {
  info: (...args) => console.error('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => console.error('[DEBUG]', ...args),
};
const debugLogger = logger;

class Stage1CoreServer {
  constructor(options = {}) {
    this.options = options;
    this.server = new Server(
      {
        name: 'forest-mcp-server',
        version: '1.0.0',
      },
      {
        tools: {},
        resources: {},
        prompts: {},
      }
    );

    // Initialize consolidated modules
    this.dataPersistence = new DataPersistence(options.dataDir);
    this.projectManagement = new ProjectManagement(this.dataPersistence);
    
    // CRITICAL: Use MCP Intelligence Bridge for real Claude intelligence
    this.intelligenceBridge = getMCPIntelligenceBridge();
    this.coreIntelligence = getRealCoreIntelligence(this.dataPersistence, this.projectManagement);
    console.error('🌉 Using MCP Intelligence Bridge for real Claude intelligence');
    
    this.htaCore = new EnhancedHTACore(this.dataPersistence, this.projectManagement, this.coreIntelligence);
    
    // Initialize Ambiguous Desires Architecture first
    this.ambiguousDesiresManager = new AmbiguousDesiresManager(
      this.dataPersistence,
      this.projectManagement,
      null, // Will be set after TaskStrategyCore is initialized
      this.coreIntelligence,
      null // Will be set after HTA vector store is initialized
    );
    
    this.taskStrategyCore = new TaskStrategyCore(
      this.dataPersistence,
      this.projectManagement,
      this.coreIntelligence,  // Pass coreIntelligence for MCP bridge access
      null,
      this.ambiguousDesiresManager
    );

    // Initialize background processing utilities
    this.backgroundProcessor = new BackgroundProcessor();
    // Expansion agent monitors HTA and auto-expands when tasks run low
    this.htaExpansionAgent = new HTAExpansionAgent({
      htaCore: this.htaCore,
      projectManagement: this.projectManagement,
      backgroundProcessor: this.backgroundProcessor,
      // Default configuration – can be overridden via env vars later
      options: {
        intervalMs: Number(process.env.HTA_EXPANSION_INTERVAL_MS) || 5 * 60 * 1000,
        minAvailableTasks: Number(process.env.HTA_EXPANSION_MIN_TASKS) || 3,
        debug: process.env.HTA_EXPANSION_DEBUG === 'true',
      },
    });
    this.memorySync = new MemorySync(this.dataPersistence);
    this.mcpCore = new ConsolidatedMcpCore(this.server);
    
    // Initialize diagnostic helper for preventing false positives
    // Ensure it uses the Forest server directory, not the Claude app directory
const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const forestProjectRoot = process.cwd().includes('Claude') || process.cwd().includes('Anthropic') 
      ? path.dirname(__dirname) // __dirname is ___stage1, so go up one level
      : process.cwd();
    this.diagnosticHelper = new ClaudeDiagnosticHelper(forestProjectRoot);
    
    // Connect TaskStrategyCore to AmbiguousDesiresManager
    this.ambiguousDesiresManager.taskStrategyCore = this.taskStrategyCore;
    
    // Initialize AmbiguousDesiresManager (will be called in initialize method)
    this.ambiguousDesiresInitialized = false;

    // Initialize Forest Data Vectorization FIRST for semantic operations
    this.forestDataVectorization = new ForestDataVectorization(this.dataPersistence.dataDir);
    
    // ChromaDB support deprecated - using SQLite vector provider only
    
    // Initialize gated onboarding flow and Next + Pipeline presenter
    this.gatedOnboarding = new GatedOnboardingFlow(
      this.dataPersistence,
      this.projectManagement,
      this.htaCore,
      this.coreIntelligence,
      null // Will be set after vector store is initialized
    );
    
    this.pipelinePresenter = new NextPipelinePresenter(
      this.dataPersistence,
      null, // Will be set after vector store is initialized
      this.taskStrategyCore,
      this.htaCore
    );
    
    // Initialize gated onboarding handlers
    this.gatedOnboardingHandlers = new GatedOnboardingHandlers(
      this.gatedOnboarding,
      this.pipelinePresenter,
      this.projectManagement
    );
    
    // Initialize vectorized handlers
    this.vectorizedHandlers = new VectorizedHandlers(
      this.forestDataVectorization,
      this.taskStrategyCore,
      this.projectManagement,
      null // ChromaDB deprecated
    );
    
    // Initialize diagnostic handlers
    this.diagnosticHandlers = new DiagnosticHandlers(
      this.diagnosticHelper,
      null, // vectorStore will be set after initialization
      this.dataPersistence,
      this.projectManagement
    );

    this.logger = logger;
    this.debugLogger = debugLogger;
    
    // Landing page tracking - ensures first interaction always shows landing page
    this.hasShownLandingPage = false;

    // Use console.error to avoid stdout contamination
    console.error('[Stage1CoreServer] Initialized with consolidated modules');
  }

  async initialize() {
    try {
      console.error('🚀 Initializing Stage1 Core Server...');
      
      // ChromaDB support deprecated - using SQLite vector provider only
      
      // Initialize core modules with vector support

      // Initialize ProjectManagement to load active project state
      console.error('🔧 Initializing project management...');
      await this.projectManagement.initialize();
      console.error('✅ Project management ready');
      
      // Set up enhanced tool routing with vector intelligence
      this.setupToolRouter();

      // Start background processor & expansion agent
      this.backgroundProcessor.start();
      this.htaExpansionAgent.start();

      // Connect MCP core to tool router and register JSON-RPC handlers
      await this.mcpCore.setupHandlers();
      this.mcpCore.setToolRouter(this.toolRouter);
      const toolDefinitions = await this.mcpCore.getToolDefinitions();
      console.error(`✅ MCP handlers configured with ${toolDefinitions.length} tools`);
      
      // Ensure vector store is properly initialized
      console.error('📊 Initializing vector intelligence...');
      
      // Initialize ForestDataVectorization first
      try {
        await this.forestDataVectorization.initialize();
        console.error('✅ Forest Data Vectorization ready');
      } catch (vectorizationError) {
        console.error('⚠️ Forest Data Vectorization initialization failed:', vectorizationError.message);
      }
      
      // ChromaDB status checking removed - using SQLite vector provider only
      
      const htaCore = this.htaCore;
      if (htaCore && typeof htaCore.initializeVectorStore === 'function') {
        try {
          const vectorStore = await htaCore.initializeVectorStore();
          if (vectorStore) {
            console.error('✅ Vector intelligence ready');
            
            // Connect vector store to ambiguous desires manager
            this.ambiguousDesiresManager.vectorStore = vectorStore;
            this.ambiguousDesiresManager.adaptiveEvolution.vectorStore = vectorStore;
            this.ambiguousDesiresManager.clarificationDialogue.vectorStore = vectorStore;
            
            // Connect vector store to gated onboarding and pipeline presenter
            this.gatedOnboarding.vectorStore = vectorStore;
            this.pipelinePresenter.vectorStore = vectorStore;
            
            // Connect vector store to diagnostic handlers
            this.diagnosticHandlers.vectorStore = vectorStore;
          } else {
            console.error('⚠️ Vector store initialization returned null, continuing without vector support');
          }
        } catch (vectorError) {
          console.error('⚠️ Vector store initialization failed, continuing without vector support:', vectorError.message);
        }
      } else {
        console.error('⚠️ HTA Core does not support vector store initialization');
      }
      
      // Continue with tool router and vector intelligence initialization
      if (this.toolRouter && typeof this.toolRouter.initialize === 'function') {
        try {
          await this.toolRouter.initialize();
        } catch (routerError) {
          console.error('⚠️ Tool router initialization failed:', routerError.message);
        }
      }
      if (this.vectorIntelligence && typeof this.vectorIntelligence.initialize === 'function') {
        try {
          await this.vectorIntelligence.initialize();
        } catch (vectorIntelError) {
          console.error('⚠️ Vector intelligence initialization failed:', vectorIntelError.message);
        }
      }
      
      // Initialize AmbiguousDesiresManager after all other components
      if (!this.ambiguousDesiresInitialized) {
        try {
          await this.ambiguousDesiresManager.initialize();
          this.ambiguousDesiresInitialized = true;
          console.error('✅ AmbiguousDesiresManager initialized');
        } catch (error) {
          console.error('⚠️ AmbiguousDesiresManager initialization failed:', error.message);
        }
      }
      
      console.error('✅ Stage1 Core Server initialized successfully');
      this.initialized = true;
      
      return this.server;
    } catch (error) {
      console.error('❌ Failed to initialize Stage1 Core Server:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  setupToolRouter() {
    if (this.toolRouter) return this.toolRouter;
    // Create a simple tool router that delegates to the appropriate modules
    this.toolRouter = {
      handleToolCall: async (toolName, args) => {
        console.error(`[ToolRouter] Received tool call for: ${toolName}`);
        
        // FIRST INTERACTION: Always show landing page first, unless explicitly requesting it
        if (!this.hasShownLandingPage && !['get_landing_page_forest', 'start_learning_journey_forest', 'list_projects_forest', 'continue_onboarding_forest', 'get_onboarding_status_forest', 'complete_onboarding_forest', 'get_next_pipeline_forest', 'evolve_pipeline_forest', 'verify_function_exists_forest'].includes(toolName)) {
          this.hasShownLandingPage = true;
          console.error('[ToolRouter] First interaction detected - showing landing page first');
          const landingPageResult = await this.generateLandingPage();
          
          // Return landing page with a note about the original request
          return {
            content: [
              ...landingPageResult.content,
              {
                type: 'text',
                text: `\n\n---\n\n**Note**: You requested \`${toolName}\`. After reviewing the options above, you can try that command again or use any of the suggested actions.`
              }
            ]
          };
        }
        
        // Validate payload against schema before dispatch
        try {
          validateToolCall(toolName, args);
        } catch (validationErr) {
          return {
            error: `ValidationError: ${validationErr.message}`,
          };
        }
        try {
          let result;
          switch (toolName) {
            case 'create_project_forest':
              result = await this.projectManagement.createProject(args); break;
            case 'switch_project_forest':
              result = await this.projectManagement.switchProject(args.project_id); break;
            case 'list_projects_forest':
              result = await this.projectManagement.listProjects(); break;
            case 'get_active_project_forest':
              result = await this.projectManagement.getActiveProject(); break;
            case 'build_hta_tree_forest':
              console.error('[forest-log] [ToolRouter] About to call vectorized buildHTATree');
              result = await this.buildHTATreeVectorized(args); break;
            case 'get_hta_status_forest':
              result = await this.htaCore.getHTAStatus(); break;
            case 'get_next_task_forest':
              // CRITICAL FIX: Route directly to HTA task strategy core instead of MCP bridge
              // This ensures users get actual HTA tasks instead of generic bridge responses
              result = await this.taskStrategyCore.getNextTask(args); break;
            case 'complete_block_forest':
              result = await this.vectorizedHandlers.completeBlockVectorized(args); break;
            case 'evolve_strategy_forest':
              result = await this.taskStrategyCore.evolveStrategy(args); break;
            case 'current_status_forest':
              result = await this.getCurrentStatus(); break;
            case 'generate_daily_schedule_forest':
              result = await this.generateDailySchedule(args); break;
            case 'sync_forest_memory_forest': {
              const activeProjectSync = await this.projectManagement.getActiveProject();
              if (!activeProjectSync || !activeProjectSync.project_id) {
                result = {
                  content: [{
                    type: 'text',
                    text: '**No Active Project** ❌\n\nCreate or switch to a project first to sync memory.'
                  }]
                };
                break;
              }
              result = await this.memorySync.syncForestMemory(activeProjectSync.project_id); break;
            }
            // Ambiguous Desires Architecture Tools
            case 'start_clarification_dialogue_forest':
              result = await this.ambiguousDesiresManager.clarificationDialogue.startClarificationDialogue(args); break;
            case 'continue_clarification_dialogue_forest':
              result = await this.ambiguousDesiresManager.clarificationDialogue.continueDialogue(args); break;
            case 'analyze_goal_convergence_forest': {
              const activeProjectConvergence = await this.projectManagement.getActiveProject();
              if (!activeProjectConvergence || !activeProjectConvergence.project_id) {
                result = {
                  content: [{
                    type: 'text',
                    text: '**No Active Project** ❌\n\nCreate or switch to a project first to analyze goal convergence.'
                  }]
                };
                break;
              }
              result = await this.ambiguousDesiresManager.convergenceDetector.analyzeGoalConvergence({
                project_id: activeProjectConvergence.project_id,
                detailed: args.detailed || false
              }); break;
            }
            case 'adaptive_evolution_forest':
              result = await this.ambiguousDesiresManager.adaptiveEvolution.adaptiveEvolution(args); break;
            case 'smart_evolution_forest':
              result = await this.ambiguousDesiresManager.smartEvolution(args); break;
            case 'assess_goal_clarity_forest':
              result = await this.assessGoalClarity(args); break;
            case 'get_ambiguous_desire_status_forest': {
              const currentProject = await this.projectManagement.getActiveProject();
              if (!currentProject || !currentProject.project_id) {
                result = {
                  content: [{
                    type: 'text',
                    text: '**No Active Project** ❌\n\nCreate or switch to a project first to check ambiguous desire status.'
                  }]
                };
                break;
              }
              result = await this.ambiguousDesiresManager.getAmbiguousDesireStatus(currentProject.project_id); break;
            }
            case 'factory_reset_forest':
              result = await this.handleFactoryReset(args); break;
            case 'get_landing_page_forest':
              result = await this.generateLandingPage(); break;
            // Gated Onboarding Flow Tools
            case 'start_gated_onboarding_forest':
              result = await this.gatedOnboardingHandlers.startLearningJourney(args); break;
            case 'start_learning_journey_forest':
              result = await this.gatedOnboardingHandlers.startLearningJourney(args); break;
            case 'continue_onboarding_forest':
              result = await this.gatedOnboardingHandlers.continueOnboarding(args); break;
            case 'get_onboarding_status_forest':
              result = await this.gatedOnboardingHandlers.getOnboardingStatus(args); break;
            case 'complete_onboarding_forest':
              result = await this.gatedOnboardingHandlers.completeOnboarding(args); break;
            
            // Next + Pipeline Presentation Tools
            case 'get_next_pipeline_forest':
              result = await this.getNextPipeline(args); break;
            case 'evolve_pipeline_forest':
              result = await this.evolvePipeline(args); break;
            
            // Vectorization Status Tools
            case 'get_vectorization_status_forest':
              result = await this.vectorizedHandlers.getVectorizationStatus(args); break;
            case 'vectorize_project_data_forest':
              result = await this.vectorizedHandlers.vectorizeProjectData(args); break;
            
            // Diagnostic Tools
            case 'verify_system_health_forest':
              result = await this.diagnosticHandlers.verifySystemHealth(args); break;
            case 'verify_function_exists_forest':
              result = await this.diagnosticHandlers.verifyFunctionExists(args); break;
            case 'run_diagnostic_verification_forest':
              result = await this.diagnosticHandlers.runDiagnosticVerification(args); break;
            case 'get_health_status_forest':
              result = await this.diagnosticHandlers.getHealthStatus(args); break;
            case 'debug_cache_forest':
              result = await this.diagnosticHandlers.debugCacheState(args); break;
            case 'emergency_clear_cache_forest':
              result = await this.diagnosticHandlers.emergencyClearCache(args); break;
            case 'get_vector_store_status_forest':
              result = await this.diagnosticHandlers.getVectorStoreStatus(args); break;
            case 'optimize_vector_store_forest':
              result = await this.diagnosticHandlers.optimizeVectorStore(args); break;
            // ChromaDB tools removed - deprecated
            
            default:
              throw new Error(`Unknown tool: ${toolName}`);
          }
          console.error(`[ToolRouter] Handler for ${toolName} returned result`);
          return result;
        } catch (error) {
          this.logger.error?.('[Stage1CoreServer] Tool call failed', {
            toolName,
            error: error.message,
          });
          throw error;
        }
      },
    };
    return this.toolRouter;
  }

  async getCurrentStatus() {
    try {
      const activeProjectId = await this.projectManagement.getActiveProjectId();
      if (!activeProjectId) {
        return {
          content: [
            {
              type: 'text',
              text: '**No Active Project** ❌\n\nCreate or switch to a project first.',
            },
          ],
        };
      }

      const projectConfig = await this.dataPersistence.loadProjectData(
        activeProjectId,
        'config.json'
      );
      const htaData = await this.dataPersistence.loadPathData(activeProjectId, 'general', 'hta.json');

      const availableTasks = htaData?.frontierNodes?.length || 0;
      const progress = projectConfig?.progress || 0;

      return {
        content: [
          {
            type: 'text',
            text:
              `**Current Status** 📊\n\n` +
              `**Project**: ${projectConfig?.goal || 'Unknown'}\n` +
              `**Progress**: ${progress}%\n` +
              `**Available Tasks**: ${availableTasks}\n` +
              `**Active Path**: ${projectConfig?.activePath || 'general'}\n\n` +
              `Use \`get_next_task_forest\` to continue learning!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `**Status Error**: ${error.message}`,
          },
        ],
      };
    }
  }

  async generateDailySchedule(args) {
    // Simple daily schedule generation - can be enhanced later
    const activeProjectId = await this.projectManagement.getActiveProjectId();
    if (!activeProjectId) {
      return {
        content: [
          {
            type: 'text',
            text: '**No Active Project** ❌\n\nCreate or switch to a project first.',
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text:
            `**Daily Schedule Generation** 📅\n\n` +
            `Schedule generation is available but simplified in Stage1.\n` +
            `Use \`get_next_task_forest\` for immediate task recommendations.`,
        },
      ],
    };
  }

  /**
   * Assess goal complexity for vectorization
   */
  assessGoalComplexity(goal, context = '') {
    if (!goal || typeof goal !== 'string') {
      return {
        score: 3,
        level: 'moderate',
        factors: ['Goal not properly defined']
      };
    }

    const goalLower = goal.toLowerCase();
    const contextLower = (context || '').toLowerCase();
    let complexityScore = 1;
    const factors = [];

    // Technical complexity indicators
    const technicalTerms = [
      'implement', 'build', 'develop', 'create', 'design', 'architect',
      'system', 'framework', 'algorithm', 'model', 'application', 'software',
      'programming', 'code', 'api', 'database', 'network', 'security'
    ];

    // Mastery/advanced indicators
    const masteryTerms = [
      'master', 'expert', 'advanced', 'professional', 'comprehensive',
      'deep', 'thorough', 'complete', 'optimization', 'performance'
    ];

    // Domain-specific complexity
    const complexDomains = [
      'machine learning', 'artificial intelligence', 'blockchain', 'quantum',
      'cybersecurity', 'data science', 'cloud architecture', 'devops'
    ];

    // Time/scope indicators
    const scopeIndicators = [
      'multiple', 'various', 'several', 'complex', 'enterprise', 'large-scale',
      'production', 'scalable', 'distributed'
    ];

    // Analyze goal text
    const fullText = `${goalLower} ${contextLower}`;

    if (technicalTerms.some(term => fullText.includes(term))) {
      complexityScore += 2;
      factors.push('Technical implementation required');
    }

    if (masteryTerms.some(term => fullText.includes(term))) {
      complexityScore += 3;
      factors.push('Mastery-level expertise targeted');
    }

    if (complexDomains.some(domain => fullText.includes(domain))) {
      complexityScore += 2;
      factors.push('Complex domain knowledge required');
    }

    if (scopeIndicators.some(term => fullText.includes(term))) {
      complexityScore += 1;
      factors.push('Broad scope or multiple components');
    }

    // Determine complexity level
    let level = 'simple';
    if (complexityScore >= 7) level = 'expert';
    else if (complexityScore >= 5) level = 'complex';
    else if (complexityScore >= 3) level = 'moderate';

    return {
      score: Math.min(10, complexityScore),
      level,
      factors: factors.length > 0 ? factors : ['Standard learning objective']
    };
  }

  /**
   * Extract domain from goal for vectorization
   */
  extractDomain(goal) {
    if (!goal || typeof goal !== 'string') {
      return 'general';
    }

    const goalLower = goal.toLowerCase();

    // Programming domains
    const programmingLanguages = [
      'python', 'javascript', 'java', 'c++', 'c#', 'ruby', 'go', 'rust',
      'typescript', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab'
    ];

    // Technology domains
    const techDomains = {
      'web development': ['web', 'html', 'css', 'frontend', 'backend', 'fullstack'],
      'mobile development': ['mobile', 'android', 'ios', 'react native', 'flutter'],
      'data science': ['data science', 'analytics', 'statistics', 'visualization'],
      'machine learning': ['machine learning', 'ml', 'ai', 'artificial intelligence', 'deep learning'],
      'cybersecurity': ['security', 'cybersecurity', 'penetration testing', 'ethical hacking'],
      'cloud computing': ['cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes'],
      'database': ['database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql'],
      'networking': ['networking', 'network', 'tcp/ip', 'routing', 'switching'],
      'devops': ['devops', 'ci/cd', 'automation', 'infrastructure'],
      'game development': ['game', 'unity', 'unreal', 'gaming'],
      'blockchain': ['blockchain', 'cryptocurrency', 'ethereum', 'smart contracts']
    };

    // Creative/design domains
    const creativeDomains = {
      'graphic design': ['design', 'photoshop', 'illustrator', 'graphic'],
      'photography': ['photography', 'photo', 'camera', 'lightroom'],
      'video editing': ['video', 'editing', 'premiere', 'after effects'],
      'music production': ['music', 'audio', 'production', 'mixing'],
      'writing': ['writing', 'content', 'copywriting', 'blog']
    };

    // Business domains
    const businessDomains = {
      'marketing': ['marketing', 'digital marketing', 'seo', 'advertising'],
      'project management': ['project management', 'agile', 'scrum', 'kanban'],
      'finance': ['finance', 'accounting', 'investment', 'trading'],
      'sales': ['sales', 'selling', 'business development']
    };

    // Check programming languages first
    for (const lang of programmingLanguages) {
      if (goalLower.includes(lang)) {
        return `programming-${lang}`;
      }
    }

    // Check all domain categories
    const allDomains = { ...techDomains, ...creativeDomains, ...businessDomains };
    
    for (const [domain, keywords] of Object.entries(allDomains)) {
      if (keywords.some(keyword => goalLower.includes(keyword))) {
        return domain;
      }
    }

    // Language learning
    if (goalLower.includes('language') || goalLower.includes('spanish') || 
        goalLower.includes('french') || goalLower.includes('german') ||
        goalLower.includes('chinese') || goalLower.includes('japanese')) {
      return 'language-learning';
    }

    // Health and fitness
    if (goalLower.includes('fitness') || goalLower.includes('health') ||
        goalLower.includes('exercise') || goalLower.includes('nutrition')) {
      return 'health-fitness';
    }

    // Academic subjects
    if (goalLower.includes('math') || goalLower.includes('physics') ||
        goalLower.includes('chemistry') || goalLower.includes('biology')) {
      return 'academic-sciences';
    }

    return 'general';
  }

  /**
   * VECTORIZED HTA TREE BUILDING - Integrates ForestDataVectorization
   */
  async buildHTATreeVectorized(args) {
    try {
      console.error('[VectorizedHTA] Starting semantic HTA tree building...');
      
      // Enhanced active project detection with proper synchronization
      let projectId = null;
      let config = null;
      
      // Ensure ProjectManagement is initialized first
      await this.projectManagement.ensureInitialized();
      
      // Method 1: If project_id is provided in args, use it and ensure it's active
      if (args.project_id) {
        projectId = args.project_id;
        console.error('[VectorizedHTA] Using project_id from args:', projectId);
        
        // Verify the project exists before switching
        if (await this.dataPersistence.projectExists(projectId)) {
          // Switch to this project to ensure state consistency
          const switchResult = await this.projectManagement.switchProject(projectId);
          if (switchResult.error) {
            throw new Error(`Failed to switch to project ${projectId}: ${switchResult.error}`);
          }
        } else {
          throw new Error(`Project ${projectId} does not exist`);
        }
      } else {
        // Method 2: Use requireActiveProject which handles all the fallback logic
        try {
          const activeProjectInfo = await this.projectManagement.requireActiveProject();
          projectId = activeProjectInfo.projectId;
          config = activeProjectInfo.config;
          console.error('[VectorizedHTA] Found active project:', projectId);
        } catch (requireError) {
          // Method 3: Final fallback - check if there's any project and suggest switching
          const projects = await this.dataPersistence.getProjectList();
          if (projects && projects.length > 0) {
            const projectList = projects.map(p => p.id).join(', ');
            throw new Error(`No active project found. Available projects: ${projectList}. Please switch to a project using switch_project_forest first.`);
          } else {
            throw new Error('No active project found. Please create a project using create_project_forest first.');
          }
        }
      }
      
      if (!projectId) {
        throw new Error('No active project found. Please create a project using create_project_forest or switch to an existing project using switch_project_forest first.');
      }
      
      // Load project configuration
      config = await this.dataPersistence.loadProjectData(projectId, 'config.json');
      
      if (!config) {
        throw new Error(`Project configuration not found for ${projectId}. The project may be corrupted.`);
      }
      
      if (!config.goal) {
        throw new Error('Project must have a goal defined to build HTA tree');
      }
      
      // Build HTA tree using traditional method first
      const traditionalResult = await this.htaCore.buildHTATree(args);
      
      // Check if we need to vectorize the project data
      try {
        // Get the active path from config
        const activePath = config.activePath || 'general';
        
        // Load HTA data from the correct path
        const htaData = await this.dataPersistence.loadPathData(projectId, activePath, 'hta.json');
        if (htaData) {
          console.error('[VectorizedHTA] Vectorizing project goal and HTA structure...');
          
          // Vectorize project goal
          await this.forestDataVectorization.vectorizeProjectGoal(projectId, {
            goal: config.goal,
            complexity: this.assessGoalComplexity(config.goal, config.context),
            domain: this.extractDomain(config.goal),
            estimatedDuration: config.estimated_duration || '3 months',
            created_at: config.created_at || new Date().toISOString()
          });
          
          // Vectorize strategic branches if they exist
          if (htaData.strategicBranches && htaData.strategicBranches.length > 0) {
            await this.forestDataVectorization.vectorizeHTABranches(projectId, htaData.strategicBranches);
          }
          
          // Vectorize tasks if they exist
          if (htaData.frontierNodes && htaData.frontierNodes.length > 0) {
            await this.forestDataVectorization.vectorizeTaskContent(projectId, htaData.frontierNodes);
          }
          
          console.error('[VectorizedHTA] ✅ Project data successfully vectorized for semantic operations');
        } else {
          console.error(`[VectorizedHTA] No HTA data found in path '${activePath}' yet (normal for new HTA trees)`);
          
          // Still vectorize the project goal even if no HTA data exists yet
          await this.forestDataVectorization.vectorizeProjectGoal(projectId, {
            goal: config.goal,
            complexity: this.assessGoalComplexity(config.goal, config.context),
            domain: this.extractDomain(config.goal),
            estimatedDuration: config.estimated_duration || '3 months',
            created_at: config.created_at || new Date().toISOString()
          });
          console.error('[VectorizedHTA] ✅ Project goal vectorized for semantic operations');
        }
      } catch (vectorError) {
        console.error('[VectorizedHTA] ⚠️ Vectorization failed, continuing with traditional HTA:', vectorError.message);
      }
      
      return traditionalResult;
      
    } catch (error) {
      console.error('[VectorizedHTA] HTA tree building failed:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ **HTA Tree Building Failed**\n\nError: ${error.message}\n\nPlease check your project configuration and try again.`
        }]
      };
    }
  }




  async getHealthStatus() {
    // Basic health checks: data directory access, vector store ping, memory usage
    try {
      const fs = await import('fs/promises');
      // Check data directory writable
      const dataDir = this.dataPersistence?.dataDir || this.dataPersistence?.baseDir;
      let dataDirWritable = false;
      if (dataDir) {
        try {
          await fs.access(dataDir, fs.constants.W_OK);
          dataDirWritable = true;
        } catch {
          dataDirWritable = false;
        }
      }

      // Vector store ping
      let vectorStoreHealthy = true;
      if (this.htaCore?.vectorStore?.ping) {
        try {
          await this.htaCore.vectorStore.ping();
          vectorStoreHealthy = true;
        } catch {
          vectorStoreHealthy = false;
        }
      }

      // ChromaDB health check removed - using SQLite vector provider only

      const memory = process.memoryUsage();

      return {
        content: [
          {
            type: 'json',
            json: {
              status: 'ok',
              dataDirWritable,
              vectorStoreHealthy,
              // ChromaDB status removed
              memory,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'json',
            json: {
              status: 'error',
              message: err.message,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }
  }

  async assessGoalClarity(args) {
    try {
      const goal = args.goal || '';
      const context = args.context || '';
      
      if (!goal) {
        return {
          content: [
            {
              type: 'text',
              text: '**Goal Required** ❌\n\nPlease provide a goal to assess clarity.',
            },
          ],
        };
      }

      const clarityAssessment = await this.ambiguousDesiresManager.assessGoalClarity(goal, context);
      
      return {
        success: true,
        content: [
          {
            type: 'text',
            text: `**🎯 Goal Clarity Assessment**\n\n**Goal**: ${goal}\n\n**Clarity Level**: ${clarityAssessment.needsClarification ? 'NEEDS CLARIFICATION' : 'CLEAR'}\n**Uncertainty**: ${Math.round(clarityAssessment.uncertaintyLevel * 100)}%\n\n**Uncertain Areas**: ${clarityAssessment.uncertainAreas.join(', ') || 'None identified'}\n\n**Summary**: ${clarityAssessment.summary}\n\n**Recommendation**: ${clarityAssessment.recommendation}\n\n${clarityAssessment.needsClarification ? '*Consider using `start_clarification_dialogue_forest` to refine your goal.*' : '*Your goal is clear! Ready to build your HTA tree.*'}`,
          },
        ],
        clarity_assessment: clarityAssessment,
      };
    } catch (error) {
      console.error('Stage1CoreServer.assessGoalClarity failed:', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: `**Goal Clarity Assessment Failed**\n\nError: ${error.message}`,
          },
        ],
        error: error.message,
      };
    }
  }

  /**
   * generateLandingPage – Dynamically generates a landing page using Claude/LLM
   * with a specific schema: title, motto, three core actions, and tool explanations.
   */
  async generateLandingPage() {
    try {
      // Get list of existing projects for context
      const projectsList = await this.projectManagement.listProjects();
      const projects = projectsList.projects || [];
      const activeProjectId = await this.projectManagement.getActiveProjectId();
      
      // Build context for LLM generation
      const userContext = {
        hasExistingProjects: projects.length > 0,
        projectCount: projects.length,
        hasActiveProject: !!activeProjectId,
        projectNames: projects.map(p => p.id)
      };
      
      // Build detailed project information for LLM context
      let projectDetails = '';
      if (userContext.hasExistingProjects) {
        projectDetails = '\n\nEXISTING PROJECTS TO DISPLAY:\n';
        for (let i = 0; i < projects.length; i++) {
          const project = projects[i];
          const isActive = project.id === activeProjectId;
          const lastActivity = project.last_accessed ? ` (Last activity: ${new Date(project.last_accessed).toLocaleDateString()})` : ' (No recent activity)';
          const activeStatus = isActive ? ' [CURRENTLY ACTIVE]' : '';
          projectDetails += `${i + 1}. "${project.id}"${activeStatus}${lastActivity}\n`;
          if (project.goal) {
            projectDetails += `   Goal: ${project.goal}\n`;
          }
        }
        projectDetails += '\nMake sure to display ALL these projects in an organized, easy-to-read format in the "LOAD EXISTING PROJECT" section.';
      }
      
      // Generate landing page using LLM with specific schema
      const landingPagePrompt = `Generate a landing page for the Forest Suite with this exact structure:

**Title**: "Codename: Forest"
**Subtitle**: "May no dream be too out of reach, no problem too difficult to solve, and no goal unachievable"

Then provide exactly three main action sections:

1. **START NEW PROJECT** - Guide for creating a new project
2. **LOAD EXISTING PROJECT** - Options for continuing previous work ${userContext.hasExistingProjects ? `(User has ${userContext.projectCount} existing projects - SHOW THEM ALL IN ORGANIZED LIST)` : `(User has no existing projects yet)`}
3. **LEARN ABOUT FOREST** - Invitation to ask about the suite purpose and tools

For each section, provide:
- A clear action header
- Brief description of what this option does
- Specific instructions or commands to use
${userContext.hasExistingProjects ? '- For LOAD EXISTING PROJECT: Display ALL projects in a numbered, organized list with status and activity info' : ''}

End with a brief explanation of how the Forest Suite tools work together to break down complex goals into manageable tasks.

Use engaging, inspiring language that matches the motto. Keep it concise but motivational.${projectDetails}`;
      
      // Generate landing page content (skip project-specific LLM generation for landing pages)
      // Landing pages don't need project-specific analysis, so use fallback directly
      const generatedContent = await this.generateFallbackLandingPage(userContext);
      
      return {
        content: [
          {
            type: 'text',
            text: generatedContent,
          },
        ],
      };
    } catch (err) {
      console.error('[LandingPage] Generation failed:', err.message);
      const fallbackContent = await this.generateFallbackLandingPage({ hasExistingProjects: false, projectCount: 0 });
      return {
        content: [
          {
            type: 'text',
            text: fallbackContent,
          },
        ],
      };
    }
  }
  
  /**
   * Fallback landing page with the required schema when LLM generation fails
   */
  async generateFallbackLandingPage(userContext) {
    let content = `# **Codename: Forest**\n\n*May no dream be too out of reach, no problem too difficult to solve, and no goal unachievable*\n\n---\n\n`;
    
    // Action 1: Start New Project
    content += `## 🚀 **START NEW PROJECT**\n\n`;
    content += `Transform any ambitious goal into a clear, step-by-step journey. Whether you are learning a new skill, building something amazing, or solving a complex challenge - every great achievement starts with a single project.\n\n`;
    content += `**Ready to begin?** Use: \`create_project_forest\`\n\n`;
    
    // Action 2: Load Existing Project
    content += `## 📂 **LOAD EXISTING PROJECT**\n\n`;
    if (userContext.hasExistingProjects) {
      content += `Welcome back! You have ${userContext.projectCount} project${userContext.projectCount > 1 ? 's' : ''} waiting for you. Every step forward brings you closer to your goals.\n\n`;
      
      // Get the actual projects list for the fallback
      const projectsList = await this.projectManagement.listProjects();
      const projects = projectsList.projects || [];
      const activeProjectId = await this.projectManagement.getActiveProjectId();
      
      content += `**Your Active Projects:**\n\n`;
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        const isActive = project.id === activeProjectId;
        const activeMarker = isActive ? ' ✅ **(CURRENTLY ACTIVE)**' : '';
        const lastActivity = project.last_accessed ? ` - Last activity: ${new Date(project.last_accessed).toLocaleDateString()}` : ' - No recent activity';
        
        // Show both project ID and name if available, or goal as fallback name
        const projectName = project.name || project.project_name || project.id;
        const projectGoal = project.goal || 'No goal specified';
        
        content += `### ${i + 1}. ${projectName}${activeMarker}\n`;
        content += `   **ID**: \`${project.id}\`\n`;
        content += `   **Goal**: ${projectGoal}\n`;
        content += `   **Status**: ${lastActivity}\n`;
        content += `   **Switch to**: \`switch_project_forest {"project_id": "${project.id}"}\`\n\n`;
      }
      
      content += `**Quick Actions:**\n`;
      content += `• \`current_status_forest\` - Check your current progress\n`;
      content += `• \`get_next_task_forest\` - Get next task for active project\n`;
      content += `• \`list_projects_forest\` - See all projects in detail\n\n`;
      content += `**To switch projects, use the exact project ID shown above.**\n`;
      content += `Example: \`switch_project_forest {"project_id": "your_exact_project_id"}\`\n\n`;
    } else {
      content += `No existing projects yet - but that is about to change! Your first project will be the foundation for achieving something extraordinary.\n\n`;
      content += `**Once you have projects:** Use \`list_projects_forest\` and \`switch_project_forest\`\n\n`;
    }
    
    // Action 3: Learn About Forest
    content += `## 🌲 **LEARN ABOUT FOREST**\n\n`;
    content += `New to the Forest Suite? Curious about how it works? I am here to guide you through everything - from the philosophy behind goal achievement to the practical tools that make it happen.\n\n`;
    content += `**Ask me anything:**\n`;
    content += `• "What does the Forest Suite do?"\n`;
    content += `• "How do the tools work together?"\n`;
    content += `• "What is Hierarchical Task Analysis?"\n`;
    content += `• "How can this help me achieve my goals?"\n\n`;
    
    // How it works section
    content += `---\n\n**How Forest Works:**\n\n`;
    content += `The Forest Suite uses **Hierarchical Task Analysis (HTA)** to break down any complex goal into manageable, actionable tasks. Think of it as a GPS for your ambitions - it takes you from "I want to achieve X" to "Here is exactly what to do next."\n\n`;
    content += `🎯 **Goal Clarity** → 🌳 **Task Breakdown** → 📋 **Next Actions** → 🏆 **Achievement**\n\n`;
    content += `Every tool in the suite works together to keep you moving forward, one meaningful step at a time.`;
    
    return content;
  }

  /**
   * GATED ONBOARDING FLOW METHODS
   */

  async startLearningJourney(args) {
    try {
      const { initial_goal, goal, user_context = {} } = args;
      const actualGoal = initial_goal || goal;
      
      if (!actualGoal) {
        return {
          content: [{
            type: 'text',
            text: '**Goal Required** ❌\n\nPlease provide a learning goal to start your journey.\n\nExample: `start_learning_journey_forest` with goal "Learn React development"'
          }]
        };
      }

      const result = await this.gatedOnboarding.startNewProject(actualGoal, user_context);
      
      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `**Onboarding Issue** ⚠️\n\n${result.message}\n\n**Suggestions**:\n${(result.suggestions || []).map(s => `• ${s}`).join('\n')}`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `**🎯 Learning Journey Started!**\n\n${result.message}\n\n**Project ID**: ${result.projectId}\n**Goal**: ${actualGoal}\n\n**Next Step**: ${result.next_action?.description || 'Continue with context gathering'}\n\nUse \`continue_onboarding_forest\` to proceed through the guided setup process.`
        }],
        success: true,
        project_id: result.projectId,
        onboarding_stage: result.stage
      };

    } catch (error) {
      console.error('Stage1CoreServer.startLearningJourney failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**Learning Journey Failed** ❌\n\nError: ${error.message}\n\nPlease try again with a clear learning goal.`
        }],
        error: error.message
      };
    }
  }

  async continueOnboarding(args) {
    try {
      const activeProject = await this.projectManagement.getActiveProject();
      if (!activeProject || !activeProject.project_id) {
        return {
          content: [{
            type: 'text',
            text: '**No Active Project** ❌\n\nStart a learning journey first with \`start_learning_journey_forest\`'
          }]
        };
      }

      const projectId = activeProject.project_id;
      const { stage, input_data, inputData, context, ...rest } = args;
      // Support both camelCase and snake_case plus direct context field
      let mergedInput = input_data || inputData || {};
      if (context && !mergedInput.context) {
        mergedInput.context = context;
      }
      // Merge any additional top-level props into mergedInput for maximum flexibility
      mergedInput = { ...mergedInput, ...rest };

      const result = await this.gatedOnboarding.continueOnboarding(projectId, stage, mergedInput);
      
      let responseText = `**🚀 Onboarding Progress**\n\n${result.message}\n\n`;
      
      // Use the stage from result instead of potentially undefined input stage
      const currentStage = result.stage || stage || 'unknown';
      
      if (result.gate_status === 'passed') {
        responseText += `✅ **${currentStage}** stage completed!\n\n`;
      } else if (result.gate_status === 'blocked') {
        responseText += `⛔ **${currentStage}** stage blocked - action required\n\n`;
      } else if (result.gate_status === 'in_progress') {
        responseText += `⏳ **${currentStage}** stage in progress\n\n`;
      }
      
      // Add suggestions if provided
      if (result.suggestions && result.suggestions.length > 0) {
        responseText += `**Suggestions**:\n`;
        result.suggestions.forEach(suggestion => {
          responseText += `• ${suggestion}\n`;
        });
        responseText += `\n`;
      }

      if (result.next_action) {
        responseText += `**Next Action**: ${result.next_action.description}\n`;
        responseText += `**Command**: ${result.next_action.command}\n\n`;
      }

      if (result.onboarding_complete) {
        responseText += `🎉 **Onboarding Complete!** Your personalized learning system is ready.\n\nUse \`get_next_pipeline_forest\` to see your learning pipeline.`;
      }

      return {
        content: [{ type: 'text', text: responseText }],
        success: result.success,
        project_id: projectId,
        onboarding_stage: result.stage,
        gate_status: result.gate_status
      };

    } catch (error) {
      console.error('Stage1CoreServer.continueOnboarding failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**Onboarding Error** ❌\n\nError: ${error.message}\n\nUse \`get_onboarding_status_forest\` to check current status.`
        }],
        error: error.message
      };
    }
  }

  async getOnboardingStatus(args) {
    try {
      const activeProject = await this.projectManagement.getActiveProject();
      if (!activeProject || !activeProject.project_id) {
        return {
          content: [{
            type: 'text',
            text: '**No Active Project** ❌\n\nStart a learning journey first with \`start_learning_journey_forest\`'
          }]
        };
      }

      const projectId = activeProject.project_id;
      const result = await this.gatedOnboarding.getOnboardingStatus(projectId);
      
      if (!result.success) {
        return {
          content: [{
            type: 'text',
            text: `**No Onboarding Found** 📭\n\nNo onboarding process found for this project.\n\nStart with \`start_learning_journey_forest\``
          }]
        };
      }

      let statusText = `**📊 Onboarding Status**\n\n`;
      statusText += `**Project**: ${projectId}\n`;
      statusText += `**Current Stage**: ${result.onboarding_status.current_stage}\n`;
      statusText += `**Progress**: ${result.onboarding_status.progress}%\n\n`;
      
      statusText += `**Gates Progress**:\n`;
      result.gates_progress.forEach(gate => {
        statusText += `${gate.status} ${gate.name}\n`;
      });
      
      statusText += `\n**Next Action**: ${result.next_action.description}\n`;
      statusText += `**Command**: ${result.next_action.command}`;

      return {
        content: [{ type: 'text', text: statusText }],
        success: true,
        project_id: projectId,
        onboarding_status: result.onboarding_status
      };

    } catch (error) {
      console.error('Stage1CoreServer.getOnboardingStatus failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**Status Check Failed** ❌\n\nError: ${error.message}`
        }],
        error: error.message
      };
    }
  }

  async completeOnboarding(args) {
    try {
      if (!args.final_confirmation) {
        return {
          content: [{
            type: 'text',
            text: '**Onboarding Completion Requires Confirmation** ⚠️\n\nPlease set final_confirmation: true to complete the onboarding process.'
          }],
          error: 'final_confirmation required'
        };
      }

      const result = await this.gatedOnboardingFlow.completeOnboarding();
      
      return {
        content: [{
          type: 'text',
          text: result.message || '**Onboarding Complete!** ✅\n\nYour project is now fully set up and ready for task execution. Use `get_next_task_forest` to begin your learning journey!'
        }],
        success: true,
        onboarding_complete: true
      };

    } catch (error) {
      console.error('Stage1CoreServer.completeOnboarding failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**Onboarding Completion Failed** ❌\n\nError: ${error.message}`
        }],
        error: error.message
      };
    }
  }

  /**
   * NEXT + PIPELINE PRESENTATION METHODS
   */

  async getNextPipeline(args) {
    try {
      const activeProject = await this.projectManagement.getActiveProject();
      if (!activeProject || !activeProject.project_id) {
        return {
          content: [{
            type: 'text',
            text: '**No Active Project** ❌\n\nCreate or switch to a project first to see your learning pipeline.'
          }]
        };
      }

      const projectId = activeProject.project_id;
      const userContext = {
        energyLevel: args.energy_level || 3,
        timeAvailable: args.time_available || '30 minutes',
        ...args.context
      };

      const result = await this.pipelinePresenter.generateNextPipeline(projectId, userContext);
      
      return {
        content: result.content,
        success: true,
        project_id: projectId,
        pipeline_info: {
          total_tasks: result.total_pipeline_tasks,
          presentation_type: result.presentation_type
        }
      };

    } catch (error) {
      console.error('Stage1CoreServer.getNextPipeline failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**Pipeline Generation Failed** ❌\n\nError: ${error.message}\n\nTry using \`get_next_task_forest\` for a single task recommendation.`
        }],
        error: error.message
      };
    }
  }

  async evolvePipeline(args) {
    try {
      const activeProject = await this.projectManagement.getActiveProject();
      if (!activeProject || !activeProject.project_id) {
        return {
          content: [{
            type: 'text',
            text: '**No Active Project** ❌\n\nCreate or switch to a project first to evolve your pipeline.'
          }]
        };
      }

      const projectId = activeProject.project_id;
      
      // Determine if this was auto-triggered
      const isAutoTriggered = args.auto_triggered || false;
      const evolutionReason = args.evolution_reason || 'Manual evolution requested';
      
      // Trigger strategy evolution first
      const evolutionResult = await this.taskStrategyCore.evolveStrategy({
        project_id: projectId,
        evolution_triggers: args.triggers || {},
        context: args.context || {},
        auto_triggered: isAutoTriggered,
        pipeline_focus: true
      });

      // Generate fresh pipeline with evolved strategy
      const pipelineResult = await this.pipelinePresenter.generateNextPipeline(projectId, {
        energyLevel: args.energy_level || 3,
        timeAvailable: args.time_available || '30 minutes',
        ...args.context
      });

      const autoIndicator = isAutoTriggered ? '🤖 **Auto-Evolution Triggered**\n\n' : '';
      const reasonText = isAutoTriggered ? `**Reason**: ${evolutionReason}\n\n` : '';

      return {
        content: [{
          type: 'text',
          text: `${autoIndicator}**🔄 Pipeline Evolved!**\n\n${reasonText}Your learning pipeline has been updated based on your progress and changing patterns.\n\n**Evolution Summary**: ${evolutionResult.summary || 'Strategy adapted to current context'}\n\n**Fresh Pipeline Generated**: ${pipelineResult.total_pipeline_tasks || 0} tasks ready\n\n---\n\n${pipelineResult.content[0]?.text || 'Pipeline updated successfully'}`
        }],
        success: true,
        project_id: projectId,
        evolution_result: evolutionResult,
        fresh_pipeline: pipelineResult,
        auto_triggered: isAutoTriggered
      };

    } catch (error) {
      console.error('Stage1CoreServer.evolvePipeline failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**Pipeline Evolution Failed** ❌\n\nError: ${error.message}\n\nYour existing pipeline remains available.`
        }],
        error: error.message
      };
    }
  }


  getServer() {
    return this.server;
  }

  getServerInfo() {
    return {
      name: 'forest-mcp-server',
      version: '1.0.0'
    };
  }

  /**
   * Handle factory reset - delete project(s) with confirmation
   */
  async handleFactoryReset(args) {
    try {
      const { confirmation, backup_first } = args;
      
      // Safety check - require explicit confirmation
      if (confirmation !== 'RESET_CONFIRMED') {
        return {
          content: [{
            type: 'text',
            text: '**⚠️ Factory Reset Cancelled**\n\nFor safety, factory reset requires explicit confirmation.\n\n' +
                  'To proceed, you must provide: `confirmation: "RESET_CONFIRMED"`\n\n' +
                  '**WARNING**: This will permanently delete ALL project data that cannot be recovered.'
          }]
        };
      }
      
      // Create backup if requested
      if (backup_first) {
        // Note: Actual backup implementation would go here
        console.log('Factory reset: Backup requested but not yet implemented');
      }
      
      // All projects reset
      const allProjects = await this.projectManagement.listProjects();
      const deletedProjects = [];
      const errors = [];
      
      for (const project of allProjects.projects) {
        try {
          await this.dataPersistence.deleteProject(project.id);
          deletedProjects.push(project.id);
        } catch (error) {
          errors.push({
            projectId: project.id,
            error: error.message
          });
        }
      }
      
      // Clear active project by updating global config
      const globalData = (await this.dataPersistence.loadGlobalData('config.json')) || { projects: [] };
      globalData.activeProject = null;
      globalData.projects = []; // Clear project list too since all are deleted
      await this.dataPersistence.saveGlobalData('config.json', globalData);
      this.projectManagement.activeProjectId = null;
      
      // ENHANCED: Clear all persistent storage including database files
      const clearResult = await this.dataPersistence.clearAllPersistentStorage();
      
      const resetResult = {
        type: 'all_projects',
        deletedProjects: deletedProjects,
        errors: errors,
        clearResult: clearResult,
        message: `Factory reset completed. ${deletedProjects.length} projects deleted${errors.length > 0 ? ` with ${errors.length} errors` : ''}. ${clearResult.message}`,
        timestamp: new Date().toISOString()
      };
      
      // Clear in-memory cache after everything is deleted
      this.dataPersistence.clearCache();
      
      return {
        content: [{
          type: 'text',
          text: `**🔄 Factory Reset Complete**\n\n` +
                `**Type**: ${resetResult.type === 'single_project' ? 'Single Project' : 'All Projects'}\n` +
                `**Result**: ${resetResult.message}\n` +
                `**Timestamp**: ${resetResult.timestamp}\n\n` +
                `**Confirmation**: ${confirmation}\n\n` +
                (resetResult.errors && resetResult.errors.length > 0 ? 
                  `**Errors**: ${resetResult.errors.map(e => `${e.projectId}: ${e.error}`).join(', ')}\n\n` : '') +
                '**Next Steps**: Create a new project to continue using Forest.'
        }],
        success: true,
        resetResult: resetResult
      };
      
    } catch (error) {
      console.error('Stage1CoreServer.handleFactoryReset failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**❌ Factory Reset Failed**\n\nError: ${error.message}\n\nPlease try again or contact support if the issue persists.`
        }],
        success: false,
        error: error.message
      };
    }
  }




  // Production readiness test methods - expose core functionality
  async createProject(args) {
    return await this.projectManagement.createProject(args);
  }

  async buildHTATree(args) {
    return await this.buildHTATreeVectorized(args);
  }

  async getHTAStatus() {
    return await this.htaCore.getHTAStatus();
  }

  async getVectorizationStatus() {
    return await this.vectorizedHandlers.getVectorizationStatus({});
  }

  async getNextTask(args) {
    return await this.taskStrategyCore.getNextTask(args);
  }

  async cleanup() {
    try {
      this.logger.info?.('[Stage1CoreServer] Starting cleanup...');

      // Stop background services
      try {
        this.htaExpansionAgent?.stop();
        this.backgroundProcessor?.stop();
      } catch (_) { /* ignore */ }

      // ChromaDB shutdown removed - using SQLite vector provider only

      // Clear caches
      this.dataPersistence.clearCache();

      // Clear memory sync queue
      this.memorySync.clearQueue();

      this.logger.info?.('[Stage1CoreServer] Cleanup complete');
    } catch (error) {
      this.logger.error?.('[Stage1CoreServer] Cleanup failed', {
        error: error.message,
      });
    }
  }
}

// Lowercase default export for compatibility with case-sensitive loaders
export default Stage1CoreServer;
export const stage1CoreServer = Stage1CoreServer;
export { Stage1CoreServer };

// Re-export existing server for backward compatibility during transition



// Note: MCP server startup is handled by dedicated entry points:
// - forest-mcp-server.js (direct entry point)  
// - start-server.js (with core-initialization.js)
