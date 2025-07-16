/**
 * Test Assertion Helpers
 * Reusable assertion patterns for comprehensive testing
 */

import { strict as assert } from 'assert';

export class TestAssertionHelpers {
  
  // === FLUENT VALIDATION BUILDER ===
  
  static validate(value, name = 'Value') {
    return new ValidationBuilder(value, name);
  }
  
  // === OBJECT VALIDATION ===
  
  static assertValidObject(obj, name = 'Object') {
    assert(obj, `${name} should be defined`);
    assert(typeof obj === 'object', `${name} should be an object`);
    assert(obj !== null, `${name} should not be null`);
  }

  static assertValidArray(arr, name = 'Array', minLength = 0, maxLength = null) {
    assert(Array.isArray(arr), `${name} should be an array`);
    assert(arr.length >= minLength, `${name} should have at least ${minLength} items`);
    if (maxLength !== null) {
      assert(arr.length <= maxLength, `${name} should have at most ${maxLength} items`);
    }
  }

  static assertValidString(str, name = 'String', minLength = 1, pattern = null, maxLength = null) {
    assert(typeof str === 'string', `${name} should be a string`);
    assert(str.length >= minLength, `${name} should be at least ${minLength} characters`);
    if (maxLength !== null) {
      assert(str.length <= maxLength, `${name} should be at most ${maxLength} characters`);
    }
    if (pattern) {
      assert(pattern.test(str), `${name} should match pattern ${pattern}`);
    }
  }

  static assertValidNumber(num, name = 'Number', min = null, max = null) {
    assert(typeof num === 'number', `${name} should be a number`);
    assert(!isNaN(num), `${name} should not be NaN`);
    if (min !== null) {
      assert(num >= min, `${name} should be at least ${min}`);
    }
    if (max !== null) {
      assert(num <= max, `${name} should be at most ${max}`);
    }
  }

  // === DOMAIN-SPECIFIC VALIDATIONS ===

  static assertValidProject(project, expectedProperties = []) {
    this.assertValidObject(project, 'Project');
    this.assertValidString(project.id, 'Project ID');
    this.assertValidString(project.goal, 'Project Goal');
    
    // Check for expected properties
    expectedProperties.forEach(prop => {
      assert(project.hasOwnProperty(prop), `Project should have property: ${prop}`);
    });

    // Validate common project properties
    if (project.created) {
      assert(new Date(project.created).getTime() > 0, 'Project creation date should be valid');
    }
    if (project.status) {
      const validStatuses = ['active', 'completed', 'paused', 'archived'];
      assert(validStatuses.includes(project.status), 'Project status should be valid');
    }
  }

  // === TASK GENERATION VALIDATION ===

  static assertValidTaskGeneration(result, options = {}) {
    const { minTasks = 5, maxTasks = 20 } = options;
    
    // Stage validation
    this.assertValidObject(result, 'Task generation result');
    assert(result.success === true || result.status === 'success', 'Task generation should succeed');
    assert(result.stage === 6 || result.stage === 'task_generation', 'Should be at stage 6');
    assert(result.gate_status === 'passed', 'Gate should be passed');
    
    // Task collection validation
    const tasks = result.tasks || result.generatedTasks;
    assert(tasks !== undefined, 'Should have generated tasks');
    this.assertValidArray(tasks, 'Generated tasks', minTasks, maxTasks);
    
    // Validate task distribution
    this.assertTaskDistribution(tasks);
    
    // Validate individual tasks
    tasks.forEach((task, idx) => this.assertValidGeneratedTask(task, idx));
    
    // Validate task relationships
    this.assertTaskRelationships(tasks);
    
    return tasks;
  }

  static assertTaskDistribution(tasks) {
    // Priority distribution validation
    const priorities = tasks.map(t => t.priority).filter(p => p);
    const priorityCounts = { high: 0, medium: 0, low: 0 };
    priorities.forEach(p => priorityCounts[p]++);
    assert(priorityCounts.high >= 1, 'Should have at least 1 high priority task');
    assert(priorityCounts.medium >= 2, 'Should have at least 2 medium priority tasks');
    
    // Difficulty distribution validation
    const difficulties = tasks.map(t => t.difficulty).filter(d => d);
    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
    difficulties.forEach(d => difficultyCounts[d]++);
    assert(difficultyCounts.easy >= 1, 'Should have at least 1 easy task for onboarding');
  }

