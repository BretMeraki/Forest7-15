/**
 * Domain-Agnostic Task Generation Helpers
 * Provides intelligent task generation that adapts to different domains and learning styles
 */

import { ForestIntelligenceAdapter } from './core-intelligence.js';

/**
 * Pure LLM-driven domain analysis - no hardcoded patterns
 */
export class DomainAnalyzer {
    constructor() {
        this.intelligenceAdapter = new ForestIntelligenceAdapter();
    }

    async analyzeDomain(goal, context = {}) {
        const system = `You are a domain analysis expert who identifies the learning characteristics of any goal without relying on predefined categories.`;
        
        const user = `Analyze this learning goal to determine its natural characteristics:

**Goal**: ${goal}
**Context**: ${JSON.stringify(context, null, 2)}

Determine the optimal learning approach by analyzing the goal's inherent nature. Don't categorize into predefined domains - instead identify the unique characteristics that would determine the best learning strategy.`;

        const schema = {
            type: "object",
            properties: {
                goal_analysis: {
                    type: "object",
                    properties: {
                        learning_style: { 
                            type: "string",
                            description: "Optimal learning approach (e.g., hands-on, theoretical, experiential, structured, etc.)"
                        },
                        progression_type: { 
                            type: "string",
                            description: "How learning should progress (e.g., incremental, exploratory, cumulative, etc.)"
                        },
                        knowledge_type: {
                            type: "string", 
                            description: "Type of knowledge being acquired (e.g., procedural, declarative, experiential, etc.)"
                        },
                        complexity_indicators: {
                            type: "array",
                            items: { type: "string" },
                            description: "Factors that indicate this goal's complexity"
                        }
                    }
                },
                optimal_phases: {
                    type: "array",
                    items: { type: "string" },
                    description: "Natural learning phases for this specific goal"
                },
                learning_characteristics: {
                    type: "object",
                    properties: {
                        requires_practice: { type: "boolean" },
                        requires_theory: { type: "boolean" },
                        requires_feedback: { type: "boolean" },
                        requires_tools: { type: "boolean" },
                        requires_community: { type: "boolean" }
                    }
                },
                confidence_level: { 
                    type: "number", 
                    minimum: 0.0, 
                    maximum: 1.0,
                    description: "Confidence in this analysis"
                }
            },
            required: ["goal_analysis", "optimal_phases", "learning_characteristics", "confidence_level"]
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

    async getComplexityIndicators(goal, context = {}) {
        const system = `You are a learning complexity analyst who evaluates the inherent difficulty and scope of any learning goal.`;
        
        const user = `Analyze the complexity of this learning goal:

**Goal**: ${goal}
**Context**: ${JSON.stringify(context, null, 2)}

Evaluate the natural complexity without relying on keyword matching or domain assumptions. Consider the goal's scope, depth requirements, prerequisite knowledge needs, and time investment required.`;

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
                        complexity_level: { 
                            type: "string",
                            enum: ["beginner", "intermediate", "advanced", "expert"],
                            description: "Complexity category"
                        },
                        complexity_factors: {
                            type: "array",
                            items: { type: "string" },
                            description: "Specific factors contributing to complexity"
                        },
                        prerequisite_requirements: {
                            type: "array",
                            items: { type: "string" },
                            description: "Knowledge/skills needed before starting"
                        }
                    }
                },
                time_estimation: {
                    type: "object",
                    properties: {
                        estimated_duration: { 
                            type: "string",
                            description: "Realistic time estimate for achieving the goal"
                        },
                        milestone_timeline: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    milestone: { type: "string" },
                                    estimated_time: { type: "string" }
                                }
                            }
                        },
                        confidence_level: { 
                            type: "string",
                            enum: ["low", "moderate", "high"],
                            description: "Confidence in time estimation"
                        }
                    }
                },
                learning_demands: {
                    type: "object",
                    properties: {
                        cognitive_load: { type: "string", enum: ["low", "moderate", "high"] },
                        practice_intensity: { type: "string", enum: ["light", "moderate", "intensive"] },
                        resource_requirements: { type: "array", items: { type: "string" } }
                    }
                }
            },
            required: ["complexity_analysis", "time_estimation", "learning_demands"]
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
}

