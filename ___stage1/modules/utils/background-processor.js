/**
 * Background Processor - Simple task scheduler for background operations
 */

export class BackgroundProcessor {
  constructor() {
    this.tasks = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    console.error('Background processor started');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }
    
    // Clear all intervals
    for (const [taskId, task] of this.tasks) {
      if (task.intervalId) {
        clearInterval(task.intervalId);
      }
    }
    
    this.tasks.clear();
    this.isRunning = false;
    console.error('Background processor stopped');
  }

  scheduleTask(taskId, taskFn, intervalMs) {
    if (this.tasks.has(taskId)) {
      this.removeTask(taskId);
    }

    const intervalId = setInterval(() => {
      try {
        taskFn();
      } catch (error) {
        console.error(`Background task ${taskId} failed:`, error);
      }
    }, intervalMs);

    this.tasks.set(taskId, {
      taskFn,
      intervalMs,
      intervalId
    });

    console.error(`Background task ${taskId} scheduled every ${intervalMs}ms`);
  }

  removeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (task && task.intervalId) {
      clearInterval(task.intervalId);
      this.tasks.delete(taskId);
      console.error(`Background task ${taskId} removed`);
    }
  }

  runOnce(taskId, taskFn) {
    try {
      taskFn();
    } catch (error) {
      console.error(`One-time background task ${taskId} failed:`, error);
    }
  }

  getActiveTasks() {
    return Array.from(this.tasks.keys());
  }
}
