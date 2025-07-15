/**
 * Project Management Module - Consolidated Project Lifecycle Management
 * Optimized from project-management.js - Preserves project creation, switching, and lifecycle
 */

import { FILE_NAMES, DEFAULT_PATHS } from './memory-sync.js';

// Constants for project management operations
const PROJECT_MANAGEMENT_CONSTANTS = {
  HIGH_PRIORITY_THRESHOLD: 3,
  MEDIUM_PRIORITY_THRESHOLD: 2,
  COMPLEX_PRIORITY_BOOST: 4,
  MODERATE_PRIORITY_BOOST: 3,
  SIMPLE_PRIORITY_BOOST: 2,
  COMPLETION_IMPROVEMENT_THRESHOLD: 3,
  STAGNATION_MULTIPLIER: 0.5,
  TASK_COMPLETION_BOOST: 10,
  PROGRESS_PERCENTAGE_MULTIPLIER: 100,
};

// Use simple console logger for Stage1 to avoid complex initialization
const loggerModule = {
  /** @returns {{debug: function(...args: any[]): void, info: function(...args: any[]): void, warn: function(...args: any[]): void, error: function(...args: any[]): void}} */
  getLogger: async () => ({
    // args: any[]
    debug: (...args) => console.error('[DEBUG]', ...args),
    // args: any[]
    info: (...args) => console.error('[INFO]', ...args),
    // args: any[]
    warn: (...args) => console.warn('[WARN]', ...args),
    // args: any[]
    error: (...args) => console.error('[ERROR]', ...args),
  }),
};

