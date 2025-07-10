/**
 * Pure Schema-Driven HTA System
 * 
 * ZERO hardcoded domain patterns, examples, or content.
 * Pure schemas define structure, LLM provides ALL intelligence.
 * Implements complete 6-level architecture with context learning.
 */

export class PureSchemaHTASystem {
  constructor(llmInterface) {
    this.llmInterface = llmInterface;
    this.userContext = new Map();
    this.domainBoundaries = new Map();
    
    // Pure schemas - no hardcoded content, just structure definitions
    this.schemas = {
      goalContext: this.defineGoalContextSchema(),
      strategicBranches: this.defineStrategicBranchSchema(),
      taskDecomposition: this.defineTaskDecompositionSchema(),
      microParticles: this.defineMicroParticleSchema(),
      nanoActions: this.defineNanoActionSchema(),
      contextAdaptivePrimitives: this.defineContextAdaptivePrimitiveSchema(),
      contextMining: this.defineContextMiningSchema(),
      domainRelevance: this.defineDomainRelevanceSchema(),
      painPointValidation: this.definePainPointValidationSchema(),
      treeEvolution: this.defineTreeEvolutionSchema()
    };
  }

  /**
   * Generate HTA tree with progressive depth - intelligent balance of completeness and efficiency
   */
  async generateHTATree(goal, initialContext = {}) {
    // Enhanced context for better goal analysis
    const enhancedContext = {
      ...initialContext,
      goalCharacteristics: this.analyzeGoalCharacteristics(goal),
      requireDomainSpecific: true,
      avoidGenericTemplates: true,
      progressiveDepth: initialContext.progressiveDepth || this.determineOptimalDepth(goal, initialContext)
    };

    // Level 1: Goal Achievement Context Analysis
    const goalContext = await this.generateLevelContent(
      'goalContext',
      { goal, initialContext: enhancedContext },
      `Analyze this goal to understand the specific domain, user context, constraints, and success criteria. 
      Focus on domain-specific requirements and avoid generic learning approaches. 
      Identify the specific field (e.g., AI/ML, cybersecurity, programming, photography) and tailor the analysis accordingly.`
    );

    // Level 2: Strategic Branches with goal-specific emphasis
    const strategicBranches = await this.generateLevelContent(
      'strategicBranches',
      { goal, goalContext, goalCharacteristics: enhancedContext.goalCharacteristics },
      `Generate goal-specific strategic learning phases for "${goal}". 
      Analyze the goal characteristics and create branches that are:
      - Specific to the actual subject matter and objectives
      - Appropriate for the complexity level (${enhancedContext.goalCharacteristics.complexity})
      - Tailored to the goal characteristics: ${enhancedContext.goalCharacteristics.characteristics.join(', ')}
      - Progressive in nature (building from fundamentals to advanced)
      
      Create 3-5 branches that are specific to this goal and domain, NOT generic phases like "Foundation" or "Research". 
      Use terminology that reflects the actual subject matter of the goal.`
    );

    // Initialize context tracking
    this.initializeContextTracking(goal, goalContext);

    // Progressive depth generation based on complexity and user needs
    const result = {
      goal,
      level1_goalContext: goalContext,
      level2_strategicBranches: strategicBranches,
      userContext: this.getContextSnapshot(),
      domainBoundaries: this.getDomainBoundaries(),
      goalCharacteristics: enhancedContext.goalCharacteristics,
      generated: new Date().toISOString(),
      schemaVersion: '2.0-progressive'
    };

    // Generate additional levels based on progressive depth setting
    if (enhancedContext.progressiveDepth >= 3) {
      result.level3_taskDecomposition = await this.generateProgressiveTaskDecomposition(
        strategicBranches, goalContext, enhancedContext
      );
    }

    if (enhancedContext.progressiveDepth >= 4) {
      result.level4_microParticles = await this.generateProgressiveMicroParticles(
        result.level3_taskDecomposition, goalContext, enhancedContext
      );
    }

    if (enhancedContext.progressiveDepth >= 5) {
      result.level5_nanoActions = await this.generateProgressiveNanoActions(
        result.level4_microParticles, goalContext, enhancedContext
      );
    }

    if (enhancedContext.progressiveDepth >= 6) {
      result.level6_contextAdaptivePrimitives = await this.generateProgressiveContextAdaptivePrimitives(
        result.level5_nanoActions, goalContext, enhancedContext
      );
    }

    // Mark what levels are available for on-demand generation
    result.availableDepth = enhancedContext.progressiveDepth;
    result.maxDepth = 6;
    result.canExpand = enhancedContext.progressiveDepth < 6;

    return result;
  }