/**
 * Intelligent task generation that adapts to any goal using pure LLM analysis
 */
export class DomainAgnosticTaskGenerator {
    constructor() {
        this.intelligenceAdapter = new ForestIntelligenceAdapter();
        this.domainAnalyzer = new DomainAnalyzer();
    }

    async generateAdaptiveTasks(goal, context = {}, options = {}) {
        // Use LLM-driven analysis instead of hardcoded patterns
        const domainAnalysis = await this.domainAnalyzer.analyzeDomain(goal, context);
        const complexityAnalysis = await this.domainAnalyzer.getComplexityIndicators(goal, context);
        
        // Generate completely adaptive learning strategy based on LLM analysis
        const strategyRequest = await this.intelligenceAdapter.requestStrategicBranches(
            goal,
            complexityAnalysis,
            options.focusAreas || [],
            options.learningStyle || domainAnalysis.goal_analysis?.learning_style || 'adaptive',
            { 
                ...context, 
                learningCharacteristics: domainAnalysis.learning_characteristics,
                progressionType: domainAnalysis.goal_analysis?.progression_type,
                knowledgeType: domainAnalysis.goal_analysis?.knowledge_type,
                optimalPhases: domainAnalysis.optimal_phases
            }
        );

        return {
            domainAnalysis,
            complexityAnalysis,
            strategyRequest,
            metadata: {
                generatedAt: new Date().toISOString(),
                adaptationLevel: domainAnalysis.confidence_level,
                estimatedDuration: complexityAnalysis.time_estimation?.estimated_duration,
                analysisMethod: 'llm_driven'
            }
        };
    }