export class ProjectManagement {
  /**
   * @param {*} dataPersistence
   */
  constructor(dataPersistence) {
    this.dataPersistence = dataPersistence;
    this.logger = null; // Will be initialized lazily
    this.activeProjectId = null;
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * @returns {Promise<any>}
   */
  async getLogger() {
    if (!this.logger) {
      this.logger = await loggerModule.getLogger();
    }
    return this.logger;
  }

  /**
   * Initialize the ProjectManagement instance by loading the active project from global config
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this._doInitialize();
    await this.initPromise;
  }

  async _doInitialize() {
    try {
      const logger = await this.getLogger();
      logger.debug('[ProjectManagement] Initializing project management');

      // Load active project from global config
      const globalData = await this.dataPersistence.loadGlobalData(FILE_NAMES.CONFIG);
      if (globalData?.activeProject) {
        // Verify the active project exists
        if (await this.dataPersistence.projectExists(globalData.activeProject)) {
          this.activeProjectId = globalData.activeProject;
          logger.info('[ProjectManagement] Loaded active project from config', { 
            project_id: this.activeProjectId 
          });
        } else {
          logger.warn('[ProjectManagement] Active project in config does not exist', { 
            project_id: globalData.activeProject 
          });
          // Clear invalid active project from global config
          globalData.activeProject = null;
          await this.dataPersistence.saveGlobalData(FILE_NAMES.CONFIG, globalData);
        }
      } else {
        logger.debug('[ProjectManagement] No active project found in global config');
      }

      this.initialized = true;
      logger.debug('[ProjectManagement] Initialization completed', { 
        activeProjectId: this.activeProjectId 
      });
    } catch (error) {
      const logger = await this.getLogger();
      logger.error('[ProjectManagement] Initialization failed', { error: error.message });
      // Don't throw - allow the system to work without initialization
      this.initialized = true;
    }
  }

  /**
   * Ensure initialization before any operation that depends on active project state
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * @param {Object} params
   * @returns {Promise<any>}
   */
  async createProject({
    project_id,
    goal,
    specific_interests = [],
    learning_paths = [],
    context = '',
    constraints = {},
    existing_credentials = [],
    current_habits = {},
    life_structure_preferences = {},
    urgency_level = 'medium',
    success_metrics = [],
  }) {
    try {
      const logger = await this.getLogger();
      logger.info('[ProjectManagement] Creating project', { project_id, goal });

      // Auto-generate project ID if not provided
      if (!project_id) {
        project_id = this.generateProjectId(goal);
      }
      
      // Validate required fields
      if (!goal) {
        throw new Error('Goal is required');
      }

      // Check if project already exists
      if (await this.dataPersistence.projectExists(project_id)) {
        throw new Error(`Project ${project_id} already exists`);
      }

      // Calculate knowledge boost from existing credentials
      const { knowledgeLevel, skillMappings } = this.calculateKnowledgeBoost(
        existing_credentials,
        goal
      );

      const projectConfig = {
        id: project_id,
        goal,
        specific_interests,
        learning_paths:
          learning_paths.length > 0
            ? learning_paths
            : [{ path_name: DEFAULT_PATHS.GENERAL, priority: 'high' }],
        context,
        constraints,
        existing_credentials,
        current_habits,
        life_structure_preferences,
        urgency_level,
        success_metrics,
        created_at: new Date().toISOString(),
        knowledge_level: knowledgeLevel,
        skill_mappings: skillMappings,
        progress: 0,
        activePath: learning_paths.length > 0 ? learning_paths[0].path_name : DEFAULT_PATHS.GENERAL,
      };

      // Begin transaction for atomic project creation
      const transaction = this.dataPersistence.beginTransaction();

      try {
        // Save project configuration
        await this.dataPersistence.saveProjectData(
          project_id,
          FILE_NAMES.CONFIG,
          projectConfig,
          transaction
        );

        // Update global configuration with enhanced error handling
        logger.info('[ProjectManagement] Loading global configuration for project registration');
        let globalData;
        try {
          globalData = await this.dataPersistence.loadGlobalData(FILE_NAMES.CONFIG);
        } catch (error) {
          logger.warn('[ProjectManagement] Failed to load global config, creating new one', { error: error.message });
          globalData = null;
        }
        
        // Initialize global data structure if missing or invalid
        if (!globalData || typeof globalData !== 'object') {
          globalData = { projects: [] };
          logger.info('[ProjectManagement] Initialized new global configuration');
        }
        
        // Ensure projects array exists and is valid
        if (!Array.isArray(globalData.projects)) {
          globalData.projects = [];
          logger.info('[ProjectManagement] Initialized projects array in global config');
        }
        
        // Check if project already exists in global config
        const existingProjectIndex = globalData.projects.findIndex(p => p && p.id === project_id);
        const projectEntry = {
          id: project_id,
          goal,
          created_at: projectConfig.created_at,
          last_accessed: new Date().toISOString(),
        };
        
        if (existingProjectIndex === -1) {
          globalData.projects.push(projectEntry);
          logger.info('[ProjectManagement] Added new project to global config', { project_id, totalProjects: globalData.projects.length });
        } else {
          globalData.projects[existingProjectIndex] = projectEntry;
          logger.info('[ProjectManagement] Updated existing project in global config', { project_id });
        }

        // Set as active project
        globalData.activeProject = project_id;
        logger.info('[ProjectManagement] Set active project in global config', { project_id });
        
        // Save updated global configuration
        try {
          await this.dataPersistence.saveGlobalData(FILE_NAMES.CONFIG, globalData, transaction);
          logger.info('[ProjectManagement] Successfully saved global configuration', { 
            project_id, 
            projectsCount: globalData.projects.length,
            activeProject: globalData.activeProject 
          });
        } catch (error) {
          logger.error('[ProjectManagement] Failed to save global configuration', { 
            project_id, 
            error: error.message 
          });
          throw new Error(`Failed to update global configuration: ${error.message}`);
        }

        // Initialize empty data files
        await this.initializeProjectData(project_id, learning_paths, transaction);

        // Commit transaction
        await this.dataPersistence.commitTransaction(transaction);

        // Set as active project
        this.activeProjectId = project_id;

        logger.info('[ProjectManagement] Project created successfully', {
          project_id,
          learning_paths: learning_paths.length,
          knowledge_level: knowledgeLevel,
        });

        return {
          success: true,
          content: [
            {
              type: 'text',
              text:
                `**Project Created Successfully!** 🎉\n\n` +
                `**Project ID**: ${project_id}\n` +
                `**Goal**: ${goal}\n` +
                `**Learning Paths**: ${learning_paths.length > 0 ? learning_paths.map(function(p){return p.path_name;}).join(', ') : DEFAULT_PATHS.GENERAL}\n` +
                `**Knowledge Level**: ${knowledgeLevel}/10\n` +
                `**Urgency**: ${urgency_level}\n\n` +
                `Your project is now active and ready for HTA tree building. Use \`build_hta_tree_forest\` to create your strategic learning framework!`,
            },
          ],
          project_id,
          knowledge_level: knowledgeLevel,
          skill_mappings: skillMappings,
        };
      } catch (error) {
        // Rollback transaction on error
        await this.dataPersistence.rollbackTransaction(transaction);
        return {
        success: false,
        message: 'Failed during project data initialization',
        error: error.message
      };
      }
    } catch (error) {
      const logger = await this.getLogger();
      logger.error('[ProjectManagement] Project creation failed', {
        project_id,
        error: error.message,
      });

      return {
        success: false,
        content: [
          {
            type: 'text',
            text: `**Project Creation Failed**\n\nError: ${error.message}\n\nPlease check your input and try again.`,
          },
        ],
        error: error.message,
      };
    }
  }

  async switchProject(project_id) {
    try {
      await this.ensureInitialized();
      const logger = await this.getLogger();
      logger.info('[ProjectManagement] Switching to project', { project_id });

      // Check if project exists
      if (!(await this.dataPersistence.projectExists(project_id))) {
        throw new Error(`Project ${project_id} does not exist`);
      }

      // Load project config to verify it's valid
      const config = await this.dataPersistence.loadProjectData(project_id, FILE_NAMES.CONFIG);
      if (!config) {
        throw new Error(`Project ${project_id} has invalid configuration`);
      }

      // Update global config with transaction to ensure atomicity
      const transaction = this.dataPersistence.beginTransaction();
      
      try {
        const globalData = (await this.dataPersistence.loadGlobalData(FILE_NAMES.CONFIG)) || {
          projects: [],
        };
        if (!Array.isArray(globalData.projects)) {
          globalData.projects = [];
        }
        globalData.activeProject = project_id;

        // Update last accessed time
        const projectEntry = globalData.projects.find(p => p.id === project_id);
        if (projectEntry) {
          projectEntry.last_accessed = new Date().toISOString();
        }

        // Save with transaction
        await this.dataPersistence.saveGlobalData(FILE_NAMES.CONFIG, globalData, transaction);
        
        // Commit transaction
        await this.dataPersistence.commitTransaction(transaction);
        
        // Set as active project AFTER successful save
        this.activeProjectId = project_id;
        
        logger.info('[ProjectManagement] Project switch completed successfully', { 
          project_id,
          activeProjectId: this.activeProjectId 
        });
      } catch (error) {
        // Rollback on error
        await this.dataPersistence.rollbackTransaction(transaction);
        throw error;
      }

      logger.info('[ProjectManagement] Project switched successfully', { project_id });

      return {
        content: [
          {
            type: 'text',
            text:
              `**Switched to Project: ${project_id}** ✅\n\n` +
              `**Goal**: ${config.goal}\n` +
              `**Active Path**: ${config.activePath || DEFAULT_PATHS.GENERAL}\n` +
              `**Progress**: ${config.progress || 0}%\n\n` +
              `Project is now active. Use \`get_next_task_forest\` to continue your learning journey!`,
          },
        ],
        project_id,
        project_config: config,
      };
    } catch (error) {
      const logger = await this.getLogger();
      logger.error('[ProjectManagement] Project switch failed', {
        project_id,
        error: error.message,
      });

      return {
        content: [
          {
            type: 'text',
            text: `**Project Switch Failed**\n\nError: ${error.message}\n\nPlease check the project ID and try again.`,
          },
        ],
        error: error.message,
      };
    }
  }

  async listProjects() {
    try {
      const logger = await this.getLogger();
      logger.debug('[ProjectManagement] Listing projects');

      const projects = await this.dataPersistence.getProjectList();
      const globalData = await this.dataPersistence.loadGlobalData(FILE_NAMES.CONFIG);
      const activeProjectId = globalData?.activeProject;

      if (projects.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `**No Projects Found** 📂\n\nCreate your first project with \`create_project_forest\` to get started!`,
            },
          ],
          projects: [],
        };
      }