  static assertValidGeneratedTask(task, index) {
    const taskName = `Task ${index}`;
    
    // Core structure validation
    this.assertValidObject(task, taskName);
    assert(Object.keys(task).length >= 8, `${taskName} should have comprehensive properties`);
    
    // Essential properties
    this.assertValidString(task.id, `${taskName} ID`, 1, /^[a-zA-Z0-9_-]+$/);
    this.assertValidString(task.title, `${taskName} title`, 5, null, 200);
    this.assertValidString(task.description, `${taskName} description`, 20, null, 2000);
    
    // Enumerated properties
    assert(['high', 'medium', 'low'].includes(task.priority), `${taskName} priority should be valid`);
    assert(['easy', 'medium', 'hard'].includes(task.difficulty), `${taskName} difficulty should be valid`);
    
    // Duration validation
    const duration = task.estimatedDuration || task.duration;
    this.assertValidNumber(duration, `${taskName} duration`, 15, 480);
    
    // Category validation
    const category = task.category || task.type;
    const validCategories = ['learning', 'practice', 'research', 'setup', 'review', 'project', 'assessment'];
    assert(validCategories.includes(category), `${taskName} category should be valid`);
    
    // Optional array properties
    if (task.dependencies) this.assertValidArray(task.dependencies, `${taskName} dependencies`);
    if (task.prerequisites) this.assertValidArray(task.prerequisites, `${taskName} prerequisites`);
    if (task.learningOutcomes || task.outcomes) {
      const outcomes = task.learningOutcomes || task.outcomes;
      this.assertValidArray(outcomes, `${taskName} outcomes`, 1);
    }
  }