    async generateTaskSequence(strategicBranch, context = {}, options = {}) {
        const system = `You are an expert task sequencer who creates optimal learning progressions within specific phases.
        
Domain Context: ${context.domainType || 'general'}
Progression Type: ${context.progressionType || 'incremental'}
Learning Style: ${options.learningStyle || 'mixed'}`;
        
        const user = `Generate a detailed task sequence for this learning phase:

**Phase**: ${strategicBranch.name}
**Description**: ${strategicBranch.description}
**Key Activities**: ${strategicBranch.key_activities?.join(', ') || 'Not specified'}
**Learning Focus**: ${strategicBranch.learning_focus || 'general'}
**Duration**: ${strategicBranch.duration_estimate || 'flexible'}

**Requirements**:
1. Create 5-10 specific, actionable tasks for this phase
2. Ensure tasks build logically on each other
3. Include both learning and practice activities
4. Specify realistic time estimates for each task
5. Include success criteria and checkpoints
6. Adapt to the domain's typical learning patterns

**Critical Guidelines**:
- Tasks should be specific and actionable, not vague
- Include practical application opportunities
- Consider the learner's progression level
- Ensure each task contributes meaningfully to the phase goal`;

        const schema = {
            type: "object",
            properties: {
                phase_summary: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        goal: { type: "string" },
                        approach: { type: "string" }
                    }
                },
                task_sequence: {
                    type: "array",
                    minItems: 5,
                    maxItems: 10,
                    items: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            title: { type: "string" },
                            description: { type: "string" },
                            type: { 
                                type: "string", 
                                enum: ["learning", "practice", "project", "assessment", "reflection", "research"] 
                            },
                            estimated_time: { type: "string" },
                            difficulty: { type: "integer", minimum: 1, maximum: 5 },
                            prerequisites: { type: "array", items: { type: "string" } },
                            success_criteria: { type: "array", items: { type: "string" } },
                            resources_needed: { type: "array", items: { type: "string" } },
                            deliverable: { type: "string" }
                        },
                        required: ["id", "title", "description", "type", "estimated_time", "success_criteria"]
                    }
                },
                phase_checkpoints: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            checkpoint: { type: "string" },
                            criteria: { type: "string" },
                            timing: { type: "string" }
                        }
                    }
                }
            },
            required: ["phase_summary", "task_sequence", "phase_checkpoints"]
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

        return request;
    }

    async generateContextualHints(task, learnerProgress = {}, context = {}) {
        const system = "You are a personalized learning coach who provides contextual hints and guidance.";
        const user = `Provide personalized hints and guidance for this task:

**Task**: ${task.title}
**Description**: ${task.description}
**Type**: ${task.type}
**Difficulty**: ${task.difficulty}/5

**Learner Context**:
- Progress: ${JSON.stringify(learnerProgress, null, 2)}
- Domain: ${context.domainType || 'general'}
- Learning Style: ${context.learningStyle || 'mixed'}

**Provide**:
1. Specific getting-started tips
2. Common pitfalls to avoid
3. Success indicators to watch for
4. Adaptive hints based on learner's style and progress
5. Motivation and encouragement specific to this task`;

        const schema = {
            type: "object",
            properties: {
                getting_started: { type: "array", items: { type: "string" } },
                pitfalls_to_avoid: { type: "array", items: { type: "string" } },
                success_indicators: { type: "array", items: { type: "string" } },
                adaptive_hints: {
                    type: "object",
                    properties: {
                        for_struggling: { type: "array", items: { type: "string" } },
                        for_advanced: { type: "array", items: { type: "string" } },
                        for_learning_style: { type: "array", items: { type: "string" } }
                    }
                },
                motivation: { type: "string" }
            },
            required: ["getting_started", "success_indicators", "motivation"]
        };

        const request = await this.intelligenceAdapter.core.request({
            method: 'llm/completion',
            params: {
                system,
                user,
                schema,
                max_tokens: 1500,
                temperature: 0.6
            }
        });

        return request;
    }

    async adaptTaskDifficulty(task, learnerPerformance, context = {}) {
        const system = "You are a learning adaptation specialist who adjusts task difficulty based on learner performance.";
        const user = `Adapt this task based on learner performance:

**Original Task**: ${task.title}
**Description**: ${task.description}
**Current Difficulty**: ${task.difficulty}/5

**Learner Performance**:
${JSON.stringify(learnerPerformance, null, 2)}

**Adaptation Requirements**:
1. If learner is struggling: simplify the task or break it into smaller steps
2. If learner is excelling: add complexity or advanced challenges
3. Maintain the core learning objective
4. Ensure the adapted task is still meaningful and engaging
5. Provide rationale for the adaptation`;

        const schema = {
            type: "object",
            properties: {
                adaptation_type: { 
                    type: "string", 
                    enum: ["simplify", "maintain", "enhance", "restructure"] 
                },
                adapted_task: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        difficulty: { type: "integer", minimum: 1, maximum: 5 },
                        estimated_time: { type: "string" },
                        success_criteria: { type: "array", items: { type: "string" } },
                        additional_resources: { type: "array", items: { type: "string" } }
                    }
                },
                rationale: { type: "string" },
                coaching_notes: { type: "array", items: { type: "string" } }
            },
            required: ["adaptation_type", "adapted_task", "rationale"]
        };

        const request = await this.intelligenceAdapter.core.request({
            method: 'llm/completion',
            params: {
                system,
                user,
                schema,
                max_tokens: 2000,
                temperature: 0.5
            }
        });

        return request;
    }
}

/**
 * Progress tracking and adaptive pacing
 */
export class AdaptivePacingManager {
    constructor() {
        this.intelligenceAdapter = new ForestIntelligenceAdapter();
    }