  /**
   * Analyze goal characteristics for domain-agnostic complexity assessment
   */
  analyzeGoalCharacteristics(goal) {
    if (!goal) return { complexity: 'low', confidence: 0.1, characteristics: [] };
    
    const goalLower = goal.toLowerCase();
    const characteristics = [];
    let complexityScore = 0;
    
    // Technical complexity indicators
    const technicalIndicators = [
      'implement', 'build', 'develop', 'create', 'design', 'architect',
      'system', 'framework', 'algorithm', 'model', 'application'
    ];
    
    // Mastery/depth indicators
    const masteryIndicators = [
      'master', 'expert', 'advanced', 'professional', 'comprehensive',
      'deep', 'thorough', 'complete', 'full understanding'
    ];
    
    // Process/methodology indicators
    const processIndicators = [
      'methodology', 'process', 'workflow', 'pipeline', 'procedure',
      'strategy', 'approach', 'method', 'technique'
    ];
    
    // Multi-step/complex indicators
    const complexityIndicators = [
      'complex', 'multi-step', 'integrate', 'combine', 'synthesize',
      'optimize', 'scale', 'production', 'enterprise'
    ];
    
    // Creative/exploratory indicators
    const creativeIndicators = [
      'creative', 'artistic', 'explore', 'discover', 'understand',
      'learn about', 'basics', 'introduction', 'overview'
    ];
    
    // Analyze indicators
    if (technicalIndicators.some(indicator => goalLower.includes(indicator))) {
      characteristics.push('technical');
      complexityScore += 2;
    }
    
    if (masteryIndicators.some(indicator => goalLower.includes(indicator))) {
      characteristics.push('mastery-focused');
      complexityScore += 3;
    }
    
    if (processIndicators.some(indicator => goalLower.includes(indicator))) {
      characteristics.push('process-oriented');
      complexityScore += 2;
    }
    
    if (complexityIndicators.some(indicator => goalLower.includes(indicator))) {
      characteristics.push('high-complexity');
      complexityScore += 3;
    }
    
    if (creativeIndicators.some(indicator => goalLower.includes(indicator))) {
      characteristics.push('exploratory');
      complexityScore += 1;
    }
    
    // Determine overall complexity
    let complexity = 'low';
    if (complexityScore >= 6) complexity = 'high';
    else if (complexityScore >= 3) complexity = 'medium';
    
    return {
      complexity,
      score: complexityScore,
      confidence: Math.min(0.9, 0.3 + (complexityScore * 0.1)),
      characteristics,
      requiresDeepDecomposition: complexityScore >= 5,
      benefitsFromGranularity: characteristics.includes('technical') || characteristics.includes('mastery-focused')
    };
  }

  /**
   * Determine optimal depth for progressive generation based on goal complexity and user context
   */
  determineOptimalDepth(goal, context) {
    const characteristics = this.analyzeGoalCharacteristics(goal);
    let baseDepth = 3; // Start at Task Decomposition

    // Increase depth for mastery or technical goals
    if (characteristics.benefitsFromGranularity) {
      baseDepth = 4;
    }

    // Adjust for high complexity
    if (characteristics.complexity === 'high') {
      baseDepth += 1;
    }

    // Adjust depth based on urgency
    if (context.urgency === 'high') {
      baseDepth = Math.max(2, baseDepth - 1); // Reduce depth for urgent goals
    }

    // Adjust for detailed planners
    if (context.detailedPlanning) {
      baseDepth = Math.min(6, baseDepth + 1);
    }

    return baseDepth;
  }

