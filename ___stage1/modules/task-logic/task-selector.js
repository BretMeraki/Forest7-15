/**
 * Task Selector - Core task selection logic
 */

export class TaskSelector {
  constructor(dataPersistence) {
    this.dataPersistence = dataPersistence;
  }

  /**
   * Select optimal task based on criteria
   */
  async selectOptimalTask(projectId, htaData, criteria = {}) {
    try {
      const {
        energyLevel = 3,
        timeAvailable = 30,
        focusArea = null,
        complexity = null
      } = criteria;

      // Get available tasks from HTA frontier
      const availableTasks = htaData.frontierNodes || [];
      
      if (availableTasks.length === 0) {
        return null;
      }

      // Score tasks based on criteria
      const scoredTasks = availableTasks.map(task => ({
        ...task,
        score: this.scoreTask(task, criteria)
      }));

      // Sort by score (highest first)
      scoredTasks.sort((a, b) => b.score - a.score);

      // Return the highest scoring task
      return scoredTasks[0];
    } catch (error) {
      console.error('TaskSelector.selectOptimalTask failed:', error);
      return null;
    }
  }

  /**
   * Score a task based on selection criteria
   */
  scoreTask(task, criteria) {
    let score = 0;
    const {
      energyLevel = 3,
      timeAvailable = 30,
      focusArea = null
    } = criteria;

    // Energy level matching
    const taskComplexity = task.complexity || 3;
    const energyMatch = Math.max(0, 5 - Math.abs(taskComplexity - energyLevel));
    score += energyMatch * 2;

    // Time availability matching
    const estimatedTime = task.estimated_time || 30;
    const timeMatch = timeAvailable >= estimatedTime ? 3 : 1;
    score += timeMatch;

    // Focus area matching
    if (focusArea && task.category === focusArea) {
      score += 3;
    }

    // Priority boost
    if (task.priority === 'high') {
      score += 2;
    } else if (task.priority === 'medium') {
      score += 1;
    }

    // Status considerations
    if (task.status === 'in_progress') {
      score += 2; // Prioritize continuing work
    } else if (task.status === 'completed') {
      score = 0; // Don't select completed tasks
    }

    return score;
  }

  /**
   * Get available tasks filtered by criteria
   */
  async getAvailableTasks(projectId, filters = {}) {
    try {
      const htaData = await this.dataPersistence.loadPathData(
        projectId,
        filters.pathName || 'general',
        'hta.json'
      );

      if (!htaData || !htaData.frontierNodes) {
        return [];
      }

      let tasks = htaData.frontierNodes;

      // Apply filters
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }

      if (filters.category) {
        tasks = tasks.filter(task => task.category === filters.category);
      }

      if (filters.complexity) {
        tasks = tasks.filter(task => (task.complexity || 3) === filters.complexity);
      }

      return tasks;
    } catch (error) {
      console.error('TaskSelector.getAvailableTasks failed:', error);
      return [];
    }
  }
}