  static assertTaskRelationships(tasks) {
    // Unique IDs validation
    const taskIds = tasks.map(t => t.id);
    assert(taskIds.length === new Set(taskIds).size, 'All task IDs should be unique');
    
    // Dependency validation
    const taskIdSet = new Set(taskIds);
    tasks.forEach((task, idx) => {
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          assert(taskIdSet.has(depId), `Task ${idx} dependency ${depId} should exist in task list`);
        });
      }
    });
    
    // Ordering validation
    const orderedTasks = tasks.filter(t => t.order !== undefined).sort((a, b) => a.order - b.order);
    if (orderedTasks.length > 1) {
      for (let i = 1; i < orderedTasks.length; i++) {
        assert(orderedTasks[i].order > orderedTasks[i-1].order, 'Task ordering should be sequential');
      }
    }
  }

  static assertValidHTA(hta, minBranches = 1, minTasks = 0) {
    this.assertValidObject(hta, 'HTA');
    
    // Validate strategic branches
    if (hta.strategicBranches) {
      this.assertValidArray(hta.strategicBranches, 'Strategic Branches', minBranches);
      hta.strategicBranches.forEach((branch, index) => {
        this.assertValidString(branch.name, `Branch ${index} name`);
        this.assertValidString(branch.description, `Branch ${index} description`);
        if (branch.phase) {
          const validPhases = ['foundation', 'research', 'capability', 'implementation', 'mastery'];
          assert(validPhases.includes(branch.phase), `Branch ${index} should have valid phase`);
        }
      });
    }

    // Validate frontier nodes (tasks)
    if (hta.frontierNodes) {
      this.assertValidArray(hta.frontierNodes, 'Frontier Nodes', minTasks);
      hta.frontierNodes.forEach((task, index) => {
        this.assertValidTask(task, `Task ${index}`);
      });
    }

    // Validate hierarchy metadata
    if (hta.hierarchyMetadata) {
      this.assertValidObject(hta.hierarchyMetadata, 'Hierarchy Metadata');
      if (hta.hierarchyMetadata.total_tasks !== undefined) {
        this.assertValidNumber(hta.hierarchyMetadata.total_tasks, 'Total Tasks', 0);
      }
    }
  }

  // === HTA TREE VALIDATION ===

  static assertValidHTATree(result, expectedDepth = { min: 4, max: 6 }) {
    this.assertValidObject(result, 'HTA Tree Result');
    
    const tree = result.tree || result.htaTree;
    assert(tree !== undefined, 'Should have tree property');
    this.assertValidObject(tree, 'HTA Tree');
    
    // Root level validation
    this.assertValidString(tree.goal, 'Tree goal');
    this.assertValidNumber(tree.depth, 'Tree depth', expectedDepth.min, expectedDepth.max);
    
    // Node count validation
    const nodeCount = tree.totalNodes || tree.nodeCount;
    if (nodeCount !== undefined) {
      this.assertValidNumber(nodeCount, 'Node count', 15, 500);
    }
    
    // Validate tree structure recursively
    this.assertValidHTANode(tree, 0, 'root');
    
    return tree;
  }

  static assertValidHTANode(node, expectedLevel, path = 'node') {
    this.assertValidObject(node, `HTA Node at ${path}`);
    
    // Core properties
    this.assertValidString(node.id, `${path} ID`, 1, /^[a-zA-Z0-9_-]+$/);
    
    const name = node.name || node.title;
    this.assertValidString(name, `${path} name`, 3);
    
    // Level validation
    if (node.level !== undefined) {
      assert(node.level === expectedLevel, `${path} should be at level ${expectedLevel}`);
    }
    
    // Children validation
    const children = node.children || node.branches || node.tasks || [];
    if (expectedLevel < 6 && Array.isArray(children) && children.length > 0) {
      this.assertValidArray(children, `${path} children`, 2, 10);
      
      // Validate uniqueness
      const childIds = children.map(c => c.id);
      assert(childIds.length === new Set(childIds).size, `${path} children should have unique IDs`);
      
      // Recursively validate children
      children.forEach((child, idx) => {
        this.assertValidHTANode(child, expectedLevel + 1, `${path}.children[${idx}]`);
      });
    }
  }

  static assertValidBranchGeneration(branches, goal) {
    this.assertValidArray(branches, 'Generated branches', 3, 8);
    
    branches.forEach((branch, idx) => {
      this.assertValidObject(branch, `Branch ${idx}`);
      this.assertValidString(branch.name, `Branch ${idx} name`, 1);
      this.assertValidString(branch.description, `Branch ${idx} description`, 1);
      
      // Verify no generic names
      const genericNames = ['Foundation', 'Basic', 'Advanced', 'Module 1', 'Section A'];
      assert(!genericNames.includes(branch.name), `Branch ${idx} should not have generic name`);
      
      // Verify relevance to goal
      this.assertSpecificToGoal(branch.name + ' ' + branch.description, goal);
      
      // Complexity validation
      if (branch.complexity !== undefined) {
        const complexity = typeof branch.complexity === 'number' ? branch.complexity : branch.complexity.score;
        this.assertValidNumber(complexity, `Branch ${idx} complexity`, 1, 10);
      }
    });
    
    // Verify branch diversity
    const branchNames = branches.map(b => b.name.toLowerCase());
    const uniqueNames = new Set(branchNames);
    assert(uniqueNames.size === branchNames.length, 'All branch names should be unique');
  }

  static assertValidTask(task, name = 'Task') {
    this.assertValidObject(task, name);
    this.assertValidString(task.id, `${name} ID`);
    
    // Title or name is required
    assert(task.title || task.name, `${name} should have a title or name`);
    if (task.title) {
      this.assertValidString(task.title, `${name} title`);
    }
    if (task.name) {
      this.assertValidString(task.name, `${name} name`);
    }

    // Description is required
    this.assertValidString(task.description, `${name} description`);

    // Validate optional properties
    if (task.difficulty !== undefined) {
      this.assertValidNumber(task.difficulty, `${name} difficulty`, 1, 10);
    }
    if (task.estimatedDuration !== undefined) {
      assert(typeof task.estimatedDuration === 'number' || typeof task.estimatedDuration === 'string',
        `${name} estimated duration should be number or string`);
    }
    if (task.status) {
      const validStatuses = ['not_started', 'in_progress', 'completed', 'blocked', 'skipped'];
      assert(validStatuses.includes(task.status), `${name} should have valid status`);
    }
    if (task.dependencies) {
      this.assertValidArray(task.dependencies, `${name} dependencies`);
    }
  }

  static assertValidPipeline(pipeline, expectedTaskCount = null) {
    this.assertValidObject(pipeline, 'Pipeline');
    
    if (pipeline.tasks) {
      this.assertValidArray(pipeline.tasks, 'Pipeline tasks');
      if (expectedTaskCount !== null) {
        assert(pipeline.tasks.length === expectedTaskCount, 
          `Pipeline should have ${expectedTaskCount} tasks`);
      }
      
      pipeline.tasks.forEach((task, index) => {
        this.assertValidTask(task, `Pipeline task ${index}`);
      });
    }

    if (pipeline.estimatedDuration !== undefined) {
      this.assertValidNumber(pipeline.estimatedDuration, 'Pipeline duration', 0);
    }
    if (pipeline.totalDifficulty !== undefined) {
      this.assertValidNumber(pipeline.totalDifficulty, 'Pipeline difficulty', 0);
    }
  }

  // === PIPELINE-SPECIFIC VALIDATION ===

  static assertValidPipelineGeneration(pipeline, params = {}) {
    const { energyLevel, timeAvailable, minTasks = 1, maxTasks = 10 } = params;
    
    // Core pipeline structure
    this.assertValidObject(pipeline, 'Pipeline');
    assert(pipeline.success === true || pipeline.status === 'success' || pipeline.tasks !== undefined, 
      'Pipeline should indicate success');
    
    // Energy and time matching
    if (energyLevel) {
      const pipelineEnergy = pipeline.energyLevel || pipeline.energy;
      assert(pipelineEnergy === energyLevel, 'Pipeline should match requested energy level');
    }
    
    if (timeAvailable) {
      const pipelineTime = pipeline.timeAvailable || pipeline.time;
      assert(pipelineTime === timeAvailable, 'Pipeline should match available time');
    }
    
    // Task validation
    if (pipeline.tasks) {
      this.assertValidArray(pipeline.tasks, 'Pipeline tasks', minTasks, maxTasks);
      this.assertPipelineTaskQuality(pipeline.tasks, params);
      this.assertPipelineBalance(pipeline.tasks, params);
    }
    
    return pipeline;
  }

  static assertPipelineTaskQuality(tasks, params = {}) {
    const { energyLevel, timeAvailable } = params;
    
    // Unique IDs
    const taskIds = tasks.map(t => t.id);
    assert(taskIds.length === new Set(taskIds).size, 'All pipeline task IDs should be unique');
    
    let totalDuration = 0;
    const taskTypes = new Set();
    const energyLevels = new Set();
    
    tasks.forEach((task, idx) => {
      // Core task validation
      this.assertValidObject(task, `Pipeline task ${idx}`);
      this.assertValidString(task.id, `Task ${idx} ID`, 1, /^[a-zA-Z0-9_-]+$/);
      this.assertValidString(task.title, `Task ${idx} title`, 3, null, 200);
      this.assertValidString(task.description, `Task ${idx} description`, 10, null, 1000);
      
      // Duration validation
      this.assertValidNumber(task.duration, `Task ${idx} duration`, 5, 120);
      assert(task.duration % 5 === 0, `Task ${idx} duration should be multiple of 5`);
      totalDuration += task.duration;
      
      // Type and energy validation
      if (task.type) {
        const validTypes = ['learning', 'practice', 'review', 'assessment', 'project', 'reading', 'watching', 'coding'];
        assert(validTypes.includes(task.type), `Task ${idx} should have valid type`);
        taskTypes.add(task.type);
      }
      
      if (task.energyLevel) {
        this.assertValidNumber(task.energyLevel, `Task ${idx} energy level`, 1, 5);
        if (energyLevel) {
          assert(Math.abs(task.energyLevel - energyLevel) <= 2, 
            `Task ${idx} energy should be within 2 of requested level`);
        }
        energyLevels.add(task.energyLevel);
      }
    });
    
    // Time constraint validation
    if (timeAvailable) {
      assert(totalDuration <= timeAvailable, 'Total duration should not exceed available time');
      assert(totalDuration >= timeAvailable * 0.5, 'Should use at least 50% of available time');
    }
    
    // Variety validation
    if (tasks.length > 1) {
      assert(taskTypes.size >= Math.min(2, tasks.length), 'Should have task variety');
      assert(energyLevels.size <= 3, 'Should not have too many different energy levels');
    }
  }

  static assertPipelineBalance(tasks, params = {}) {
    if (tasks.length < 2) return; // Skip balance checks for single tasks
    
    const durations = tasks.map(t => t.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    // Duration balance
    assert(avgDuration >= 10, 'Average task duration should be reasonable');
    assert(avgDuration <= 45, 'Average task duration should not be excessive');
    assert(maxDuration / minDuration <= 4, 'Duration variance should be reasonable');
    
    // Energy progression
    for (let i = 1; i < tasks.length; i++) {
      const prevEnergy = tasks[i-1].energyLevel || 3;
      const currEnergy = tasks[i].energyLevel || 3;
      assert(Math.abs(currEnergy - prevEnergy) <= 2, 'Energy changes should be gradual');
    }
  }

  // === RESULT VALIDATION ===

  static assertSuccessResult(result, expectedProperties = []) {
    this.assertValidObject(result, 'Result');
    assert(result.success === true, 'Result should indicate success');
    
    expectedProperties.forEach(prop => {
      assert(result.hasOwnProperty(prop), `Result should have property: ${prop}`);
    });
  }

  static assertErrorResult(result, expectedErrorMessage = null) {
    this.assertValidObject(result, 'Result');
    assert(result.success === false, 'Result should indicate failure');
    assert(result.error, 'Result should contain error information');
    
    if (expectedErrorMessage) {
      assert(result.error.includes(expectedErrorMessage), 
        `Error should contain: ${expectedErrorMessage}`);
    }
  }

  // === PERFORMANCE ASSERTIONS ===

  static assertPerformance(startTime, maxDurationMs, operationName = 'Operation') {
    const duration = Date.now() - startTime;
    assert(duration <= maxDurationMs, 
      `${operationName} should complete within ${maxDurationMs}ms (took ${duration}ms)`);
  }

  static assertMemoryUsage(maxMemoryMB, operationName = 'Operation') {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    assert(heapUsedMB <= maxMemoryMB, 
      `${operationName} should use less than ${maxMemoryMB}MB (used ${heapUsedMB.toFixed(2)}MB)`);
  }

  // === STATE VALIDATION ===

  static assertStateChange(beforeState, afterState, expectedChanges = {}) {
    this.assertValidObject(beforeState, 'Before State');
    this.assertValidObject(afterState, 'After State');
    
    Object.entries(expectedChanges).forEach(([key, expectedValue]) => {
      if (expectedValue === 'INCREMENT') {
        assert(afterState[key] > beforeState[key], 
          `${key} should have incremented`);
      } else if (expectedValue === 'DECREMENT') {
        assert(afterState[key] < beforeState[key], 
          `${key} should have decremented`);
      } else {
        assert(afterState[key] === expectedValue, 
          `${key} should be ${expectedValue}`);
      }
    });
  }

  // === COLLECTION VALIDATION ===

  static assertUniqueItems(array, keyProperty = null, name = 'Array') {
    this.assertValidArray(array, name);
    
    if (keyProperty) {
      const keys = array.map(item => item[keyProperty]);
      const uniqueKeys = [...new Set(keys)];
      assert(keys.length === uniqueKeys.length, 
        `${name} should have unique ${keyProperty} values`);
    } else {
      const uniqueItems = [...new Set(array)];
      assert(array.length === uniqueItems.length, 
        `${name} should have unique items`);
    }
  }

  static assertSortedArray(array, property = null, ascending = true, name = 'Array') {
    this.assertValidArray(array, name, 2); // Need at least 2 items to check sorting
    
    for (let i = 1; i < array.length; i++) {
      const prev = property ? array[i-1][property] : array[i-1];
      const curr = property ? array[i][property] : array[i];
      
      if (ascending) {
        assert(prev <= curr, `${name} should be sorted in ascending order`);
      } else {
        assert(prev >= curr, `${name} should be sorted in descending order`);
      }
    }
  }

  // === DOMAIN-AGNOSTIC VALIDATION ===

  static assertDomainAgnostic(content, forbiddenTerms = []) {
    const defaultForbiddenTerms = [
      'Foundation', 'Basic', 'Introduction', 'Getting Started',
      'Step 1', 'Step 2', 'Phase 1', 'Phase 2'
    ];
    
    const allForbiddenTerms = [...defaultForbiddenTerms, ...forbiddenTerms];
    
    allForbiddenTerms.forEach(term => {
      assert(!content.includes(term), 
        `Content should not contain generic term: ${term}`);
    });
  }

  static assertSpecificToGoal(content, goal, requiredTerms = []) {
    // Extract key terms from goal
    const goalTerms = goal.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['with', 'using', 'learn', 'build', 'create'].includes(word));
    
    const allRequiredTerms = [...goalTerms, ...requiredTerms];
    const contentLower = content.toLowerCase();
    
    const foundTerms = allRequiredTerms.filter(term => 
      contentLower.includes(term.toLowerCase())
    );
    
    assert(foundTerms.length > 0, 
      `Content should contain terms related to goal: ${goal}`);
  }

  // === PERFORMANCE-OPTIMIZED TREE VALIDATION ===

  static assertValidHTATreeIterative(tree, options = {}) {
    const { maxDepth = 6, maxNodes = 500, validateAll = false } = options;
    
    // Use iterative approach with queue for better performance
    const queue = [{ node: tree, level: 0, path: 'root' }];
    let nodeCount = 0;
    const visitedIds = new Set();
    
    while (queue.length > 0 && nodeCount < maxNodes) {
      const { node, level, path } = queue.shift();
      nodeCount++;
      
      // Core validation (essential checks only)
      this.assertValidObject(node, `Node at ${path}`);
      this.assertValidString(node.id, `${path} ID`, 1, /^[a-zA-Z0-9_-]+$/);
      
      // Check for duplicate IDs
      assert(!visitedIds.has(node.id), `Duplicate node ID: ${node.id} at ${path}`);
      visitedIds.add(node.id);
      
      // Level validation
      if (node.level !== undefined) {
        assert(node.level === level, `${path} should be at level ${level}`);
      }
      
      // Add children to queue (breadth-first traversal)
      const children = node.children || node.branches || node.tasks || [];
      if (level < maxDepth && Array.isArray(children)) {
        children.forEach((child, idx) => {
          queue.push({
            node: child,
            level: level + 1,
            path: `${path}.children[${idx}]`
          });
        });
      }
      
      // Early termination for performance testing
      if (!validateAll && nodeCount > 50) {
        break; // Sample validation for large trees
      }
    }
    
    return { nodeCount, maxDepth: Math.max(...Array.from(visitedIds).map(() => 0)) };
  }

  // === ERROR TESTING HELPERS ===

  static async assertThrows(asyncFn, expectedErrorMessage = null, name = 'Function') {
    let threwError = false;
    let actualError = null;
    
    try {
      await asyncFn();
    } catch (error) {
      threwError = true;
      actualError = error;
    }
    
    assert(threwError, `${name} should throw an error`);
    
    if (expectedErrorMessage) {
      assert(actualError.message.includes(expectedErrorMessage), 
        `Error should contain: ${expectedErrorMessage}`);
    }
  }

  static async assertDoesNotThrow(asyncFn, name = 'Function') {
    try {
      await asyncFn();
    } catch (error) {
      assert(false, `${name} should not throw an error: ${error.message}`);
    }
  }

  // Enhanced error type validation
  static assertSpecificError(error, expectedType, expectedCode = null) {
    assert(error, 'Error should be defined');
    
    if (expectedType) {
      assert(error.name === expectedType || error.constructor.name === expectedType,
        `Error should be of type ${expectedType}, got ${error.constructor.name}`);
    }
    
    if (expectedCode) {
      assert(error.code === expectedCode || error.message.includes(expectedCode),
        `Error should have code ${expectedCode}`);
    }
  }

  static assertErrorPattern(error, patterns) {
    assert(error, 'Error should be defined');
    
    const matchesPattern = patterns.some(pattern => {
      if (typeof pattern === 'string') {
        return error.message.includes(pattern);
      } else if (pattern instanceof RegExp) {
        return pattern.test(error.message);
      }
      return false;
    });
    
    assert(matchesPattern, 
      `Error message "${error.message}" should match one of: ${patterns.join(', ')}`);
  }
}