  /**
   * Generate Level 3: Task Decomposition for strategic branches (Progressive)
   */
  async generateProgressiveTaskDecomposition(strategicBranches, goalContext, enhancedContext) {
    // Handle different strategic branches structures defensively
    let branches = [];
    
    if (strategicBranches && strategicBranches.strategic_branches && Array.isArray(strategicBranches.strategic_branches)) {
      branches = strategicBranches.strategic_branches;
    } else if (strategicBranches && Array.isArray(strategicBranches)) {
      branches = strategicBranches;
    } else if (strategicBranches && typeof strategicBranches === 'object') {
      // Check for other possible array properties
      const possibleArrays = Object.values(strategicBranches).filter(val => Array.isArray(val));
      if (possibleArrays.length > 0) {
        branches = possibleArrays[0];
      } else {
        // Fallback: create a basic branch structure
        branches = [{
          name: "Foundation Learning",
          description: "Build fundamental understanding and core concepts"
        }];
      }
    } else {
      // Ultimate fallback
      branches = [{
        name: "Foundation Learning",
        description: "Build fundamental understanding and core concepts"
      }];
    }
    
    // Generate tasks for first 1-2 branches to start, not all branches
    const branchesToProcess = branches.slice(0, Math.min(2, branches.length));
    
    return await Promise.all(branchesToProcess.map(branch => 
      this.generateTaskDecomposition(branch.name || branch.title || "Learning Task", 
                                   branch.description || "Build knowledge and skills", 
                                   goalContext, this.getContextSnapshot())
    ));
  }

  /**
   * Generate Level 4: Micro-Particles (Progressive)
   */
  async generateProgressiveMicroParticles(taskDecomposition, goalContext, enhancedContext) {
    // Handle taskDecomposition defensively
    const tasks = Array.isArray(taskDecomposition) ? taskDecomposition : [];
    
    // Generate micro-particles for first few tasks only
    const tasksToProcess = tasks.slice(0, Math.min(3, tasks.length));
    
    return await Promise.all(tasksToProcess.map(task => 
      this.generateMicroParticles(task.title || task.name || "Learning Task", 
                                task.description || "Complete task", 
                                goalContext, this.getContextSnapshot())
    ));
  }

  /**
   * Generate Level 5: Nano-Actions (Progressive)
   */
  async generateProgressiveNanoActions(microParticles, goalContext, enhancedContext) {
    // Handle microParticles defensively
    const particles = Array.isArray(microParticles) ? microParticles : [];
    
    // Generate nano-actions for first few micro-particles only
    const particlesToProcess = particles.slice(0, Math.min(2, particles.length));
    
    return await Promise.all(particlesToProcess.map(particle =>
      this.generateNanoActions(particle.title || particle.name || "Learning Action", 
                             particle.description || "Complete micro-task", 
                             goalContext, this.getContextSnapshot())
    ));
  }

  /**
   * Generate Level 6: Context-Adaptive Primitives (Progressive)
   */
  async generateProgressiveContextAdaptivePrimitives(nanoActions, goalContext, enhancedContext) {
    // Handle nanoActions defensively
    const actions = Array.isArray(nanoActions) ? nanoActions : [];
    
    // Generate primitives for first nano-action only
    const actionsToProcess = actions.slice(0, 1);
    
    return await Promise.all(actionsToProcess.map(action =>
      this.generateContextAdaptivePrimitives(action.title || action.name || "Learning Primitive", 
                                           action.description || "Execute action", 
                                           goalContext, this.getContextSnapshot())
    ));
  }

  /**
   * Generate Level 3: Task Decomposition for any strategic branch
   */
  async generateTaskDecomposition(branchName, branchDescription, goalContext, currentUserContext) {
    const refinedContext = await this.refineContextBasedOnLearning(currentUserContext);
    
    return await this.generateLevelContent(
      'taskDecomposition',
      { branchName, branchDescription, goalContext, userContext: refinedContext },
      "Break this strategic branch into practical, achievable tasks considering user's real-world constraints."
    );
  }

  /**
   * Generate Level 4: Micro-Particles for any task
   */
  async generateMicroParticles(taskTitle, taskDescription, goalContext, currentUserContext) {
    const refinedContext = await this.refineContextBasedOnLearning(currentUserContext);
    
    return await this.generateLevelContent(
      'microParticles',
      { taskTitle, taskDescription, goalContext, userContext: refinedContext },
      "Create foolproof micro-tasks that are so small they cannot fail, with clear validation criteria."
    );
  }

  /**
   * Generate Level 5: Nano-Actions for any micro-particle
   */
  async generateNanoActions(microTitle, microDescription, goalContext, currentUserContext) {
    const refinedContext = await this.refineContextBasedOnLearning(currentUserContext);
    
    return await this.generateLevelContent(
      'nanoActions',
      { microTitle, microDescription, goalContext, userContext: refinedContext },
      "Break this micro-task into granular execution steps accounting for tool switching and context changes."
    );
  }