      let projectList = `**Your Projects** 📋\n\n`;

      projects.forEach((project, index) => {
        const isActive = project.id === activeProjectId;
        const status = isActive ? '🟢 ACTIVE' : '⚪ Inactive';
        const createdDate = new Date(project.created_at).toLocaleDateString();

        projectList += `**${index + 1}. ${project.id}** ${status}\n`;
        projectList += `   Goal: ${project.goal}\n`;
        projectList += `   Created: ${createdDate}\n`;
        projectList += `   Progress: ${project.progress}%\n\n`;
      });

      projectList += `Use \`switch_project_forest\` to change active project.`;

      return {
        content: [
          {
            type: 'text',
            text: projectList,
          },
        ],
        projects,
        active_project: activeProjectId,
      };
    } catch (error) {
      const logger = await this.getLogger();
      logger.error('[ProjectManagement] Failed to list projects', {
        error: error.message,
      });

      return {
        content: [
          {
            type: 'text',
            text: `**Failed to List Projects**\n\nError: ${error.message}`,
          },
        ],
        error: error.message,
      };
    }
  }

  async getActiveProject() {
    try {
      await this.ensureInitialized();
      
      // First check if we have a cached active project
      if (this.activeProjectId) {
        const config = await this.dataPersistence.loadProjectData(
          this.activeProjectId,
          FILE_NAMES.CONFIG
        );
        if (config) {
          const logger = await this.getLogger();
          logger.debug('[ProjectManagement] Active project found in cache', { project_id: this.activeProjectId });
          return {
            content: [
              {
                type: 'text',
                text:
                  `**Active Project: ${this.activeProjectId}** 🎯\n\n` +
                  `**Goal**: ${config.goal}\n` +
                  `**Active Path**: ${config.activePath || DEFAULT_PATHS.GENERAL}\n` +
                  `**Progress**: ${config.progress || 0}%\n` +
                  `**Created**: ${new Date(config.created_at).toLocaleDateString()}\n` +
                  `**Urgency**: ${config.urgency_level}\n\n` +
                  `Use \`get_next_task_forest\` to continue your learning journey!`,
              },
            ],
            project_id: this.activeProjectId,
            project_config: config,
          };
        } else {
          // Cached project no longer exists, clear cache
          const logger = await this.getLogger();
          logger.warn('[ProjectManagement] Cached active project no longer exists', { project_id: this.activeProjectId });
          this.activeProjectId = null;
        }
      }

      // Load from global config
      const globalData = await this.dataPersistence.loadGlobalData(FILE_NAMES.CONFIG);
      const activeProjectId = globalData?.activeProject;

      if (!activeProjectId) {
        return {
          content: [
            {
              type: 'text',
              text: `**No Active Project** ❌\n\nCreate a project with \`create_project_forest\` or switch to an existing one with \`switch_project_forest\`.`,
            },
          ],
          project_id: null,
        };
      }

      const config = await this.dataPersistence.loadProjectData(activeProjectId, FILE_NAMES.CONFIG);
      if (!config) {
        return {
          content: [
            {
              type: 'text',
              text: `**Active Project Invalid** ⚠️\n\nProject ${activeProjectId} configuration not found. Please switch to a valid project.`,
            },
          ],
          project_id: null,
          error: 'Invalid project configuration',
        };
      }

      // Cache the active project
      this.activeProjectId = activeProjectId;

      return {
        content: [
          {
            type: 'text',
            text:
              `**Active Project: ${activeProjectId}** 🎯\n\n` +
              `**Goal**: ${config.goal}\n` +
              `**Active Path**: ${config.activePath || DEFAULT_PATHS.GENERAL}\n` +
              `**Progress**: ${config.progress || 0}%\n` +
              `**Created**: ${new Date(config.created_at).toLocaleDateString()}\n` +
              `**Urgency**: ${config.urgency_level}\n\n` +
              `Use \`get_next_task_forest\` to continue your learning journey!`,
          },
        ],
        project_id: activeProjectId,
        project_config: config,
      };
    } catch (error) {
      const logger = await this.getLogger();
      logger.error('[ProjectManagement] Failed to get active project', {
        error: error.message,
      });

      return {
        content: [
          {
            type: 'text',
            text: `**Error Getting Active Project**\n\nError: ${error.message}`,
          },
        ],
        error: error.message,
      };
    }
  }

  // ===== UTILITY METHODS =====

  calculateKnowledgeBoost(existingCredentials, goal) {
    let knowledgeLevel = 1; // Base level
    const skillMappings = [];

    if (!existingCredentials || existingCredentials.length === 0) {
      return { knowledgeLevel, skillMappings };
    }

    existingCredentials.forEach(credential => {
      const { subject_area, level, relevance_to_goal } = credential;

      // Calculate relevance score
      let relevanceScore = 0;
      if (relevance_to_goal && typeof relevance_to_goal === 'string') {
        const relevanceText = relevance_to_goal.toLowerCase();
        if (relevanceText.includes('directly') || relevanceText.includes('very')) {
          relevanceScore = PROJECT_MANAGEMENT_CONSTANTS.HIGH_PRIORITY_THRESHOLD;
        } else if (relevanceText.includes('somewhat') || relevanceText.includes('related')) {
          relevanceScore = PROJECT_MANAGEMENT_CONSTANTS.MEDIUM_PRIORITY_THRESHOLD;
        } else if (relevanceText.includes('tangentially') || relevanceText.includes('slightly')) {
          relevanceScore = 1;
        }
      }

      // Calculate level score
      let levelScore = 1;
      if (level && typeof level === 'string') {
        const levelText = level.toLowerCase();
        if (levelText.includes('expert') || levelText.includes('advanced')) {
          levelScore = PROJECT_MANAGEMENT_CONSTANTS.COMPLEX_PRIORITY_BOOST;
        } else if (levelText.includes('intermediate')) {
          levelScore = PROJECT_MANAGEMENT_CONSTANTS.MODERATE_PRIORITY_BOOST;
        } else if (levelText.includes('beginner')) {
          levelScore = PROJECT_MANAGEMENT_CONSTANTS.SIMPLE_PRIORITY_BOOST;
        }
      }

      const boost = Math.min(
        PROJECT_MANAGEMENT_CONSTANTS.HIGH_PRIORITY_THRESHOLD,
        relevanceScore * levelScore * PROJECT_MANAGEMENT_CONSTANTS.STAGNATION_MULTIPLIER
      );
      knowledgeLevel += boost;

      skillMappings.push({
        subject: subject_area,
        level: levelScore,
        relevance: relevanceScore,
        boost,
      });
    });

    // Cap knowledge level at 10
    knowledgeLevel = Math.min(
      PROJECT_MANAGEMENT_CONSTANTS.TASK_COMPLETION_BOOST,
      Math.round(knowledgeLevel)
    );

    return { knowledgeLevel, skillMappings };
  }

  async initializeProjectData(projectId, learningPaths, transaction = null) {
    try {
      // Initialize learning history
      const learningHistory = {
        completedTopics: [],
        totalHours: 0,
        streakDays: 0,
        lastActivity: null,
        milestones: [],
      };

      await this.dataPersistence.saveProjectData(
        projectId,
        FILE_NAMES.LEARNING_HISTORY,
        learningHistory,
        transaction
      );

      // Initialize daily schedule
      const dailySchedule = {
        schedules: {},
        preferences: {
          defaultFocusDuration: 25,
          breakDuration: 5,
          longBreakInterval: 4,
        },
        lastGenerated: null,
      };

      await this.dataPersistence.saveProjectData(
        projectId,
        FILE_NAMES.DAILY_SCHEDULE,
        dailySchedule,
        transaction
      );

      // Initialize path-specific data for each learning path
      for (const path of learningPaths) {
        const pathName = path.path_name;
        // Always use canonical path name
        await this.dataPersistence.savePathData(
          projectId,
          pathName,
          FILE_NAMES.LEARNING_HISTORY,
          { ...learningHistory },
          transaction
        );
      }

      const logger = await this.getLogger();
      logger.debug('[ProjectManagement] Project data initialized', {
        projectId,
        pathCount: learningPaths.length,
      });

      return true;
    } catch (error) {
      const logger = await this.getLogger();
      logger.error('[ProjectManagement] Failed to initialize project data', {
        projectId,
        error: error.message,
      });
      throw error;
    }
  }

  async updateProjectProgress(projectId, progress) {
    try {
      await this.ensureInitialized();
      const config = await this.dataPersistence.loadProjectData(projectId, FILE_NAMES.CONFIG);
      if (!config) {
        throw new Error(`Project ${projectId} not found`);
      }

      config.progress = Math.max(
        0,
        Math.min(PROJECT_MANAGEMENT_CONSTANTS.PROGRESS_PERCENTAGE_MULTIPLIER, progress)
      );
      config.last_updated = new Date().toISOString();

      await this.dataPersistence.saveProjectData(projectId, FILE_NAMES.CONFIG, config);

      const logger = await this.getLogger();
      logger.debug('[ProjectManagement] Project progress updated', {
        projectId,
        progress: config.progress,
      });

      return config.progress;
    } catch (error) {
      const logger = await this.getLogger();
      logger.error('[ProjectManagement] Failed to update project progress', {
        projectId,
        progress,
        error: error.message,
      });
      throw error;
    }
  }

  async setActivePath(projectId, pathName) {
    try {
      await this.ensureInitialized();
      const config = await this.dataPersistence.loadProjectData(projectId, FILE_NAMES.CONFIG);
      if (!config) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Validate path exists in project
      const pathExists = config.learning_paths.some(path => path.path_name === pathName);
      if (!pathExists && pathName !== DEFAULT_PATHS.GENERAL) {
        throw new Error(`Learning path ${pathName} not found in project`);
      }

      // Always set activePath to the canonical path
      config.activePath = pathName;
      config.last_updated = new Date().toISOString();

      await this.dataPersistence.saveProjectData(projectId, FILE_NAMES.CONFIG, config);

      const logger = await this.getLogger();
      logger.info('[ProjectManagement] Active path updated', {
        projectId,
        pathName,
      });

      return pathName;
    } catch (error) {
      const logger = await this.getLogger();
      logger.error('[ProjectManagement] Failed to set active path', {
        projectId,
        pathName,
        error: error.message,
      });
      throw error;
    }
  }

  async getActiveProjectId() {
    await this.ensureInitialized();
    return this.activeProjectId;
  }

  async validateProject(projectId) {
    try {
      if (!(await this.dataPersistence.projectExists(projectId))) {
        return { valid: false, error: 'Project does not exist' };
      }

      const config = await this.dataPersistence.loadProjectData(projectId, FILE_NAMES.CONFIG);
      if (!config) {
        return { valid: false, error: 'Project configuration not found' };
      }

      if (!config.goal || !config.id) {
        return { valid: false, error: 'Project configuration is incomplete' };
      }

      return { valid: true, config };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Generate a project ID from the goal
   */
  generateProjectId(goal) {
    const words = goal.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 3);
    
    const base = words.join('_') || 'project';
    return `${base}_${Date.now().toString(36).slice(-4)}`;
  }

  /**
   * Require an active project or throw an error
   * This method is used by other modules that need to ensure a project is active
   */
  async requireActiveProject() {
    await this.ensureInitialized();
    const logger = await this.getLogger();
    
    // Try multiple methods to get active project
    let projectId = this.activeProjectId;
    let config = null;
    
    // Method 1: Use cached project ID
    if (projectId) {
      config = await this.dataPersistence.loadProjectData(projectId, FILE_NAMES.CONFIG);
      if (config) {
        logger.debug('[ProjectManagement] Active project found in cache', { project_id: projectId });
        return { projectId, config };
      }
    }
    
    // Method 2: Load from global config
    const globalData = await this.dataPersistence.loadGlobalData(FILE_NAMES.CONFIG);
    if (globalData?.activeProject) {
      projectId = globalData.activeProject;
      config = await this.dataPersistence.loadProjectData(projectId, FILE_NAMES.CONFIG);
      if (config) {
        // Update cache
        this.activeProjectId = projectId;
        logger.debug('[ProjectManagement] Active project found in global config', { project_id: projectId });
        return { projectId, config };
      }
    }

    // --- Fallback: auto-activate sole existing project ---
    const allProjects = await this.dataPersistence.getProjectList();
    if (allProjects && allProjects.length === 1) {
      projectId = allProjects[0].id;
      config = await this.dataPersistence.loadProjectData(projectId, FILE_NAMES.CONFIG);
      if (config) {
        logger.info('[ProjectManagement] Auto-activating sole existing project', { project_id: projectId });
        const globalConfig = (await this.dataPersistence.loadGlobalData(FILE_NAMES.CONFIG)) || {};
        globalConfig.activeProject = projectId;
        await this.dataPersistence.saveGlobalData(FILE_NAMES.CONFIG, globalConfig);
        this.activeProjectId = projectId;
        return { projectId, config };
      }
    }

    // No active project found after fallbacks
    const errorMsg = 'No active project found. Please create a project using create_project_forest or switch to an existing project using switch_project_forest first.';
    logger.warn('[ProjectManagement] requireActiveProject called but no active project exists after all fallbacks');
    throw new Error(errorMsg);
  }
}