// === VALIDATION STRATEGIES ===
// Note: Strategy pattern implementation for future extensibility
// Currently using direct helper methods for better performance

/**
 * Fluent Validation Builder
 * Enables chained validation calls for complex assertions
 */
class ValidationBuilder {
  constructor(value, name) {
    this.value = value;
    this.name = name;
  }

  isDefined() {
    assert(this.value !== undefined && this.value !== null, `${this.name} should be defined`);
    return this;
  }

  isObject() {
    TestAssertionHelpers.assertValidObject(this.value, this.name);
    return this;
  }

  isArray(minLength = 0, maxLength = null) {
    TestAssertionHelpers.assertValidArray(this.value, this.name, minLength, maxLength);
    return this;
  }

  isString(minLength = 1, pattern = null) {
    TestAssertionHelpers.assertValidString(this.value, this.name, minLength, pattern);
    return this;
  }

  isNumber(min = null, max = null) {
    TestAssertionHelpers.assertValidNumber(this.value, this.name, min, max);
    return this;
  }

  hasProperty(property) {
    assert(this.value && this.value.hasOwnProperty(property), 
      `${this.name} should have property: ${property}`);
    return this;
  }

  hasProperties(properties) {
    properties.forEach(prop => this.hasProperty(prop));
    return this;
  }

  matches(predicate, message) {
    assert(predicate(this.value), message || `${this.name} should match predicate`);
    return this;
  }

  equals(expected) {
    assert(this.value === expected, `${this.name} should equal ${expected}, got ${this.value}`);
    return this;
  }

  isOneOf(validValues) {
    assert(validValues.includes(this.value), 
      `${this.name} should be one of [${validValues.join(', ')}], got ${this.value}`);
    return this;
  }
}