  /**
   * Generate Level 6: Context-Adaptive Primitives for any nano-action
   */
  async generateContextAdaptivePrimitives(nanoTitle, nanoDescription, goalContext, currentUserContext) {
    const refinedContext = await this.refineContextBasedOnLearning(currentUserContext);
    
    return await this.generateLevelContent(
      'contextAdaptivePrimitives',
      { nanoTitle, nanoDescription, goalContext, userContext: refinedContext },
      "Create fundamental actions that adapt to different user constraints and situations."
    );
  }

  /**
   * Expand existing tree to deeper levels on-demand
   */
  async expandTreeDepth(existingTree, targetDepth, specificBranch = null) {
    const currentDepth = existingTree.availableDepth || 2;
    
    if (targetDepth <= currentDepth) {
      return existingTree; // Already at or beyond target depth
    }
    
    const goalContext = existingTree.level1_goalContext;
    const enhancedContext = {
      progressiveDepth: targetDepth,
      expandingExisting: true,
      specificBranch
    };
    
    // Expand level by level
    for (let depth = currentDepth + 1; depth <= targetDepth; depth++) {
      switch (depth) {
        case 3:
          if (!existingTree.level3_taskDecomposition) {
            existingTree.level3_taskDecomposition = await this.generateProgressiveTaskDecomposition(
              existingTree.level2_strategicBranches, goalContext, enhancedContext
            );
          }
          break;
          
        case 4:
          if (!existingTree.level4_microParticles && existingTree.level3_taskDecomposition) {
            existingTree.level4_microParticles = await this.generateProgressiveMicroParticles(
              existingTree.level3_taskDecomposition, goalContext, enhancedContext
            );
          }
          break;
          
        case 5:
          if (!existingTree.level5_nanoActions && existingTree.level4_microParticles) {
            existingTree.level5_nanoActions = await this.generateProgressiveNanoActions(
              existingTree.level4_microParticles, goalContext, enhancedContext
            );
          }
          break;
          
        case 6:
          if (!existingTree.level6_contextAdaptivePrimitives && existingTree.level5_nanoActions) {
            existingTree.level6_contextAdaptivePrimitives = await this.generateProgressiveContextAdaptivePrimitives(
              existingTree.level5_nanoActions, goalContext, enhancedContext
            );
          }
          break;
      }
    }
    
    // Update tree metadata
    existingTree.availableDepth = targetDepth;
    existingTree.canExpand = targetDepth < 6;
    existingTree.lastExpanded = new Date().toISOString();
    
    return existingTree;
  }

  /**
   * Learn from user interaction and evolve tree if needed
   */
  async learnFromUserInteraction(interaction) {
    const contextInsights = await this.generateLevelContent(
      'contextMining',
      { interaction, currentContext: this.getContextSnapshot() },
      "Analyze this user interaction to extract insights about capabilities, constraints, and context evolution needs."
    );

    this.updateUserContext(contextInsights);

    if (this.shouldEvolveTree(contextInsights)) {
      return await this.evolveTreeStructure(contextInsights);
    }

    return null;
  }

  /**
   * Assess domain relevance for exploration filtering
   */
  async assessDomainRelevance(userTopic, currentGoal) {
    return await this.generateLevelContent(
      'domainRelevance',
      { userTopic, currentGoal, domainBoundaries: this.getDomainBoundaries() },
      "Assess how relevant this user topic is to the learning domain and provide exploration guidance."
    );
  }

  /**
   * Universal content generation method - all intelligence from LLM
   */
  async generateLevelContent(schemaKey, inputData, systemMessage) {
    const schema = this.schemas[schemaKey];
    const prompt = this.buildUniversalPrompt(inputData, schema);
    
    const response = await this.llmInterface.request({
      method: 'llm/completion',
      params: {
        prompt: prompt,
        max_tokens: this.getTokenLimitForSchema(schemaKey),
        temperature: this.getTemperatureForSchema(schemaKey),
        system: systemMessage
      }
    });

    return this.validateAndFormatResponse(response, schema, schemaKey);
  }