    async analyzeProgressAndAdapt(completedTasks, currentTask, overallGoal, context = {}) {
        const system = "You are a learning pace analyst who optimizes learning progression based on performance data.";
        const user = `Analyze learning progress and recommend pacing adjustments:

**Overall Goal**: ${overallGoal}
**Current Task**: ${currentTask.title}

**Completed Tasks Summary**:
${completedTasks.map(task => 
    `- ${task.title} (${task.completion_time || 'unknown time'}, quality: ${task.quality_score || 'not rated'}/5)`
).join('\n')}

**Context**: ${JSON.stringify(context, null, 2)}

**Analysis Requirements**:
1. Identify learning velocity and patterns
2. Assess comprehension vs speed balance
3. Recommend pacing adjustments (faster/slower/maintain)
4. Suggest focus areas for improvement
5. Predict optimal timeline for goal completion
6. Identify any concerning patterns or blockers`;

        const schema = {
            type: "object",
            properties: {
                progress_analysis: {
                    type: "object",
                    properties: {
                        learning_velocity: { type: "string", enum: ["slow", "moderate", "fast", "variable"] },
                        comprehension_quality: { type: "number", minimum: 1, maximum: 5 },
                        consistency: { type: "string", enum: ["low", "moderate", "high"] },
                        engagement_level: { type: "string", enum: ["low", "moderate", "high"] }
                    }
                },
                pacing_recommendation: {
                    type: "object",
                    properties: {
                        adjustment: { type: "string", enum: ["accelerate", "maintain", "decelerate", "restructure"] },
                        rationale: { type: "string" },
                        specific_changes: { type: "array", items: { type: "string" } }
                    }
                },
                focus_areas: { type: "array", items: { type: "string" } },
                timeline_prediction: {
                    type: "object",
                    properties: {
                        estimated_completion: { type: "string" },
                        confidence_level: { type: "string", enum: ["low", "moderate", "high"] },
                        key_milestones: { type: "array", items: { type: "string" } }
                    }
                },
                intervention_recommendations: { type: "array", items: { type: "string" } }
            },
            required: ["progress_analysis", "pacing_recommendation", "timeline_prediction"]
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

        return request;
    }
}

/**
 * Utility functions for domain-agnostic task management
 */
export class TaskGenerationUtils {
    static generateTaskId(title, phase = '') {
        const timestamp = Date.now().toString(36);
        const titleSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20);
        const phaseSlug = phase ? phase.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 10) + '-' : '';
        return `${phaseSlug}${titleSlug}-${timestamp}`;
    }

    static estimateTaskTime(description, complexity, learningCharacteristics = {}) {
        const baseMinutes = {
            1: 30, 2: 60, 3: 120, 4: 240, 5: 480
        };
        
        // Use learning characteristics instead of hardcoded domain multipliers
        let multiplier = 1.0;
        
        if (learningCharacteristics.requires_practice) multiplier += 0.3;
        if (learningCharacteristics.requires_theory) multiplier += 0.2;
        if (learningCharacteristics.requires_tools) multiplier += 0.2;
        if (learningCharacteristics.requires_feedback) multiplier += 0.1;
        
        const base = baseMinutes[complexity] || 120;
        const totalMinutes = Math.round(base * multiplier);
        
        if (totalMinutes < 60) return `${totalMinutes} minutes`;
        if (totalMinutes < 480) return `${Math.round(totalMinutes / 60)} hours`;
        return `${Math.round(totalMinutes / 480)} days`;
    }

    static validateTaskSequence(tasks) {
        const validation = {
            isValid: true,
            issues: [],
            suggestions: []
        };

        // Check for logical progression
        if (tasks.length < 3) {
            validation.issues.push('Task sequence too short for meaningful learning progression');
            validation.isValid = false;
        }

        // Check difficulty progression
        const difficulties = tasks.map(t => t.difficulty || 1);
        const hasProgression = difficulties.some((diff, i) => i > 0 && diff > difficulties[i-1]);
        if (!hasProgression) {
            validation.suggestions.push('Consider including some tasks with increasing difficulty');
        }

        // Check for task type variety
        const types = [...new Set(tasks.map(t => t.type))];
        if (types.length < 2) {
            validation.suggestions.push('Include variety in task types (learning, practice, project, etc.)');
        }

        return validation;
    }
}

export default {
    DomainAnalyzer,
    DomainAgnosticTaskGenerator,
    AdaptivePacingManager,
    TaskGenerationUtils
};
