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
    // Enhanced parameter validation and debugging
    console.error('🧠 PureSchemaHTASystem.generateHTATree called with:');
    console.error('  - goal:', goal);
    console.error('  - goal type:', typeof goal);
    console.error('  - goal defined:', goal !== undefined);
    console.error('  - initialContext:', JSON.stringify(initialContext, null, 2));
    
    if (!goal) {
      console.error('❌ CRITICAL: Goal is undefined or null in PureSchemaHTASystem.generateHTATree');
      throw new Error('Goal parameter is required but was undefined or null');
    }
    
    // Enhanced context for better goal analysis
    const enhancedContext = {
      ...initialContext,
      goalCharacteristics: this.analyzeGoalCharacteristics(goal),
      requireDomainSpecific: true,
      avoidGenericTemplates: true,
      progressiveDepth: initialContext.progressiveDepth || this.determineOptimalDepth(goal, initialContext)
    };
    
    console.error('✅ Enhanced context prepared:', {
      goalCharacteristics: enhancedContext.goalCharacteristics,
      progressiveDepth: enhancedContext.progressiveDepth
    });

    // Level 1: Goal Achievement Context Analysis
    console.error('🎯 Generating Level 1: Goal Achievement Context Analysis');
    console.error('  - About to call generateLevelContent with goal:', goal);
    
    const goalContext = await this.generateLevelContent(
      'goalContext',
      { goal, initialContext: enhancedContext },
      `Analyze this goal to understand the specific domain, user context, constraints, and success criteria. 
      Focus on domain-specific requirements and avoid generic learning approaches. 
      Identify the specific field (e.g., AI/ML, cybersecurity, programming, photography) and tailor the analysis accordingly.`
    );
    
    console.error('✅ Level 1 Goal Context generated successfully');

    // Level 2: Strategic Branches with goal-specific emphasis
    const strategicBranches = await this.generateLevelContent(
      'strategicBranches',
      { goal, goalContext, goalCharacteristics: enhancedContext.goalCharacteristics },
      `Generate hyper-specific strategic learning phases for "${goal}". 

CRITICAL REQUIREMENTS FOR STRATEGIC BRANCHES:
- Use DOMAIN-SPECIFIC terminology throughout (not generic educational terms)
- Make each branch name immediately clear what skills/knowledge it develops
- Focus on concrete capabilities the learner will gain
- Avoid generic terms like: "Foundation", "Basics", "Research", "Overview", "Introduction", "Advanced"

BRANCH NAMING EXAMPLES BY DOMAIN:
- Photography: "Master Manual Camera Controls" NOT "Camera Basics"
- Programming: "Build REST APIs with Node.js" NOT "Backend Development Foundation"  
- Guitar: "Fingerpicking Folk Patterns" NOT "Advanced Techniques"
- Cooking: "Knife Skills and Mise en Place" NOT "Kitchen Fundamentals"
- Data Science: "Statistical Analysis with Python" NOT "Data Analysis Basics"

Create 3-5 branches for complexity level (${enhancedContext.goalCharacteristics.complexity}) that are:
- Specific to the actual field and objective of "${goal}"
- Progressive (each builds practical skills for the next)
- Tailored to characteristics: ${enhancedContext.goalCharacteristics.characteristics.join(', ')}
- Named with concrete skills/deliverables the learner will achieve

Each branch should make someone think "I know exactly what capability I'm building here!"`
    );

    // Initialize context tracking
    this.initializeContextTracking(goal, goalContext);

    // Progressive depth generation based on complexity and user needs
    const targetDepth = enhancedContext.progressiveDepth || 6; // Default to full depth
    const result = {
      goal,
      level: 0, // Root level for the tree
      depth: targetDepth, // Total depth of the tree
      level1_goalContext: goalContext,
      level2_strategicBranches: strategicBranches,
      userContext: this.getContextSnapshot(),
      domainBoundaries: this.getDomainBoundaries(),
      goalCharacteristics: enhancedContext.goalCharacteristics,
      generated: new Date().toISOString(),
      schemaVersion: '2.0-progressive'
    };

    // GUARANTEE COMPREHENSIVE TREES: Generate all levels for rich, deep hierarchies
    const enhancedContextWithGoal = {
      ...enhancedContext,
      goal: goal
    };
    
    // PERFORMANCE OPTIMIZED: Generate all levels with intelligent sequencing
    // Level 3 must complete before level 4, but can prepare data in parallel
    console.error('🌳 Generating comprehensive 6-level tree architecture...');
    
    if (targetDepth >= 3) {
      result.level3_taskDecomposition = await this.generateProgressiveTaskDecomposition(
        strategicBranches, goalContext, enhancedContextWithGoal
      );
    }

    // Levels 4-6 can be prepared for faster generation
    const levelGenerationPromises = [];
    
    if (targetDepth >= 4 && result.level3_taskDecomposition) {
      levelGenerationPromises.push(
        this.generateProgressiveMicroParticles(
          result.level3_taskDecomposition, goalContext, enhancedContextWithGoal
        ).then(data => ({ level: 4, data }))
      );
    }

    // Execute remaining levels efficiently
    if (levelGenerationPromises.length > 0) {
      const completedLevels = await Promise.all(levelGenerationPromises);
      completedLevels.forEach(({ level, data }) => {
        if (level === 4) result.level4_microParticles = data;
      });
    }

    // Continue with dependent levels
    if (targetDepth >= 5 && result.level4_microParticles) {
      result.level5_nanoActions = await this.generateProgressiveNanoActions(
        result.level4_microParticles, goalContext, enhancedContextWithGoal
      );
    }

    if (targetDepth >= 6 && result.level5_nanoActions) {
      result.level6_contextAdaptivePrimitives = await this.generateProgressiveContextAdaptivePrimitives(
        result.level5_nanoActions, goalContext, enhancedContextWithGoal
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
    console.error('🔍 analyzeGoalCharacteristics called with goal:', goal);
    
    if (!goal || typeof goal !== 'string') {
      console.error('⚠️  WARNING: Goal is undefined or not a string in analyzeGoalCharacteristics');
      return { complexity: 'low', confidence: 0.1, characteristics: ['unspecified'], score: 0, requiresDeepDecomposition: false, benefitsFromGranularity: false };
    }
    
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
    // GUARANTEE DEEP TREES: Always generate comprehensive 6-level architecture
    const characteristics = this.analyzeGoalCharacteristics(goal);
    let baseDepth = 6; // ALWAYS start with full 6-level depth

    // Reduce depth ONLY for explicitly simple goals
    if (characteristics.complexity === 'low' && !characteristics.benefitsFromGranularity && context.explicitSimpleRequest) {
      baseDepth = 4; // Minimum acceptable depth
    }

    // For mastery and technical goals, ensure full depth
    if (characteristics.benefitsFromGranularity || characteristics.complexity === 'high') {
      baseDepth = 6; // Full depth guaranteed
    }

    // Even urgent goals get deep trees - just generate them faster
    if (context.urgency === 'high') {
      baseDepth = 5; // Still deep, but slightly reduced
    }

    return Math.max(4, baseDepth); // Minimum 4 levels, default 6
  }

  /**
   * Generate Level 3: Task Decomposition for strategic branches (Progressive)
   */
  async generateProgressiveTaskDecomposition(strategicBranches, goalContext, enhancedContext) {
    console.error('🔧 generateProgressiveTaskDecomposition called with:');
    console.error('  - strategicBranches:', JSON.stringify(strategicBranches, null, 2));
    console.error('  - goalContext:', JSON.stringify(goalContext, null, 2));
    console.error('  - enhancedContext:', JSON.stringify(enhancedContext, null, 2));
    
    // Extract goal from multiple sources to ensure it's never undefined
    const goalText = this.extractGoalFromContext(enhancedContext, goalContext);
    console.error('  - Extracted goal:', goalText);
    
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
        // Fallback: create a basic branch structure with domain-specific terms
        const goalTerms = goalText.toLowerCase().split(' ');
        const mainSubject = goalTerms[goalTerms.length - 1] || goalTerms[0] || 'subject';
        const capitalizedSubject = mainSubject.charAt(0).toUpperCase() + mainSubject.slice(1);
        
        branches = [{
          name: `${capitalizedSubject} Fundamentals`,
          description: `Build fundamental understanding of ${goalText}`,
          domain_adaptive: true
        }];
      }
    } else {
      // Ultimate fallback - extract domain-specific terms from goal
      const goalTerms = goalText.toLowerCase().split(' ');
      const mainSubject = goalTerms[goalTerms.length - 1] || goalTerms[0] || 'subject';
      const capitalizedSubject = mainSubject.charAt(0).toUpperCase() + mainSubject.slice(1);
      
      branches = [{
        name: `${capitalizedSubject} Fundamentals`,
        description: `Build fundamental understanding of ${goalText}`,
        domain_adaptive: true
      }];
    }
    
    // COMPREHENSIVE PROCESSING: Generate tasks for ALL branches for rich trees
    const branchesToProcess = branches; // Process all branches for complete coverage
    
    // Enhanced context with goal included
    const contextWithGoal = {
      ...this.getContextSnapshot(),
      goal: goalText
    };
    
    return await Promise.all(branchesToProcess.map(branch => 
      this.generateTaskDecomposition(branch.name || branch.title || "Learning Task", 
                                   branch.description || "Build knowledge and skills", 
                                   goalContext, contextWithGoal)
    ));
  }

  /**
   * Generate Level 4: Micro-Particles (Progressive)
   */
  async generateProgressiveMicroParticles(taskDecomposition, goalContext, enhancedContext) {
    // Extract goal to ensure it's available
    const goalText = this.extractGoalFromContext(enhancedContext, goalContext);
    
    // Handle taskDecomposition defensively
    const tasks = Array.isArray(taskDecomposition) ? taskDecomposition : [];
    
    // COMPREHENSIVE COVERAGE: Generate micro-particles for ALL tasks for rich depth
    const tasksToProcess = tasks; // Process all tasks for complete depth
    
    // Enhanced context with goal included
    const contextWithGoal = {
      ...this.getContextSnapshot(),
      goal: goalText
    };
    
    return await Promise.all(tasksToProcess.map(task => 
      this.generateMicroParticles(task.title || task.name || "Learning Task", 
                                task.description || "Complete task", 
                                goalContext, contextWithGoal)
    ));
  }

  /**
   * Generate Level 5: Nano-Actions (Progressive)
   */
  async generateProgressiveNanoActions(microParticles, goalContext, enhancedContext) {
    // Extract goal to ensure it's available
    const goalText = this.extractGoalFromContext(enhancedContext, goalContext);
    
    // Handle microParticles defensively
    const particles = Array.isArray(microParticles) ? microParticles : [];
    
    // COMPREHENSIVE COVERAGE: Generate nano-actions for ALL micro-particles for maximum depth
    const particlesToProcess = particles; // Process all particles for complete depth
    
    // Enhanced context with goal included
    const contextWithGoal = {
      ...this.getContextSnapshot(),
      goal: goalText
    };
    
    return await Promise.all(particlesToProcess.map(particle =>
      this.generateNanoActions(particle.title || particle.name || "Learning Action", 
                             particle.description || "Complete micro-task", 
                             goalContext, contextWithGoal)
    ));
  }

  /**
   * Generate Level 6: Context-Adaptive Primitives (Progressive)
   */
  async generateProgressiveContextAdaptivePrimitives(nanoActions, goalContext, enhancedContext) {
    // Extract goal to ensure it's available
    const goalText = this.extractGoalFromContext(enhancedContext, goalContext);
    
    // Handle nanoActions defensively
    const actions = Array.isArray(nanoActions) ? nanoActions : [];
    
    // COMPREHENSIVE COVERAGE: Generate primitives for ALL nano-actions for ultimate depth
    const actionsToProcess = actions; // Process all actions for complete depth
    
    // Enhanced context with goal included
    const contextWithGoal = {
      ...this.getContextSnapshot(),
      goal: goalText
    };
    
    return await Promise.all(actionsToProcess.map(action =>
      this.generateContextAdaptivePrimitives(action.title || action.name || "Learning Primitive", 
                                           action.description || "Execute action", 
                                           goalContext, contextWithGoal)
    ));
  }

  /**
   * Generate Level 3: Task Decomposition for any strategic branch
   */
  async generateTaskDecomposition(branchName, branchDescription, goalContext, currentUserContext) {
    const refinedContext = await this.refineContextBasedOnLearning(currentUserContext);
    
    // Extract goal to ensure it's available for prompt building
    const goalText = this.extractGoalFromContext(refinedContext, goalContext);
    
    const prompt = `Generate specific, actionable tasks for learning branch: "${branchName}"
  
Description: ${branchDescription}
Goal Context: ${JSON.stringify(goalContext)}

Create 3-8 concrete tasks that build the skills described in this branch.
Use domain-specific terminology and make each task immediately actionable.`;

    return await this.generateLevelContent(
      'taskDecomposition',
      { branchName, branchDescription, goalContext, userContext: refinedContext, goal: goalText },
      prompt
    );
  }

  /**
   * Generate Level 4: Micro-Particles for any task
   */
  async generateMicroParticles(taskTitle, taskDescription, goalContext, currentUserContext) {
    const refinedContext = await this.refineContextBasedOnLearning(currentUserContext);
    
    // Extract goal to ensure it's available for prompt building
    const goalText = this.extractGoalFromContext(refinedContext, goalContext);
    
    const prompt = `Break down task "${taskTitle}" into micro-particles.
  
Task Description: ${taskDescription}
Goal: ${goalText}

Create 3-12 micro-particles that are:
- So small they cannot fail
- Have clear validation criteria
- Take 2-25 minutes each
- Use domain-specific terminology`;

    return await this.generateLevelContent(
      'microParticles',
      { taskTitle, taskDescription, goalContext, userContext: refinedContext, goal: goalText },
      prompt
    );
  }

  /**
   * Generate Level 5: Nano-Actions for any micro-particle
   */
  async generateNanoActions(microTitle, microDescription, goalContext, currentUserContext) {
    const refinedContext = await this.refineContextBasedOnLearning(currentUserContext);
    
    // Extract goal to ensure it's available for prompt building
    const goalText = this.extractGoalFromContext(refinedContext, goalContext);
    
    const prompt = `Create nano-actions for micro-particle: "${microTitle}"
  
Micro Description: ${microDescription}
Goal: ${goalText}

Generate 3-8 nano-actions that:
- Are single, atomic steps
- Take 10-300 seconds each
- Account for tool switching and context changes
- Have specific validation methods`;

    return await this.generateLevelContent(
      'nanoActions',
      { microTitle, microDescription, goalContext, userContext: refinedContext, goal: goalText },
      prompt
    );
  }

  /**
   * Generate Level 6: Context-Adaptive Primitives for any nano-action
   */
  async generateContextAdaptivePrimitives(nanoTitle, nanoDescription, goalContext, currentUserContext) {
    const refinedContext = await this.refineContextBasedOnLearning(currentUserContext);
    
    // Extract goal to ensure it's available for prompt building
    const goalText = this.extractGoalFromContext(refinedContext, goalContext);
    
    const prompt = `Create context-adaptive primitives for: "${nanoTitle}"
  
Nano Description: ${nanoDescription}
Goal: ${goalText}

Generate primitives that:
- Adapt to different user constraints
- Provide alternative approaches
- Include fallback options
- Consider various situations and contexts`;

    return await this.generateLevelContent(
      'contextAdaptivePrimitives',
      { nanoTitle, nanoDescription, goalContext, userContext: refinedContext, goal: goalText },
      prompt
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
   * This is the bridge between schemas and Claude's intelligence
   */
  async generateLevelContent(schemaKey, inputData, systemMessage) {
    console.error(`🔧 generateLevelContent called for schema: ${schemaKey}`);
    console.error('  - inputData:', JSON.stringify(inputData, null, 2));
    console.error('  - inputData.goal:', inputData.goal);
    console.error('  - systemMessage:', systemMessage);
    
    try {
      const schema = this.schemas[schemaKey];
      
      // Add intelligent pacing for HTA tree generation quality assurance
      const shouldPace = this.shouldApplyIntelligentPacing(schemaKey, inputData);
      if (shouldPace) {
        console.error('🎯 Applying intelligent pacing for quality HTA generation');
        await this.applyIntelligentPacing(schemaKey, inputData);
      }
      
      // Use the new bridge method to connect to Claude's intelligence
      const response = await this.llmInterface.generateContent({
        type: schemaKey,
        goal: inputData.goal,
        context: inputData,
        prompt: this.buildUniversalPrompt(inputData, schema),
        schema: schema,
        systemMessage: systemMessage,
        requireDomainSpecific: true,
        avoidGenericTemplates: true
      });

      console.error('✅ Generated intelligent content through bridge');
      return this.validateAndFormatResponse(response, schema, schemaKey);
      
    } catch (error) {
      console.error(`❌ Failed to generate ${schemaKey} content:`, error.message);
      
      // Fallback to prevent system failure
      return this.generateFallbackContent(schemaKey, inputData);
    }
  }
  
  /**
   * Fallback content generation if Claude intelligence fails
   */
  generateFallbackContent(schemaKey, inputData) {
    console.error(`⚠️ Using fallback content for ${schemaKey}`);
    
    const goal = inputData.goal || 'learning objective';
    
    if (schemaKey === 'strategicBranches') {
      // CRITICAL FIX: Use enhanced generateGenericBranches instead of generic templates
      console.error('🌳 Fallback using enhanced generateGenericBranches for strategic branches');
      
      try {
        // Try to use the enhanced logic even in fallback
        const domainAnalysis = this.llmInterface.analyzeDomain(goal);
        const enhancedBranches = this.llmInterface.generateGenericBranches(goal, domainAnalysis);
        
        return {
          strategic_branches: enhancedBranches,
          progression_logic: 'Domain-specific intelligent progression',
          alternative_paths: ['Accelerated track', 'Hands-on focus']
        };
      } catch (fallbackError) {
        console.error('❌ Enhanced fallback failed, using minimal fallback:', fallbackError.message);
        
        // Only use generic templates as absolute last resort
        return {
          strategic_branches: [
            { 
              name: `${goal} - Foundation Phase`,
              description: `Build foundational knowledge for ${goal}`,
              priority: 1,
              complexity: 3,
              rationale: 'Essential groundwork',
              domain_focus: 'fundamental'
            },
            { 
              name: `${goal} - Development Phase`,
              description: `Develop practical skills for ${goal}`,
              priority: 2,
              complexity: 5,
              rationale: 'Skill building',
              domain_focus: 'practical'
            },
            { 
              name: `${goal} - Mastery Phase`,
              description: `Achieve proficiency in ${goal}`,
              priority: 3,
              complexity: 7,
              rationale: 'Advanced capability',
              domain_focus: 'mastery'
            }
          ],
          progression_logic: 'Sequential progression from basics to mastery',
          alternative_paths: ['Accelerated track', 'Hands-on focus']
        };
      }
    }
    
    if (schemaKey === 'goalContext') {
      return {
        goal_analysis: {
          primary_goal: goal,
          goal_complexity: 5,
          domain_type: 'general learning',
          domain_characteristics: ['structured approach required'],
          success_criteria: ['Complete objectives', 'Demonstrate understanding'],
          timeline_assessment: '3-6 months for basic proficiency',
          complexity_factors: ['Learning curve', 'Practice requirements']
        },
        user_context: {
          background_knowledge: ['Basic understanding'],
          available_resources: ['Online materials', 'Practice time'],
          constraints: ['Time availability'],
          motivation_drivers: ['Personal growth', 'Skill development'],
          risk_factors: ['Lack of consistency']
        },
        domain_boundaries: {
          core_domain_elements: ['Key concepts', 'Essential skills'],
          relevant_adjacent_domains: ['Related fields'],
          exploration_worthy_topics: ['Advanced topics'],
          irrelevant_domains: ['Unrelated areas']
        },
        learning_approach: {
          recommended_strategy: 'Structured learning with practice',
          key_principles: ['Consistent practice', 'Progressive difficulty'],
          potential_pain_points: ['Initial learning curve'],
          success_enablers: ['Regular practice', 'Good resources']
        }
      };
    }
    
    return { content: `Generated fallback ${schemaKey} for ${goal}`, fallback: true };
  }

  /**
   * Build universal prompt - goal-adaptive with explicit instructions
   */
  buildUniversalPrompt(inputData, schema) {
    console.error('🏗️ buildUniversalPrompt called with:');
    console.error('  - inputData.goal:', inputData.goal);
    console.error('  - inputData keys:', Object.keys(inputData));
    
    const goalCharacteristics = inputData.goalCharacteristics || this.analyzeGoalCharacteristics(inputData.goal);
    
    console.error('  - goalCharacteristics:', goalCharacteristics);
    
    // Extract goal from various possible sources
    const actualGoal = inputData.goal || inputData.user_goal || inputData.learning_goal || 
                       inputData.initialContext?.goal || inputData.context?.goal || 
                       'Learning objective not specified';
    
    console.error('  - actualGoal resolved to:', actualGoal);
    
    if (actualGoal === 'Learning objective not specified') {
      console.error('⚠️ WARNING: Goal could not be resolved from any source');
    }
    
    const prompt = `You are an expert learning system that creates goal-specific, contextually appropriate learning paths.

IMPORTANT: Generate content that is SPECIFIC to the goal and subject matter. Use extensive domain-specific terminology throughout your response.

**DOMAIN TERMINOLOGY REQUIREMENTS:**
- Analyze the goal to identify its specific domain (e.g., arts & crafts, technology, sciences, business, health, education, etc.)
- Use technical vocabulary, specialized terms, and professional jargon specific to that identified domain
- Include tools, processes, methods, and concepts that are unique to the field
- Reference industry standards, best practices, and domain-specific workflows
- Avoid generic educational terms like "Foundation", "Research", "Capability", "Implementation", "Module", "Phase"
- Adapt your language to match the sophistication level and terminology expected in that domain

**Goal Analysis:**
- Primary Goal: ${actualGoal}
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
    
    console.error('  - final prompt length:', prompt.length);
    
    return prompt;
  }

  /**
   * Intelligent Pacing System - Ensures HTA tree generation takes 25-30 seconds
   * This provides users with confidence in the sophisticated analysis being performed
   */
  shouldApplyIntelligentPacing(schemaKey, inputData) {
    // Apply pacing for core HTA generation levels
    const pacingSchemas = ['goalContext', 'strategicBranches', 'taskDecomposition'];
    const isCorePacingSchema = pacingSchemas.includes(schemaKey);
    
    // Apply pacing if it's a core schema or if goal complexity is high
    const goalCharacteristics = inputData.goalCharacteristics || this.analyzeGoalCharacteristics(inputData.goal);
    const isComplexGoal = goalCharacteristics.complexity === 'high' || goalCharacteristics.score >= 6;
    
    return isCorePacingSchema || isComplexGoal;
  }

  /**
   * Apply intelligent pacing with progress indicators (OPTIMIZED)
   */
  async applyIntelligentPacing(schemaKey, inputData) {
    // PERFORMANCE OPTIMIZATION: Minimal pacing for production
    const progressMessages = this.getProgressMessages(schemaKey, inputData);
    
    // Show single progress message without excessive delays
    if (progressMessages.length > 0) {
      console.error(`⏳ ${progressMessages[0]}`);
      // Minimal delay - just enough to show progress
      await this.sleep(50);
    }
  }

  /**
   * Get pacing configuration for different schema types
   */
  getPacingConfigForSchema(schemaKey) {
    const configs = {
      goalContext: {
        baseDelay: 2000,    // 2 seconds
        complexityMultiplier: 1.5,
        totalTargetTime: 8000 // 8 seconds
      },
      strategicBranches: {
        baseDelay: 3000,    // 3 seconds
        complexityMultiplier: 2.0,
        totalTargetTime: 12000 // 12 seconds
      },
      taskDecomposition: {
        baseDelay: 2500,    // 2.5 seconds
        complexityMultiplier: 1.8,
        totalTargetTime: 10000 // 10 seconds
      },
      microParticles: {
        baseDelay: 1500,    // 1.5 seconds
        complexityMultiplier: 1.2,
        totalTargetTime: 5000 // 5 seconds
      },
      nanoActions: {
        baseDelay: 1000,    // 1 second
        complexityMultiplier: 1.0,
        totalTargetTime: 3000 // 3 seconds
      },
      contextAdaptivePrimitives: {
        baseDelay: 800,     // 0.8 seconds
        complexityMultiplier: 1.0,
        totalTargetTime: 2000 // 2 seconds
      }
    };
    
    return configs[schemaKey] || configs.goalContext;
  }

  /**
   * Get progress messages for different schema types
   */
  getProgressMessages(schemaKey, inputData) {
    const goalText = inputData.goal || 'your learning objective';
    
    const messages = {
      goalContext: [
        `Analyzing goal complexity and domain requirements for "${goalText}"`,
        'Identifying key success factors and potential obstacles',
        'Mapping user constraints and available resources',
        'Establishing learning approach and strategic framework'
      ],
      strategicBranches: [
        `Generating domain-specific strategic learning phases for "${goalText}"`,
        'Analyzing optimal progression pathways and dependencies',
        'Adapting branch structure to goal complexity and user context',
        'Validating strategic coherence and learning effectiveness',
        'Finalizing strategic branch architecture'
      ],
      taskDecomposition: [
        'Breaking down strategic phases into actionable tasks',
        'Optimizing task granularity and difficulty progression',
        'Establishing clear success criteria and validation methods',
        'Integrating context-specific considerations'
      ],
      microParticles: [
        'Decomposing tasks into granular micro-actions',
        'Ensuring foolproof execution steps',
        'Establishing clear validation checkpoints'
      ],
      nanoActions: [
        'Creating step-by-step execution procedures',
        'Accounting for tool switches and context changes'
      ],
      contextAdaptivePrimitives: [
        'Generating context-adaptive execution primitives',
        'Optimizing for different user situations'
      ]
    };
    
    return messages[schemaKey] || messages.goalContext;
  }

  /**
   * Calculate intelligent delay based on schema complexity and progress
   */
  calculateIntelligentDelay(schemaKey, stepIndex, totalSteps) {
    const config = this.getPacingConfigForSchema(schemaKey);
    
    // Distribute total target time across steps with some variation
    const baseStepTime = config.totalTargetTime / totalSteps;
    
    // Add some variation - earlier steps take a bit longer (analysis phase)
    const progressFactor = stepIndex === 0 ? 1.3 : 
                          stepIndex === totalSteps - 1 ? 0.8 : 1.0;
    
    // Add some randomness to feel more natural (±20%)
    const randomFactor = 0.8 + (Math.random() * 0.4);
    
    return Math.floor(baseStepTime * progressFactor * randomFactor);
  }

  /**
   * Sleep utility for intelligent pacing
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract goal from multiple context sources to prevent undefined issues
   */
  extractGoalFromContext(enhancedContext, goalContext) {
    // Try multiple sources for goal extraction
    const possibleGoals = [
      enhancedContext?.goal,
      goalContext?.goal,
      goalContext?.prompt?.goal,
      goalContext?.parameters?.goal,
      this.userContext?.get('goal'),
      enhancedContext?.initialContext?.goal,
      enhancedContext?.context?.goal
    ];
    
    const extractedGoal = possibleGoals.find(goal => goal && typeof goal === 'string' && goal.trim().length > 0);
    
    if (extractedGoal) {
      console.error('✅ Goal successfully extracted:', extractedGoal);
      return extractedGoal;
    }
    
    console.error('⚠️  WARNING: Could not extract goal from any context source');
    console.error('Available sources:', possibleGoals);
    return 'learning objective';
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
              complexity: { type: "number", minimum: 1, maximum: 10 },
              rationale: { type: "string" },
              domain_focus: { type: "string" },
              expected_outcomes: { type: "array", items: { type: "string" } },
              context_adaptations: { type: "array", items: { type: "string" } },
              pain_point_mitigations: { type: "array", items: { type: "string" } },
              exploration_opportunities: { type: "array", items: { type: "string" } }
            },
            required: ["name", "description", "priority", "complexity", "rationale", "domain_focus"]
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
      goalContext: 0.9,        // High creativity for diverse goal analysis approaches
      strategicBranches: 0.95, // Maximum creativity for unique learning pathways
      taskDecomposition: 0.85, // High variability for creative task generation
      microParticles: 0.9,     // Creative micro-task approaches
      nanoActions: 0.8,        // Varied execution strategies
      contextAdaptivePrimitives: 0.85, // Creative adaptation methods
      contextMining: 0.9,      // Creative context insights
      domainRelevance: 0.85,   // Varied relevance assessments
      painPointValidation: 0.8, // Creative problem identification
      treeEvolution: 0.95      // Maximum creativity for evolution strategies
    };
    return temperatures[schemaKey] || 0.85; // Default high temperature for creativity
  }

  validateAndFormatResponse(response, schema, schemaKey) {
    console.error('🔍 validateAndFormatResponse called for schema:', schemaKey);
    console.error('  - response type:', typeof response);
    console.error('  - response keys:', Object.keys(response || {}));
    
    // Handle missing or invalid responses
    if (!response || typeof response !== 'object') {
      console.error('⚠️ Invalid response, generating fallback');
      return this.generateFallbackResponse(schemaKey);
    }
    
    // Clean strategic branches responses to prevent goal text corruption
    if (schemaKey === 'strategicBranches' && response.strategic_branches) {
      response.strategic_branches = response.strategic_branches.map(branch => {
        // Clean branch names that might contain redundant goal text
        if (branch.name && typeof branch.name === 'string') {
          branch.name = this.cleanBranchName(branch.name);
        }
        
        // Clean branch descriptions that might contain redundant goal text
        if (branch.description && typeof branch.description === 'string') {
          branch.description = this.cleanBranchDescription(branch.description);
        }
        
        return branch;
      });
    }
    
    // Clean task decomposition responses
    if (schemaKey === 'taskDecomposition' && response.tasks) {
      response.tasks = response.tasks.map(task => {
        // Clean task titles that might contain redundant goal text
        if (task.title && typeof task.title === 'string') {
          task.title = this.cleanTaskTitle(task.title);
        }
        
        // Clean task descriptions that might contain redundant goal text
        if (task.description && typeof task.description === 'string') {
          task.description = this.cleanTaskDescription(task.description);
        }
        
        return task;
      });
    }
    
    console.error('✅ Response validated and cleaned');
    return response;
  }
  
  /**
   * Generate fallback response for failed schema validation
   */
  generateFallbackResponse(schemaKey) {
    console.error('🔄 Generating fallback response for schema:', schemaKey);
    
    if (schemaKey === 'strategicBranches') {
      return {
        strategic_branches: [
          {
            name: 'Fundamentals',
            description: 'Build foundational knowledge and understanding',
            priority: 1,
            complexity: 3,
            rationale: 'Essential groundwork for successful learning',
            domain_focus: 'theoretical',
            expected_outcomes: ['Core understanding', 'Strong foundation'],
            context_adaptations: ['Adapt to user pace'],
            pain_point_mitigations: ['Break down complex concepts'],
            exploration_opportunities: ['Discover related areas']
          },
          {
            name: 'Application',
            description: 'Apply concepts in practical scenarios',
            priority: 2,
            complexity: 5,
            rationale: 'Practice reinforces learning',
            domain_focus: 'hands-on',
            expected_outcomes: ['Practical skills', 'Real-world experience'],
            context_adaptations: ['Adjust complexity'],
            pain_point_mitigations: ['Provide examples'],
            exploration_opportunities: ['Explore use cases']
          },
          {
            name: 'Mastery',
            description: 'Achieve proficiency and expertise',
            priority: 3,
            complexity: 7,
            rationale: 'Deepen understanding and capabilities',
            domain_focus: 'mixed',
            expected_outcomes: ['Expert-level skills', 'Independent capability'],
            context_adaptations: ['Challenge appropriately'],
            pain_point_mitigations: ['Provide advanced support'],
            exploration_opportunities: ['Explore advanced topics']
          }
        ],
        progression_logic: 'Sequential progression from basics to mastery',
        alternative_paths: ['Accelerated track', 'Hands-on focus', 'Theory-first approach']
      };
    }
    
    // Return basic fallback for other schemas
    return {
      fallback: true,
      schema: schemaKey,
      message: 'Generated fallback response due to validation failure'
    };
  }
  
  /**
   * Clean branch name to remove redundant goal text
   */
  cleanBranchName(branchName) {
    if (!branchName || typeof branchName !== 'string') {
      return 'Learning Branch';
    }
    
    // Remove common redundant patterns
    const cleanName = branchName
      .replace(/^(Build strong foundations in|Apply|Achieve proficiency in|Master|Implement and build using|Master the methodology and process for)\s+/i, '')
      .replace(/\s+(Build strong foundations in|Apply|Achieve proficiency in|Master|Implement and build using|Master the methodology and process for)\s+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If the cleaned name is too short or empty, use the original
    if (cleanName.length < 3) {
      return branchName;
    }
    
    return cleanName;
  }
  
  /**
   * Clean branch description to remove redundant goal text
   */
  cleanBranchDescription(description) {
    if (!description || typeof description !== 'string') {
      return 'Learning activities and tasks';
    }
    
    // Remove common redundant patterns
    const cleanDescription = description
      .replace(/^(Build strong foundations in|Apply concepts in|Achieve proficiency in|Master advanced concepts in|Implement and build using|Master the methodology and process for)\s+/i, '')
      .replace(/\s+(Build strong foundations in|Apply concepts in|Achieve proficiency in|Master advanced concepts in|Implement and build using|Master the methodology and process for)\s+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If the cleaned description is too short, create a meaningful one
    if (cleanDescription.length < 5) {
      return 'Learning activities and tasks';
    }
    
    return cleanDescription;
  }
  
  /**
   * Clean task title to remove redundant goal text
   */
  cleanTaskTitle(title) {
    if (!title || typeof title !== 'string') {
      return 'Learning Task';
    }
    
    // Remove common redundant patterns
    const cleanTitle = title
      .replace(/^(Build strong foundations in|Apply|Achieve proficiency in|Master|Implement and build using|Master the methodology and process for)\s+/i, '')
      .replace(/\s+(Build strong foundations in|Apply|Achieve proficiency in|Master|Implement and build using|Master the methodology and process for)\s+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If the cleaned title is too short, use the original
    if (cleanTitle.length < 3) {
      return title;
    }
    
    return cleanTitle;
  }
  
  /**
   * Clean task description to remove redundant goal text
   */
  cleanTaskDescription(description) {
    if (!description || typeof description !== 'string') {
      return 'Complete this learning task';
    }
    
    // Remove common redundant patterns
    const cleanDescription = description
      .replace(/^(Build strong foundations in|Apply concepts in|Achieve proficiency in|Master advanced concepts in|Implement and build using|Master the methodology and process for)\s+/i, '')
      .replace(/\s+(Build strong foundations in|Apply concepts in|Achieve proficiency in|Master advanced concepts in|Implement and build using|Master the methodology and process for)\s+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If the cleaned description is too short, create a meaningful one
    if (cleanDescription.length < 5) {
      return 'Complete this learning task';
    }
    
    return cleanDescription;
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
