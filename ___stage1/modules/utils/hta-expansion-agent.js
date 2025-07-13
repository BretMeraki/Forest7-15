/**
 * HTA Expansion Agent - Automatically monitors and expands HTA trees when tasks run low
 */

export default class HTAExpansionAgent {
  constructor({ htaCore, projectManagement, backgroundProcessor, options = {} }) {
    this.htaCore = htaCore;
    this.projectManagement = projectManagement;
    this.backgroundProcessor = backgroundProcessor;
    this.options = {
      intervalMs: options.intervalMs || 300000, // 5 minutes default
      minAvailableTasks: options.minAvailableTasks || 3,
      debug: options.debug || false,
      ...options
    };

    this.taskId = 'hta-expansion-check';
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) {
      return;
    }

    this.backgroundProcessor.scheduleTask(
      this.taskId,
      () => this.checkAndExpandHTAs(),
      this.options.intervalMs
    );

    this.isInitialized = true;
    
    if (this.options.debug) {
      console.error(`[HTAExpansionAgent] Initialized with ${this.options.intervalMs}ms interval`);
    }
  }

  start() {
    this.initialize();
  }

  stop() {
    this.shutdown();
  }

  async checkAndExpandHTAs() {
    try {
      if (this.options.debug) {
        console.error('[HTAExpansionAgent] Checking for HTA expansion opportunities...');
      }

      // Get all active projects
      const projectsResult = await this.projectManagement.listProjects();
      const projects = projectsResult.projects || [];
      
      for (const project of projects) {
        await this.checkProjectHTAExpansion(project.id);
      }
    } catch (error) {
      console.error('[HTAExpansionAgent] Error during HTA expansion check:', error);
    }
  }

  async checkProjectHTAExpansion(projectId) {
    try {
      // Get current HTA status
      const htaStatus = await this.htaCore.getHTAStatus(projectId);
      
      if (!htaStatus || !htaStatus.tree) {
        return; // No HTA to expand
      }

      // Count available tasks
      const availableTasks = this.countAvailableTasks(htaStatus.tree);
      
      if (availableTasks < this.options.minAvailableTasks) {
        if (this.options.debug) {
          console.error(`[HTAExpansionAgent] Project ${projectId} has ${availableTasks} available tasks, expanding...`);
        }
        
        // Trigger HTA expansion
        await this.expandProjectHTA(projectId, htaStatus);
      }
    } catch (error) {
      console.error(`[HTAExpansionAgent] Error checking project ${projectId}:`, error);
    }
  }

  countAvailableTasks(htaTree) {
    let count = 0;
    
    const countNode = (node) => {
      if (node.type === 'task' && node.status !== 'completed') {
        count++;
      }
      
      if (node.children) {
        node.children.forEach(countNode);
      }
    };
    
    if (htaTree.children) {
      htaTree.children.forEach(countNode);
    }
    
    return count;
  }

  async expandProjectHTA(projectId, currentStatus) {
    try {
      // Find leaf nodes that could be expanded
      const expansionTargets = this.findExpansionTargets(currentStatus.tree);
      
      if (expansionTargets.length === 0) {
        return; // Nothing to expand
      }

      // Expand the first viable target
      const target = expansionTargets[0];
      await this.htaCore.expandHTANode(projectId, target.id, {
        auto_expansion: true,
        min_subtasks: 2,
        max_subtasks: 4
      });

      if (this.options.debug) {
        console.error(`[HTAExpansionAgent] Expanded HTA node ${target.id} for project ${projectId}`);
      }
    } catch (error) {
      console.error(`[HTAExpansionAgent] Error expanding HTA for project ${projectId}:`, error);
    }
  }

  findExpansionTargets(htaTree) {
    const targets = [];
    
    const findTargets = (node) => {
      // Look for task nodes that don't have children and aren't completed
      if (node.type === 'task' && 
          (!node.children || node.children.length === 0) && 
          node.status !== 'completed') {
        targets.push(node);
      }
      
      if (node.children) {
        node.children.forEach(findTargets);
      }
    };
    
    if (htaTree.children) {
      htaTree.children.forEach(findTargets);
    }
    
    return targets;
  }

  shutdown() {
    if (this.isInitialized) {
      this.backgroundProcessor.removeTask(this.taskId);
      this.isInitialized = false;
      
      if (this.options.debug) {
        console.error('[HTAExpansionAgent] Shutdown complete');
      }
    }
  }
}