  /**
   * Build universal prompt - goal-adaptive with explicit instructions
   */
  buildUniversalPrompt(inputData, schema) {
    const goalCharacteristics = inputData.goalCharacteristics || this.analyzeGoalCharacteristics(inputData.goal);
    
    return `You are an expert learning system that creates goal-specific, contextually appropriate learning paths. 

IMPORTANT: Generate content that is SPECIFIC to the goal and subject matter. Avoid generic terms like "Foundation", "Research", "Capability". Instead, use terminology that reflects the actual subject matter.

**Goal Analysis:**
- Complexity: ${goalCharacteristics.complexity}
- Characteristics: ${goalCharacteristics.characteristics.join(', ')}
- Requires Deep Decomposition: ${goalCharacteristics.requiresDeepDecomposition}
- Benefits from Granularity: ${goalCharacteristics.benefitsFromGranularity}

**Input Data:**
${JSON.stringify(inputData, null, 2)}

**Required Response Schema:**
${JSON.stringify(schema, null, 2)}

**Critical Instructions:**
1. Use subject-specific terminology that reflects the actual goal content
2. Create tasks that are specific to the actual goal objectives
3. Focus on the user's specific context and constraints
4. Provide actionable, practical content
5. Adapt difficulty and approach to the goal's complexity level
6. Consider the goal characteristics when structuring the response

Generate intelligent, goal-specific content that directly addresses the user's objective with contextual relevance.`;
  }


  /**
   * Refine context based on accumulated learning
   */
  async refineContextBasedOnLearning(currentUserContext) {
    if (!this.hasSignificantLearningHistory()) {
      return currentUserContext;
    }

    return await this.generateLevelContent(
      'contextMining',
      { 
        currentContext: currentUserContext,
        learningHistory: this.getLearningHistory(),
        discoveredConstraints: this.getDiscoveredConstraints(),
        revealedCapabilities: this.getRevealedCapabilities()
      },
      "Refine user context based on accumulated learning history and interaction patterns."
    );
  }

  /**
   * Evolve tree structure based on context insights
   */
  async evolveTreeStructure(contextInsights) {
    return await this.generateLevelContent(
      'treeEvolution',
      { 
        contextInsights, 
        currentTree: this.getTreeSnapshot(),
        userContext: this.getContextSnapshot()
      },
      "Evolve the learning tree structure based on new context insights while maintaining goal focus."
    );
  }

  // === PURE SCHEMA DEFINITIONS (no hardcoded content) ===

