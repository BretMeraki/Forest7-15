/**
 * HTA Complexity Analyzer - Uses LLM-driven analysis instead of hardcoded patterns
 * Split from hta-core.js for better modularity
 */

import { ForestIntelligenceAdapter } from './core-intelligence.js';

class HTAComplexityAnalyzer {
  constructor() {
    this.intelligenceAdapter = new ForestIntelligenceAdapter();
    // Removed hardcoded complexity indicators - now using pure LLM analysis
  }

  async analyzeGoalComplexity(goal, focusAreas = [], constraints = {}) {
    const system = `You are a goal complexity analyst who evaluates learning objectives without relying on domain-specific keywords or patterns.`;
    
    const user = `Analyze the complexity of this learning goal:

**Goal**: ${goal}
**Focus Areas**: ${focusAreas.join(', ') || 'None specified'}
**Constraints**: ${JSON.stringify(constraints, null, 2)}

Evaluate the inherent complexity considering:
1. Scope and breadth of knowledge required
2. Depth of mastery needed
3. Prerequisites and learning curve
4. Time investment and practice requirements
5. Coordination of multiple skills/concepts

Provide a complexity score from 1-10 with detailed reasoning.`;

    const schema = {
      type: "object",
      properties: {
        complexity_analysis: {
          type: "object",
          properties: {
            complexity_score: { 
              type: "integer", 
              minimum: 1, 
              maximum: 10,
              description: "Overall complexity rating"
            },
            complexity_factors: {
              type: "array",
              items: { type: "string" },
              description: "Factors contributing to complexity"
            },
            simplifying_factors: {
              type: "array",
              items: { type: "string" },
              description: "Factors that reduce complexity"
            },
            reasoning: {
              type: "array",
              items: { type: "string" },
              description: "Step-by-step reasoning for the score"
            }
          }
        },
        tree_structure_recommendations: {
          type: "object",
          properties: {
            recommended_depth: { 
              type: "integer", 
              minimum: 2, 
              maximum: 6,
              description: "Recommended tree depth levels"
            },
            branching_factor: { 
              type: "integer", 
              minimum: 2, 
              maximum: 8,
              description: "Recommended number of branches per level"
            },
            decomposition_strategy: {
              type: "string",
              description: "Optimal approach for breaking down this goal"
            }
          }
        },
        learning_characteristics: {
          type: "object",
          properties: {
            requires_sequential_learning: { type: "boolean" },
            allows_parallel_learning: { type: "boolean" },
            benefits_from_practice: { type: "boolean" },
            needs_external_feedback: { type: "boolean" },
            requires_specialized_resources: { type: "boolean" }
          }
        }
      },
      required: ["complexity_analysis", "tree_structure_recommendations", "learning_characteristics"]
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
      analyzedAt: new Date().toISOString()
    };
  }

  async calculateTreeStructure(complexityAnalysis, focusAreas = []) {
    const system = `You are a learning structure architect who designs optimal hierarchical breakdowns for any learning goal.`;
    
    const user = `Design the optimal tree structure for this goal based on its complexity analysis:

**Complexity Analysis**: ${JSON.stringify(complexityAnalysis, null, 2)}
**Focus Areas**: ${focusAreas.join(', ') || 'None specified'}

Determine the best hierarchical structure considering:
1. Number of main branches/phases needed
2. Depth of decomposition required
3. Tasks per branch for effective learning
4. Optimal granularity levels

Design a structure that matches the goal's natural learning progression.`;

    const schema = {
      type: "object",
      properties: {
        tree_structure: {
          type: "object",
          properties: {
            total_branches: { 
              type: "integer", 
              minimum: 3, 
              maximum: 8,
              description: "Number of main learning branches"
            },
            tasks_per_branch: {
              type: "object",
              properties: {
                min: { type: "integer", minimum: 2, maximum: 5 },
                max: { type: "integer", minimum: 6, maximum: 15 }
              }
            },
            granularity_levels: { 
              type: "integer", 
              minimum: 2, 
              maximum: 4,
              description: "Depth of task decomposition"
            },
            recommended_focus: {
              type: "array",
              items: { type: "string" },
              description: "Suggested areas of emphasis"
            }
          }
        },
        learning_progression: {
          type: "object",
          properties: {
            sequential_required: { type: "boolean" },
            parallel_possible: { type: "boolean" },
            iterative_approach: { type: "boolean" },
            milestone_frequency: { type: "string" }
          }
        },
        estimated_timeline: {
          type: "object",
          properties: {
            total_duration: { type: "string" },
            branch_duration_range: { type: "string" },
            confidence_level: { type: "string", enum: ["low", "moderate", "high"] }
          }
        }
      },
      required: ["tree_structure", "learning_progression", "estimated_timeline"]
    };

    const request = await this.intelligenceAdapter.core.request({
      method: 'llm/completion',
      params: {
        system,
        user,
        schema,
        max_tokens: 1500,
        temperature: 0.3
      }
    });

    return {
      analysisType: 'llm_driven',
      ...request,
      analyzedAt: new Date().toISOString()
    };
  }

  async generateStrategicBranches(goal, focusAreas = [], complexityAnalysis = {}) {
    const system = `You are a learning pathway designer who creates adaptive strategic branches for any learning goal without using predefined templates.`;
    
    const user = `Generate strategic learning branches for this goal:

**Goal**: ${goal}
**Focus Areas**: ${focusAreas.join(', ') || 'None specified'}
**Complexity Analysis**: ${JSON.stringify(complexityAnalysis, null, 2)}

Create 4-7 strategic learning branches that represent the natural progression needed to achieve this goal. Each branch should be:
1. Specifically tailored to this goal (not generic)
2. Logically sequenced or organized
3. Focused on a distinct aspect of the learning journey
4. Actionable and measurable

Avoid generic phase names like "Foundation" or "Research" - use terminology that reflects the actual goal content.`;

    const schema = {
      type: "object",
      properties: {
        strategic_branches: {
          type: "array",
          minItems: 4,
          maxItems: 7,
          items: {
            type: "object",
            properties: {
              name: { 
                type: "string",
                description: "Goal-specific branch name (avoid generic terms)" 
              },
              description: { 
                type: "string",
                description: "What this branch accomplishes" 
              },
              priority: { 
                type: "integer", 
                minimum: 1, 
                maximum: 7,
                description: "Learning sequence priority" 
              },
              key_outcomes: {
                type: "array",
                items: { type: "string" },
                description: "Specific achievements from this branch"
              },
              prerequisites: {
                type: "array",
                items: { type: "string" },
                description: "What's needed before starting this branch"
              },
              success_criteria: {
                type: "array",
                items: { type: "string" },
                description: "How to know this branch is complete"
              },
              estimated_duration: { type: "string" }
            },
            required: ["name", "description", "priority", "key_outcomes"]
          }
        },
        progression_rationale: {
          type: "string",
          description: "Why this particular sequence and structure"
        },
        adaptation_notes: {
          type: "array",
          items: { type: "string" },
          description: "How branches might be modified based on learner progress"
        }
      },
      required: ["strategic_branches", "progression_rationale"]
    };

    const request = await this.intelligenceAdapter.core.request({
      method: 'llm/completion',
      params: {
        system,
        user,
        schema,
        max_tokens: 2500,
        temperature: 0.4
      }
    });

    return {
      analysisType: 'llm_driven',
      ...request,
      analyzedAt: new Date().toISOString()
    };
  }
}

export { HTAComplexityAnalyzer };
