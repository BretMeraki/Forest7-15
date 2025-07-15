/**
 * HTA Task Generation Engine Module - Pure LLM-Driven Approach
 * Handles creation, validation, and management of granular tasks within strategic branches
 * No hardcoded domain knowledge - completely adaptive to any learning goal
 */

import { ForestIntelligenceAdapter } from './core-intelligence.js';
import { CONSTANTS } from './constants.js';

export class HTATaskGeneration {
  constructor() {
    this.intelligenceAdapter = new ForestIntelligenceAdapter();
    // Removed all hardcoded templates - now using pure LLM generation
  }

  async generateTasksForBranch(branch, goal, context = {}) {
    const system = `You are an expert learning task designer who creates hyper-specific, immediately actionable tasks. Your tasks should be so clear that a user knows exactly what to do within 5 seconds of reading them.

CRITICAL REQUIREMENTS:
- NEVER use generic terms like "research", "study", "learn about", "understand", "explore"
- ALWAYS use specific actions with concrete deliverables
- Make the task title contain the actual action and deliverable
- Use domain-specific terminology throughout
- Ensure each task feels custom-made for this exact goal`;
    
    // Extract rich context for personalized task generation
    const userProfile = this.extractUserProfile(context);
    const environmentalContext = this.extractEnvironmentalContext(context);
    const learningContext = this.extractLearningContext(context);
    
    const user = `Generate hyper-personalized learning tasks for this strategic branch:

**Goal**: ${goal}
**Branch**: ${branch.name}
**Branch Description**: ${branch.description}
**Key Outcomes**: ${branch.key_outcomes?.join(', ') || 'Not specified'}

**USER PROFILE:**
- Current Skill Level: ${userProfile.skillLevel}/5 (${userProfile.experience})
- Learning Style: ${userProfile.learningStyle} (${userProfile.processingPreference})
- Available Time: ${userProfile.timeAvailable} minutes per session
- Energy Level: ${userProfile.energyLevel}/5 (${userProfile.mentalClarity}/5 clarity)
- Previous Struggles: ${userProfile.struggleAreas.join(', ') || 'none identified'}
- Preferred Learning Mode: ${userProfile.preferredMode}

**ENVIRONMENT:**
- Location: ${environmentalContext.location} (${environmentalContext.distractionLevel}/5 distraction)
- Available Tools: ${environmentalContext.availableTools.join(', ') || 'basic setup'}
- Technical Setup: ${environmentalContext.technicalSetup}
- Resource Constraints: ${environmentalContext.constraints.join(', ') || 'none specified'}

**LEARNING CONTEXT:**
- Recent Performance: ${learningContext.recentSuccessRate}% success rate
- Completed Tasks: ${learningContext.completedTasks} tasks in this domain
- Current Projects: ${learningContext.currentProjects.join(', ') || 'none'}
- Interests: ${learningContext.interests.join(', ') || 'general'}

Create 4-8 laser-focused, PERSONALIZED tasks. Each task must be:

1. **IMMEDIATELY ACTIONABLE**: User knows the exact first step to take
2. **CONTEXTUALLY RELEVANT**: Adapted to their skill level, tools, and environment
3. **MEASURABLE DELIVERABLE**: Specific output they can validate themselves
4. **TIME-APPROPRIATE**: Fits their available time and energy constraints
5. **DIFFICULTY-CALIBRATED**: Matches their demonstrated competence level
6. **ENVIRONMENTALLY AWARE**: Considers their actual setup and resources

**PERSONALIZATION REQUIREMENTS:**
- Adapt complexity to ${userProfile.skillLevel}/5 skill level
- Use ${userProfile.learningStyle} learning approaches
- Account for ${environmentalContext.distractionLevel}/5 distraction environment
- Build on their ${learningContext.currentProjects.length > 0 ? 'current projects' : 'interests'}
- Consider ${environmentalContext.constraints.length > 0 ? 'resource constraints' : 'available tools'}

**TASK STRUCTURE:**
- Title: "Action + Deliverable + Context" (e.g., "Build user authentication in your portfolio site using JWT")
- First Action: The immediate next step they should take
- Success Validation: How they'll know they did it correctly
- Real-World Connection: How this applies to their actual goals/projects

Make each task feel like it was custom-designed for THIS specific person's situation!`;

    const schema = {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          minItems: 4,
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { 
                type: "string",
                description: "PERSONALIZED task name: Action + Deliverable + Context (e.g., 'Build user authentication in your portfolio site using JWT', 'Shoot 15 golden hour portraits with your 50mm lens at f/2.8')"
              },
              description: { 
                type: "string",
                description: "Contextually relevant action steps: First sentence = exactly what to do considering their skill level and setup. Second sentence = what they'll have when complete. Third sentence = how this connects to their goals/projects."
              },
              first_action: {
                type: "string",
                description: "The immediate next step they should take to start this task (e.g., 'Open VS Code and create a new file called auth.js', 'Set your camera to manual mode and adjust ISO to 400')"
              },
              success_validation: {
                type: "string", 
                description: "How they'll know they completed this correctly (specific, measurable criteria they can self-check)"
              },
              real_world_connection: {
                type: "string",
                description: "How this task applies to their actual goals, projects, or interests (make it personally relevant)"
              },
              type: { 
                type: "string",
                enum: ["build", "create", "practice", "write", "design", "analyze", "test", "implement", "configure", "optimize"],
                description: "Primary action type - choose the most specific action verb"
              },
              difficulty: { 
                type: "integer", 
                minimum: 1, 
                maximum: 10,
                description: "Task difficulty level"
              },
              estimated_duration: { 
                type: "string",
                description: "Realistic time estimate"
              },
              deliverable: { 
                type: "string",
                description: "Concrete output or result"
              },
              success_criteria: {
                type: "array",
                items: { type: "string" },
                description: "How to know the task is complete"
              },
              prerequisites: {
                type: "array",
                items: { type: "string" },
                description: "What's needed before starting"
              },
              resources_needed: {
                type: "array",
                items: { type: "string" },
                description: "Tools, materials, or resources required"
              },
              learning_objectives: {
                type: "array",
                items: { type: "string" },
                description: "What the learner will gain"
              }
            },
            required: ["id", "name", "description", "type", "difficulty", "estimated_duration", "deliverable", "success_criteria"]
          }
        },
        task_sequence_rationale: {
          type: "string",
          description: "Why these tasks are ordered this way"
        },
        branch_completion_criteria: {
          type: "array",
          items: { type: "string" },
          description: "How to know the entire branch is complete"
        },
        adaptive_notes: {
          type: "array",
          items: { type: "string" },
          description: "How tasks might be modified based on learner progress"
        }
      },
      required: ["tasks", "task_sequence_rationale", "branch_completion_criteria"]
    };

    const request = await this.intelligenceAdapter.core.request({
      method: 'llm/completion',
      params: {
        system,
        user,
        schema,
        max_tokens: 3000,
        temperature: 0.4
      }
    });

    // Validate task specificity before returning
    let validatedTasks = this.validateTaskSpecificity(request.tasks || [], goal);
    
    // Apply personalization enhancements
    const domain = this.extractDomainFromGoal(goal);
    validatedTasks = validatedTasks.map(task => {
      // Apply learning style adaptations
      let enhancedTask = this.adaptTaskToLearningStyle(task, userProfile, domain);
      
      // Apply environmental context
      enhancedTask = this.addEnvironmentalContext(enhancedTask, environmentalContext, domain);
      
      return enhancedTask;
    });
    
    return {
      branchId: branch.id || this.generateBranchId(branch.name),
      branchName: branch.name,
      analysisType: 'llm_driven',
      ...request,
      tasks: validatedTasks,
      validationResults: this.getLastValidationResults(),
      personalizationContext: {
        userProfile: userProfile,
        environmentalContext: environmentalContext,
        learningContext: learningContext
      },
      generatedAt: new Date().toISOString()
    };
  }

  async generateMicroTasks(task, goal, context = {}) {
    const system = `You are a micro-task specialist who breaks down complex tasks into crystal-clear, bite-sized actions. Each micro-task should be so specific that someone could complete it without asking any questions.

MICRO-TASK EXCELLENCE CRITERIA:
- Start with specific action verbs (create, write, configure, test, build, etc.)
- Include exact tools, files, or resources to use
- Specify measurable outcomes (number of items, file names, specific results)
- Use domain-specific terminology
- Make it impossible to misunderstand what to do`;
    
    const user = `Break down this learning task into hyper-specific micro-tasks:

**Overall Goal**: ${goal}
**Task**: ${task.name}
**Task Description**: ${task.description}
**Task Type**: ${task.type}
**Context**: ${JSON.stringify(context, null, 2)}

Create 3-6 laser-focused micro-tasks. Each micro-task must be:

1. **15-45 MINUTE SCOPE**: Realistically completable in one focused session
2. **CRYSTAL CLEAR ACTION**: Starts with specific verb + exact deliverable
3. **MEASURABLE RESULT**: Produces something you can see, count, or verify
4. **SEQUENTIAL LOGIC**: Builds naturally to the next step
5. **DOMAIN-SPECIFIC**: Uses the actual terminology and tools of the field

**MICRO-TASK EXAMPLES:**
- "Create a new React component file called 'TodoItem.js' with basic structure"
- "Write 3 unit tests for the addTodo function using Jest"
- "Configure ESLint rules in .eslintrc.json file for React project"
- "Take 10 practice shots using f/2.8 aperture in golden hour light"
- "Write a 500-word blog post about your pottery wheel centering experience"

Each micro-task should make the user think "I know exactly what file to open and what to do!"`;

    const schema = {
      type: "object",
      properties: {
        micro_tasks: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {
            type: "object",
            properties: {
              step: { type: "integer" },
              action: { 
                type: "string",
                description: "Specific action to take"
              },
              expected_result: { 
                type: "string",
                description: "What will be produced"
              },
              time_estimate: { 
                type: "string",
                description: "Realistic time for this step"
              },
              validation: { 
                type: "string",
                description: "How to know this step is done correctly"
              },
              tips: {
                type: "array",
                items: { type: "string" },
                description: "Helpful hints for this step"
              }
            },
            required: ["step", "action", "expected_result", "time_estimate", "validation"]
          }
        },
        completion_flow: {
          type: "string",
          description: "How the micro-tasks flow together"
        },
        quality_checks: {
          type: "array",
          items: { type: "string" },
          description: "Quality indicators for the overall task"
        }
      },
      required: ["micro_tasks", "completion_flow"]
    };

    const request = await this.intelligenceAdapter.core.request({
      method: 'llm/completion',
      params: {
        system,
        user,
        schema,
        max_tokens: 2000,
        temperature: 0.3
      }
    });

    return {
      parentTaskId: task.id,
      analysisType: 'llm_driven',
      ...request,
      generatedAt: new Date().toISOString()
    };
  }

  async validateTaskSequence(tasks, branch, goal) {
    const system = `You are a learning sequence validator who ensures task progressions are logical and effective.`;
    
    const user = `Validate this task sequence for learning effectiveness:

**Goal**: ${goal}
**Branch**: ${branch.name} - ${branch.description}
**Tasks**: ${JSON.stringify(tasks.map(t => ({ name: t.name, type: t.type, difficulty: t.difficulty })), null, 2)}

Check for:
1. Logical progression and dependencies
2. Appropriate difficulty curve
3. Balanced task types
4. Completeness for branch objectives
5. Realistic scope and timing

Provide specific feedback and suggestions for improvement.`;

    const schema = {
      type: "object",
      properties: {
        validation_result: {
          type: "object",
          properties: {
            is_valid: { type: "boolean" },
            overall_score: { 
              type: "integer", 
              minimum: 1, 
              maximum: 10,
              description: "Quality score for the sequence"
            },
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "What works well"
            },
            issues: {
              type: "array",
              items: { type: "string" },
              description: "Problems or concerns"
            },
            suggestions: {
              type: "array",
              items: { type: "string" },
              description: "Specific improvements"
            }
          }
        },
        progression_analysis: {
          type: "object",
          properties: {
            difficulty_curve: { type: "string" },
            dependency_flow: { type: "string" },
            task_balance: { type: "string" },
            time_distribution: { type: "string" }
          }
        },
        recommended_changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              change_type: { type: "string", enum: ["add", "remove", "modify", "reorder"] },
              target: { type: "string" },
              rationale: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high"] }
            }
          }
        }
      },
      required: ["validation_result", "progression_analysis"]
    };

    const request = await this.intelligenceAdapter.core.request({
      method: 'llm/completion',
      params: {
        system,
        user,
        schema,
        max_tokens: 2000,
        temperature: 0.3
      }
    });

    return {
      analysisType: 'llm_driven',
      ...request,
      validatedAt: new Date().toISOString()
    };
  }

  async adaptTaskDifficulty(task, learnerFeedback, goal) {
    const system = `You are a learning adaptation specialist who modifies tasks based on learner performance and feedback.`;
    
    const user = `Adapt this task based on learner feedback:

**Goal**: ${goal}
**Task**: ${task.name} - ${task.description}
**Current Difficulty**: ${task.difficulty}/10
**Learner Feedback**: ${JSON.stringify(learnerFeedback, null, 2)}

Modify the task to better match the learner's needs while maintaining the learning objectives.`;

    const schema = {
      type: "object",
      properties: {
        adaptation_type: { 
          type: "string", 
          enum: ["simplify", "enhance", "restructure", "supplement", "no_change"],
          description: "Type of adaptation needed"
        },
        adapted_task: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            difficulty: { type: "integer", minimum: 1, maximum: 10 },
            estimated_duration: { type: "string" },
            success_criteria: { type: "array", items: { type: "string" } },
            additional_support: { type: "array", items: { type: "string" } }
          }
        },
        adaptation_rationale: { 
          type: "string",
          description: "Why this adaptation was chosen"
        },
        learning_impact: { 
          type: "string",
          description: "How this maintains or improves learning outcomes"
        }
      },
      required: ["adaptation_type", "adapted_task", "adaptation_rationale"]
    };

    const request = await this.intelligenceAdapter.core.request({
      method: 'llm/completion',
      params: {
        system,
        user,
        schema,
        max_tokens: 1500,
        temperature: 0.4
      }
    });

    return {
      originalTaskId: task.id,
      analysisType: 'llm_driven',
      ...request,
      adaptedAt: new Date().toISOString()
    };
  }

  generateBranchId(branchName) {
    const timestamp = Date.now().toString(36);
    const nameSlug = branchName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
    return `branch-${nameSlug}-${timestamp}`;
  }

  generateTaskId(taskName, branchId) {
    const timestamp = Date.now().toString(36);
    const nameSlug = taskName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 15);
    return `task-${branchId}-${nameSlug}-${timestamp}`;
  }

  static formatDuration(minutes) {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 480) return `${Math.round(minutes / 60)} hours`;
    return `${Math.round(minutes / 480)} days`;
  }

  static validateTaskStructure(task) {
    const required = ['id', 'name', 'description', 'type', 'difficulty', 'estimated_duration', 'success_criteria'];
    const missing = required.filter(field => !task[field]);
    
    return {
      isValid: missing.length === 0,
      missingFields: missing,
      issues: this.identifyTaskIssues(task)
    };
  }

  static identifyTaskIssues(task) {
    const issues = [];
    
    if (task.name && task.name.length < 5) {
      issues.push('Task name too short');
    }
    
    if (task.description && task.description.length < 20) {
      issues.push('Task description lacks detail');
    }
    
    if (task.difficulty && (task.difficulty < 1 || task.difficulty > 10)) {
      issues.push('Difficulty out of valid range (1-10)');
    }
    
    if (task.success_criteria && task.success_criteria.length === 0) {
      issues.push('No success criteria defined');
    }
    
    return issues;
  }

  /**
   * Validate task specificity to prevent generic language
   */
  validateTaskSpecificity(tasks, goal) {
    this.lastValidationResults = {
      passed: [],
      failed: [],
      warnings: [],
      score: 0
    };

    const validatedTasks = tasks.map(task => {
      const issues = this.findGenericPatterns(task, goal);
      
      if (issues.length === 0) {
        this.lastValidationResults.passed.push(task.id || task.name);
        return task;
      } else if (issues.some(issue => issue.severity === 'critical')) {
        this.lastValidationResults.failed.push({
          task: task.name,
          issues: issues
        });
        // Return enhanced task to fix critical issues
        return this.enhanceTaskSpecificity(task, goal, issues);
      } else {
        this.lastValidationResults.warnings.push({
          task: task.name,
          issues: issues
        });
        return task;
      }
    });

    this.lastValidationResults.score = (this.lastValidationResults.passed.length / tasks.length) * 100;
    return validatedTasks;
  }

  /**
   * Detect generic patterns in tasks with enhanced subtlety detection
   */
  findGenericPatterns(task, goal) {
    const issues = [];
    const taskText = `${task.name} ${task.description}`.toLowerCase();
    
    // Critical generic terms that must be avoided
    const criticalGeneric = [
      'learn about', 'understand', 'study', 'research', 'explore',
      'get familiar', 'become comfortable', 'gain knowledge', 'basics',
      'fundamentals', 'introduction', 'overview', 'foundation',
      'get to know', 'familiarize yourself', 'become acquainted with'
    ];
    
    // Warning generic terms that should be avoided
    const warningGeneric = [
      'practice', 'work on', 'focus on', 'review', 'examine',
      'look at', 'try', 'attempt', 'begin', 'start',
      'spend time', 'dedicate time', 'allocate time'
    ];

    // Subtle generic patterns (regex-based)
    const subtleGenericPatterns = [
      { pattern: /\b(several|some|a few|various|multiple)\b/g, severity: 'warning', message: 'Uses vague quantifier instead of specific number' },
      { pattern: /\b(better|improved|enhanced|stronger)\s+(understanding|knowledge|skills|familiarity)\b/g, severity: 'critical', message: 'Uses vague improvement language' },
      { pattern: /\b(until\s+)?(comfortable|confident|familiar)\b/g, severity: 'critical', message: 'Uses subjective completion criteria' },
      { pattern: /\b(more\s+)?(experience|exposure|practice)\s+with\b/g, severity: 'warning', message: 'Uses vague experience language' },
      { pattern: /\b(general|basic|simple|easy)\s+(understanding|knowledge|overview)\b/g, severity: 'critical', message: 'Uses generic depth descriptors' }
    ];

    // Check for critical generic patterns
    criticalGeneric.forEach(pattern => {
      if (taskText.includes(pattern)) {
        issues.push({
          severity: 'critical',
          pattern: pattern,
          message: `Task uses generic term "${pattern}" - needs specific action`
        });
      }
    });

    // Check for warning generic patterns
    warningGeneric.forEach(pattern => {
      if (taskText.includes(pattern)) {
        issues.push({
          severity: 'warning',
          pattern: pattern,
          message: `Task uses vague term "${pattern}" - could be more specific`
        });
      }
    });

    // Check for subtle generic patterns
    subtleGenericPatterns.forEach(({ pattern, severity, message }) => {
      const matches = taskText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            severity,
            pattern: match,
            message: `${message}: "${match}"`
          });
        });
      }
    });

    // Check for missing concrete deliverables
    if (!task.deliverable || task.deliverable.length < 10) {
      issues.push({
        severity: 'critical',
        pattern: 'missing_deliverable',
        message: 'Task lacks specific, tangible deliverable'
      });
    }

    // Check for missing first action
    if (!task.first_action || task.first_action.length < 15) {
      issues.push({
        severity: 'critical',
        pattern: 'missing_first_action',
        message: 'Task lacks specific first action step'
      });
    }

    // Check for missing success validation
    if (!task.success_validation || task.success_validation.length < 20) {
      issues.push({
        severity: 'critical',
        pattern: 'missing_success_validation',
        message: 'Task lacks concrete success validation criteria'
      });
    }

    // Check for non-actionable task names
    const actionVerbs = ['build', 'create', 'write', 'design', 'implement', 'configure', 'test', 'analyze', 'optimize', 'develop', 'shoot', 'play', 'code', 'deploy'];
    const hasActionVerb = actionVerbs.some(verb => task.name.toLowerCase().includes(verb));
    
    if (!hasActionVerb) {
      issues.push({
        severity: 'warning',
        pattern: 'weak_action_verb',
        message: 'Task name should start with strong action verb'
      });
    }

    // Check for vague time estimates
    if (task.estimated_duration && /\b(some|a while|a bit|several|various)\b/.test(task.estimated_duration.toLowerCase())) {
      issues.push({
        severity: 'warning',
        pattern: 'vague_time_estimate',
        message: 'Time estimate uses vague language instead of specific duration'
      });
    }

    // Check for generic success criteria
    if (task.success_criteria && task.success_criteria.some(criteria => 
      /\b(understand|comfortable|familiar|confident|know|learned)\b/.test(criteria.toLowerCase()))) {
      issues.push({
        severity: 'critical',
        pattern: 'generic_success_criteria',
        message: 'Success criteria uses subjective/generic language'
      });
    }

    return issues;
  }

  /**
   * Enhance task specificity when generic patterns are found
   */
  enhanceTaskSpecificity(task, goal, issues) {
    // Create enhanced version of task
    const enhanced = { ...task };
    
    // Extract domain from goal for context
    const domain = this.extractDomainFromGoal(goal);
    
    // Fix generic task names
    if (issues.some(i => i.pattern.includes('learn about') || i.pattern.includes('study'))) {
      enhanced.name = enhanced.name.replace(/learn about|study|understand/gi, 'build practical skills in');
    }
    
    // Fix vague quantifiers
    if (issues.some(i => i.pattern.includes('several') || i.pattern.includes('some'))) {
      enhanced.name = enhanced.name.replace(/several|some|a few|various|multiple/gi, '3-5');
      enhanced.description = enhanced.description.replace(/several|some|a few|various|multiple/gi, '3-5');
    }
    
    // Add specific deliverable if missing
    if (issues.some(i => i.pattern === 'missing_deliverable')) {
      enhanced.deliverable = `Working ${domain}-specific ${this.getDomainDeliverable(domain)} demonstrating ${enhanced.name}`;
    }
    
    // Add first action if missing
    if (issues.some(i => i.pattern === 'missing_first_action')) {
      enhanced.first_action = this.generateFirstAction(enhanced.name, domain);
    }
    
    // Add success validation if missing
    if (issues.some(i => i.pattern === 'missing_success_validation')) {
      enhanced.success_validation = this.generateSuccessValidation(enhanced.name, domain);
    }
    
    // Fix generic success criteria
    if (issues.some(i => i.pattern === 'generic_success_criteria')) {
      enhanced.success_criteria = enhanced.success_criteria.map(criteria => 
        criteria.replace(/understand|comfortable|familiar|confident|know|learned/gi, 'demonstrate')
      );
    }
    
    // Add real-world connection if missing
    if (!enhanced.real_world_connection) {
      enhanced.real_world_connection = `This ${domain} skill directly applies to ${this.getDomainApplication(domain, goal)}`;
    }
    
    // Add validation note
    enhanced._validationEnhanced = true;
    enhanced._originalIssues = issues;
    
    return enhanced;
  }

  /**
   * Get domain-specific deliverable type
   */
  getDomainDeliverable(domain) {
    const deliverables = {
      programming: 'application/component',
      photography: 'photo series',
      music: 'recorded performance',
      cooking: 'prepared dish',
      writing: 'written piece',
      design: 'design mockup',
      fitness: 'workout routine'
    };
    return deliverables[domain] || 'project';
  }

  /**
   * Generate domain-specific first action
   */
  generateFirstAction(taskName, domain) {
    const actions = {
      programming: 'Open your code editor and create a new file',
      photography: 'Set up your camera and check battery/memory card',
      music: 'Pick up your instrument and warm up with scales',
      cooking: 'Gather ingredients and prep your workspace',
      writing: 'Open a new document and write your first sentence',
      design: 'Open your design software and create a new artboard',
      fitness: 'Put on workout clothes and clear your exercise space'
    };
    return actions[domain] || 'Gather your materials and set up your workspace';
  }

  /**
   * Generate domain-specific success validation
   */
  generateSuccessValidation(taskName, domain) {
    const validations = {
      programming: 'Code runs without errors and produces expected output',
      photography: 'Images are properly exposed and in focus',
      music: 'Performance is recorded cleanly without major mistakes',
      cooking: 'Dish tastes good and looks presentable',
      writing: 'Text is clear, engaging, and error-free',
      design: 'Design meets brief requirements and is visually appealing',
      fitness: 'Completed all repetitions with proper form'
    };
    return validations[domain] || 'Outcome meets specified quality standards';
  }

  /**
   * Get domain-specific real-world application
   */
  getDomainApplication(domain, goal) {
    const applications = {
      programming: 'building professional software applications',
      photography: 'creating compelling visual content',
      music: 'performing or recording music',
      cooking: 'preparing meals for yourself and others',
      writing: 'communicating ideas effectively',
      design: 'creating user-friendly interfaces',
      fitness: 'maintaining health and physical capability'
    };
    return applications[domain] || `achieving your goal of "${goal}"`;
  }

  /**
   * Extract domain context from goal
   */
  extractDomainFromGoal(goal) {
    const goalLower = goal.toLowerCase();
    
    // Common domain patterns
    const domains = {
      programming: ['code', 'programming', 'software', 'app', 'javascript', 'python', 'react', 'node'],
      photography: ['photo', 'camera', 'photography', 'portrait', 'lighting'],
      music: ['guitar', 'piano', 'music', 'song', 'chord', 'melody'],
      cooking: ['cook', 'recipe', 'food', 'kitchen', 'baking'],
      writing: ['write', 'writing', 'blog', 'article', 'story'],
      design: ['design', 'ui', 'ux', 'graphic', 'layout'],
      fitness: ['fitness', 'exercise', 'workout', 'training', 'gym']
    };
    
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => goalLower.includes(keyword))) {
        return domain;
      }
    }
    
    return 'general';
  }

  /**
   * Get results from last validation run
   */
  getLastValidationResults() {
    return this.lastValidationResults || {
      passed: [],
      failed: [],
      warnings: [],
      score: 0
    };
  }

  /**
   * Extract user profile from context for personalized task generation
   */
  extractUserProfile(context) {
    const cognitive = context.cognitive || {};
    const learning = context.learning || {};
    const temporal = context.temporal || {};
    const user = context.user || {};
    
    return {
      skillLevel: cognitive.competence_level || learning.current_skill_level || 3,
      experience: this.mapSkillToExperience(cognitive.competence_level || learning.current_skill_level || 3),
      learningStyle: learning.learning_style || user.learning_style || 'mixed',
      processingPreference: learning.processing_preference || cognitive.processing_preference || 'balanced',
      timeAvailable: temporal.time_available_minutes || temporal.session_duration || 60,
      energyLevel: cognitive.energy_level || 3,
      mentalClarity: cognitive.mental_clarity || cognitive.energy_level || 3,
      struggleAreas: learning.struggle_areas || user.struggle_areas || [],
      preferredMode: learning.recommended_mode || 'mixed'
    };
  }

  /**
   * Extract environmental context for task adaptation
   */
  extractEnvironmentalContext(context) {
    const environmental = context.environmental || {};
    const technical = context.technical || {};
    const resource = context.resource || {};
    
    return {
      location: environmental.location_type || 'home',
      distractionLevel: environmental.distraction_level || 2,
      availableTools: technical.available_tools || technical.tool_availability || ['basic'],
      technicalSetup: technical.setup_description || technical.environment || 'standard',
      constraints: resource.constraints || environmental.constraints || []
    };
  }

  /**
   * Extract learning context for task personalization
   */
  extractLearningContext(context) {
    const learning = context.learning || {};
    const performance = context.performance || {};
    const user = context.user || {};
    
    return {
      recentSuccessRate: Math.round((performance.recent_success_rate || 0.7) * 100),
      completedTasks: performance.completed_tasks || learning.completed_tasks || 0,
      currentProjects: user.current_projects || learning.current_projects || [],
      interests: user.interests || learning.interests || []
    };
  }

  /**
   * Map numerical skill level to experience description
   */
  mapSkillToExperience(skillLevel) {
    const skillMap = {
      1: 'complete beginner',
      2: 'novice with basic exposure',
      3: 'intermediate with some experience',
      4: 'advanced with solid foundation',
      5: 'expert with deep knowledge'
    };
    return skillMap[skillLevel] || 'intermediate';
  }

  /**
   * Adapt task to learning style preferences
   */
  adaptTaskToLearningStyle(task, userProfile, domain) {
    const learningStyle = userProfile.learningStyle;
    
    // Learning style specific adaptations
    const adaptations = {
      visual: {
        programming: {
          suffix: ' Create diagrams or flowcharts to visualize the structure before coding.',
          resources: ['code visualization tools', 'flowchart software', 'syntax highlighting'],
          validation: 'Review code structure visually and create a diagram of data flow'
        },
        photography: {
          suffix: ' Study composition examples and create reference mood boards.',
          resources: ['composition guides', 'example photo galleries', 'grid overlays'],
          validation: 'Compare your shots to reference examples and composition rules'
        },
        music: {
          suffix: ' Use chord charts, sheet music, or tablature for reference.',
          resources: ['chord diagrams', 'sheet music', 'fretboard visualizations'],
          validation: 'Record performance and visually analyze waveform for timing'
        }
      },
      auditory: {
        programming: {
          suffix: ' Explain your code logic out loud as you write it.',
          resources: ['coding podcasts', 'video tutorials', 'pair programming'],
          validation: 'Explain your solution to someone else or record yourself teaching it'
        },
        photography: {
          suffix: ' Listen to photography podcasts or tutorials while practicing.',
          resources: ['photography podcasts', 'audio tutorials', 'critique sessions'],
          validation: 'Record yourself explaining your creative choices for each shot'
        },
        music: {
          suffix: ' Focus on listening to timing, rhythm, and tonal quality.',
          resources: ['backing tracks', 'metronome apps', 'audio examples'],
          validation: 'Record your performance and listen critically for improvements'
        }
      },
      kinesthetic: {
        programming: {
          suffix: ' Build the project incrementally, testing each small change.',
          resources: ['live coding environments', 'interactive tutorials', 'hands-on projects'],
          validation: 'Run and test your code frequently, fix issues as they appear'
        },
        photography: {
          suffix: ' Practice different angles and settings through active experimentation.',
          resources: ['camera controls', 'different lighting setups', 'varied subjects'],
          validation: 'Take multiple versions with different settings and compare results'
        },
        music: {
          suffix: ' Practice with physical repetition and muscle memory building.',
          resources: ['practice instruments', 'different playing positions', 'tempo variations'],
          validation: 'Play the piece multiple times, focusing on smooth transitions'
        }
      }
    };

    if (adaptations[learningStyle] && adaptations[learningStyle][domain]) {
      const adaptation = adaptations[learningStyle][domain];
      
      // Enhance description with learning style specific guidance
      task.description += adaptation.suffix;
      
      // Add learning style specific resources
      if (!task.resources_needed) task.resources_needed = [];
      task.resources_needed.push(...adaptation.resources);
      
      // Enhance success validation with learning style approach
      if (task.success_validation) {
        task.success_validation += ` ${adaptation.validation}`;
      }
      
      // Add learning style note
      task.learning_style_adaptation = learningStyle;
    }
    
    return task;
  }

  /**
   * Add environmental context awareness to tasks
   */
  addEnvironmentalContext(task, environmentalContext, domain) {
    const context = environmentalContext;
    
    // Adapt for high distraction environments
    if (context.distractionLevel >= 4) {
      task.description = `🔕 FOCUS MODE: ${task.description} Break this into 20-minute focused sessions.`;
      task.estimated_duration = this.adjustTimeForDistraction(task.estimated_duration, 1.5);
    }
    
    // Adapt for limited tools
    if (context.availableTools.includes('basic') && !context.availableTools.includes('professional')) {
      task.description += ` Use basic tools available - advanced equipment not required.`;
    }
    
    // Adapt for specific technical constraints
    if (domain === 'programming' && context.technicalSetup.includes('mobile')) {
      task.description += ` Use mobile-friendly coding apps and cloud environments.`;
    }
    
    // Add location-specific considerations
    if (context.location === 'public') {
      task.description += ` This can be done in public spaces without drawing attention.`;
    } else if (context.location === 'home') {
      task.description += ` Take advantage of your home environment for focused work.`;
    }
    
    // Add constraint-aware modifications
    if (context.constraints.includes('time')) {
      task.estimated_duration = this.adjustTimeForConstraints(task.estimated_duration, 0.8);
      task.description += ` Streamlined for time efficiency.`;
    }
    
    if (context.constraints.includes('budget')) {
      task.description += ` Uses free/low-cost resources only.`;
    }
    
    task.environmental_adaptations = {
      distraction_level: context.distractionLevel,
      location: context.location,
      constraints: context.constraints
    };
    
    return task;
  }

  /**
   * Adjust time estimates for distractions
   */
  adjustTimeForDistraction(timeStr, multiplier) {
    const match = timeStr.match(/(\d+)\s*(minutes?|hours?)/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      const adjusted = Math.round(value * multiplier);
      return `${adjusted} ${unit}`;
    }
    return timeStr;
  }

  /**
   * Adjust time estimates for constraints
   */
  adjustTimeForConstraints(timeStr, multiplier) {
    return this.adjustTimeForDistraction(timeStr, multiplier);
  }
}

export default HTATaskGeneration;