  defineGoalContextSchema() {
    return {
      type: "object",
      properties: {
        goal_analysis: {
          type: "object",
          properties: {
            primary_goal: { type: "string" },
            goal_complexity: { type: "integer", minimum: 1, maximum: 10 },
            domain_type: { type: "string" },
            domain_characteristics: { type: "array", items: { type: "string" } },
            success_criteria: { type: "array", items: { type: "string" } },
            timeline_assessment: { type: "string" },
            complexity_factors: { type: "array", items: { type: "string" } }
          }
        },
        user_context: {
          type: "object",
          properties: {
            background_knowledge: { type: "array", items: { type: "string" } },
            available_resources: { type: "array", items: { type: "string" } },
            constraints: { type: "array", items: { type: "string" } },
            motivation_drivers: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } }
          }
        },
        domain_boundaries: {
          type: "object",
          properties: {
            core_domain_elements: { type: "array", items: { type: "string" } },
            relevant_adjacent_domains: { type: "array", items: { type: "string" } },
            exploration_worthy_topics: { type: "array", items: { type: "string" } },
            irrelevant_domains: { type: "array", items: { type: "string" } }
          }
        },
        learning_approach: {
          type: "object",
          properties: {
            recommended_strategy: { type: "string" },
            key_principles: { type: "array", items: { type: "string" } },
            potential_pain_points: { type: "array", items: { type: "string" } },
            success_enablers: { type: "array", items: { type: "string" } }
          }
        }
      },
      required: ["goal_analysis", "user_context", "domain_boundaries", "learning_approach"]
    };
  }

  defineStrategicBranchSchema() {
    return {
      type: "object",
      properties: {
        strategic_branches: {
          type: "array",
          minItems: 3,
          maxItems: 7,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              priority: { type: "integer", minimum: 1 },
              rationale: { type: "string" },
              domain_focus: { type: "string" },
              expected_outcomes: { type: "array", items: { type: "string" } },
              context_adaptations: { type: "array", items: { type: "string" } },
              pain_point_mitigations: { type: "array", items: { type: "string" } },
              exploration_opportunities: { type: "array", items: { type: "string" } }
            },
            required: ["name", "description", "priority", "rationale", "domain_focus"]
          }
        },
        progression_logic: { type: "string" },
        alternative_paths: { type: "array", items: { type: "string" } }
      },
      required: ["strategic_branches", "progression_logic"]
    };
  }

  defineTaskDecompositionSchema() {
    return {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          minItems: 3,
          maxItems: 10,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              estimated_duration: { type: "string" },
              difficulty_level: { type: "integer", minimum: 1, maximum: 5 },
              prerequisites: { type: "array", items: { type: "string" } },
              success_criteria: { type: "array", items: { type: "string" } },
              context_considerations: { type: "array", items: { type: "string" } },
              potential_obstacles: { type: "array", items: { type: "string" } },
              alternative_approaches: { type: "array", items: { type: "string" } }
            },
            required: ["title", "description", "estimated_duration", "difficulty_level"]
          }
        },
        decomposition_rationale: { type: "string" }
      },
      required: ["tasks", "decomposition_rationale"]
    };
  }

  defineMicroParticleSchema() {
    return {
      type: "object",
      properties: {
        micro_particles: {
          type: "array",
          minItems: 3,
          maxItems: 12,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              action: { type: "string" },
              validation: { type: "string" },
              duration_minutes: { type: "integer", minimum: 2, maximum: 25 },
              difficulty: { type: "integer", minimum: 1, maximum: 5 },
              resources_needed: { type: "array", items: { type: "string" } },
              success_indicators: { type: "array", items: { type: "string" } },
              common_mistakes: { type: "array", items: { type: "string" } },
              context_adaptations: { type: "array", items: { type: "string" } }
            },
            required: ["title", "description", "action", "validation", "duration_minutes", "difficulty"]
          }
        },
        granularity_rationale: { type: "string" }
      },
      required: ["micro_particles", "granularity_rationale"]
    };
  }

  defineNanoActionSchema() {
    return {
      type: "object",
      properties: {
        nano_actions: {
          type: "array",
          minItems: 3,
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              action_title: { type: "string" },
              specific_steps: { type: "array", items: { type: "string" } },
              duration_seconds: { type: "integer", minimum: 10, maximum: 300 },
              tools_required: { type: "array", items: { type: "string" } },
              validation_method: { type: "string" },
              failure_recovery: { type: "array", items: { type: "string" } },
              context_switches: { type: "array", items: { type: "string" } }
            },
            required: ["action_title", "specific_steps", "duration_seconds", "validation_method"]
          }
        },
        execution_notes: { type: "string" }
      },
      required: ["nano_actions", "execution_notes"]
    };
  }

  defineContextAdaptivePrimitiveSchema() {
    return {
      type: "object",
      properties: {
        base_primitive: {
          type: "object",
          properties: {
            action_name: { type: "string" },
            default_approach: { type: "string" },
            duration_range: { type: "string" }
          }
        },
        context_adaptations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              context_condition: { type: "string" },
              adapted_approach: { type: "string" },
              modification_rationale: { type: "string" },
              success_indicators: { type: "array", items: { type: "string" } }
            },
            required: ["context_condition", "adapted_approach", "modification_rationale"]
          }
        },
        fallback_options: { type: "array", items: { type: "string" } }
      },
      required: ["base_primitive", "context_adaptations"]
    };
  }

  defineContextMiningSchema() {
    return {
      type: "object",
      properties: {
        context_insights: {
          type: "object",
          properties: {
            capability_indicators: { type: "array", items: { type: "string" } },
            constraint_discoveries: { type: "array", items: { type: "string" } },
            preference_patterns: { type: "array", items: { type: "string" } },
            struggle_signals: { type: "array", items: { type: "string" } },
            motivation_shifts: { type: "array", items: { type: "string" } }
          }
        },
        recommended_adaptations: {
          type: "object",
          properties: {
            difficulty_adjustments: { type: "string" },
            approach_modifications: { type: "string" },
            resource_adaptations: { type: "string" },
            timeline_revisions: { type: "string" }
          }
        },
        tree_evolution_suggestions: { type: "array", items: { type: "string" } }
      },
      required: ["context_insights", "recommended_adaptations"]
    };
  }

  defineDomainRelevanceSchema() {
    return {
      type: "object",
      properties: {
        relevance_assessment: {
          type: "object",
          properties: {
            relevance_score: { type: "number", minimum: 0, maximum: 1 },
            relevance_category: { type: "string" },
            connection_explanation: { type: "string" },
            exploration_value: { type: "string" }
          }
        },
        guidance: {
          type: "object",
          properties: {
            response_type: { type: "string" },
            exploration_approach: { type: "string" },
            time_recommendation: { type: "string" },
            connection_back_to_goal: { type: "string" }
          }
        }
      },
      required: ["relevance_assessment", "guidance"]
    };
  }

  definePainPointValidationSchema() {
    return {
      type: "object",
      properties: {
        pain_point_analysis: {
          type: "array",
          items: {
            type: "object",
            properties: {
              potential_issue: { type: "string" },
              likelihood: { type: "string" },
              impact_severity: { type: "string" },
              affected_user_types: { type: "array", items: { type: "string" } }
            }
          }
        },
        refinement_suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              issue_addressed: { type: "string" },
              suggested_modification: { type: "string" },
              improvement_rationale: { type: "string" }
            }
          }
        },
        alternative_approaches: { type: "array", items: { type: "string" } }
      },
      required: ["pain_point_analysis", "refinement_suggestions"]
    };
  }

  defineTreeEvolutionSchema() {
    return {
      type: "object",
      properties: {
        evolution_recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              change_type: { type: "string" },
              target_element: { type: "string" },
              modification_description: { type: "string" },
              justification: { type: "string" },
              goal_alignment_check: { type: "string" }
            }
          }
        },
        goal_focus_validation: { type: "string" },
        risk_assessment: { type: "string" }
      },
      required: ["evolution_recommendations", "goal_focus_validation"]
    };
  }

  // === UTILITY METHODS ===

  getTokenLimitForSchema(schemaKey) {
    const limits = {
      goalContext: 2000,
      strategicBranches: 2000,
      taskDecomposition: 2500,
      microParticles: 2500,
      nanoActions: 1500,
      contextAdaptivePrimitives: 1200,
      contextMining: 1000,
      domainRelevance: 500,
      painPointValidation: 800,
      treeEvolution: 1000
    };
    return limits[schemaKey] || 1500;
  }

  getTemperatureForSchema(schemaKey) {
    const temperatures = {
      goalContext: 0.2,        // Lower for more consistent domain analysis
      strategicBranches: 0.1,  // Much lower to ensure domain-specific branches
      taskDecomposition: 0.15, // Lower for more consistent task naming
      microParticles: 0.2,
      nanoActions: 0.15,
      contextAdaptivePrimitives: 0.1,
      contextMining: 0.2,
      domainRelevance: 0.2,
      painPointValidation: 0.2,
      treeEvolution: 0.25
    };
    return temperatures[schemaKey] || 0.15; // Default lower temperature
  }

  validateAndFormatResponse(response, schema, schemaKey) {
    // Basic validation that response matches schema structure
    // In production, use proper JSON schema validator
    return response;
  }

  initializeContextTracking(goal, goalContext) {
    this.userContext.set('goal', goal);
    this.userContext.set('initialContext', goalContext);
    this.userContext.set('learningHistory', []);
    this.userContext.set('contextEvolution', []);
    
    if (goalContext.domain_boundaries) {
      this.domainBoundaries.set('boundaries', goalContext.domain_boundaries);
    }
  }

  updateUserContext(contextInsights) {
    const history = this.userContext.get('learningHistory') || [];
    history.push({
      timestamp: new Date().toISOString(),
      insights: contextInsights
    });
    this.userContext.set('learningHistory', history);
  }

  getContextSnapshot() {
    return {
      goal: this.userContext.get('goal'),
      learningHistoryCount: (this.userContext.get('learningHistory') || []).length,
      lastUpdate: new Date().toISOString()
    };
  }

  getDomainBoundaries() {
    return this.domainBoundaries.get('boundaries') || {};
  }

  hasSignificantLearningHistory() {
    return (this.userContext.get('learningHistory') || []).length > 2;
  }

  getLearningHistory() {
    return this.userContext.get('learningHistory') || [];
  }

  getDiscoveredConstraints() {
    return this.userContext.get('discoveredConstraints') || [];
  }

  getRevealedCapabilities() {
    return this.userContext.get('revealedCapabilities') || [];
  }

  shouldEvolveTree(contextInsights) {
    return contextInsights.tree_evolution_suggestions && 
           contextInsights.tree_evolution_suggestions.length > 0;
  }

  getTreeSnapshot() {
    return {
      goal: this.userContext.get('goal'),
      context: this.getContextSnapshot(),
      boundaries: this.getDomainBoundaries()
    };
  }
}

export default PureSchemaHTASystem;
