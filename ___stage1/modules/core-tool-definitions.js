/**
 * Core Tool Definitions for Forest Suite - Streamlined for Claude
 * Only the essential tools that Claude needs for effective learning assistance
 */

export const CORE_FOREST_TOOLS = {
  // ========== PROJECT MANAGEMENT (3 tools) ==========
  create_project_forest: {
    name: 'create_project_forest',
    description: 'Create new learning project with automatic HTA generation. REQUIRED: goal parameter.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: '**REQUIRED** Your learning goal or what you want to achieve (e.g., "learn to play guitar")'
        },
        project_id: {
          type: 'string',
          description: 'Optional: Custom project ID (auto-generated from goal if not provided)'
        },
        context: {
          type: 'string',
          description: 'Optional: Additional context about why this matters to you'
        }
      },
      required: ['goal']
    }
  },

  switch_project_forest: {
    name: 'switch_project_forest',
    description: 'Switch between existing projects. REQUIRED: project_id parameter.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: '**REQUIRED** ID of the project to switch to'
        }
      },
      required: ['project_id']
    }
  },

  list_projects_forest: {
    name: 'list_projects_forest',
    description: 'View all your projects with status and progress',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  // ========== LEARNING STRATEGY (2 tools) ==========
  build_hta_tree_forest: {
    name: 'build_hta_tree_forest',
    description: 'Build or rebuild strategic learning framework for current project',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: 'Optional goal override. Uses active project goal if not provided.'
        },
        learning_style: {
          type: 'string',
          description: 'Learning approach preference (e.g. "hands-on", "theoretical", "mixed")'
        }
      }
    }
  },

  get_hta_status_forest: {
    name: 'get_hta_status_forest',
    description: 'View learning strategy framework for active project',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  // ========== TASK MANAGEMENT (4 tools) ==========
  get_next_task_forest: {
    name: 'get_next_task_forest',
    description: 'Get the next logical learning task based on current progress',
    inputSchema: {
      type: 'object',
      properties: {
        energy_level: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Optional: Current energy level (1-5) to match task difficulty'
        },
        time_available: {
          type: 'string',
          description: 'Optional: Time available (e.g. "30 minutes", "1 hour")'
        }
      }
    }
  },

  complete_block_forest: {
    name: 'complete_block_forest',
    description: 'Complete learning task and capture insights. REQUIRED: block_id parameter.',
    inputSchema: {
      type: 'object',
      properties: {
        block_id: {
          type: 'string',
          description: '**REQUIRED** ID of the task to complete'
        },
        outcome: {
          type: 'string',
          description: 'What happened? Key insights?'
        },
        learned: {
          type: 'string',
          description: 'What specific knowledge or skills did you gain?'
        },
        difficulty_rating: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'How difficult was this task? (1=too easy, 5=too hard)'
        }
      },
      required: ['block_id', 'outcome']
    }
  },

  current_status_forest: {
    name: 'current_status_forest',
    description: 'Show current progress and next action for active project',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  generate_daily_schedule_forest: {
    name: 'generate_daily_schedule_forest',
    description: 'Generate optimized daily learning schedule based on current progress',
    inputSchema: {
      type: 'object',
      properties: {
        available_time: {
          type: 'string',
          description: 'Total time available today (e.g., "2 hours", "30 minutes")'
        },
        energy_level: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Current energy level (1=low, 5=high)'
        },
        focus_areas: {
          type: 'string',
          description: 'Optional: Specific areas to focus on today'
        }
      }
    }
  },

  // ========== STRATEGY EVOLUTION (2 tools) ==========
  evolve_strategy_forest: {
    name: 'evolve_strategy_forest',
    description: 'Evolve learning approach based on progress patterns. REQUIRED: hint parameter.',
    inputSchema: {
      type: 'object',
      properties: {
        hint: {
          type: 'string',
          description: "**REQUIRED** What's working? What's not? What needs to change?"
        }
      },
      required: ['hint']
    }
  },

  evolve_pipeline_forest: {
    name: 'evolve_pipeline_forest',
    description: 'Evolve pipeline based on progress patterns and context changes',
    inputSchema: {
      type: 'object',
      properties: {
        triggers: {
          type: 'object',
          description: 'Optional: Specific triggers for evolution (e.g., rapid_progress, difficulty_shift)'
        },
        context: {
          type: 'object',
          description: 'Optional: Context changes that should influence pipeline evolution'
        },
        feedback: {
          type: 'string',
          description: 'Optional: User feedback about current pipeline effectiveness'
        }
      }
    }
  },

  // ========== ONBOARDING & GATED FLOW (7 tools) ==========
  start_gated_onboarding_forest: {
    name: 'start_gated_onboarding_forest',
    description: 'Begin comprehensive onboarding process for new users',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: '**REQUIRED** Your learning goal'
        }
      },
      required: ['goal']
    }
  },

  start_learning_journey_forest: {
    name: 'start_learning_journey_forest',
    description: 'Begin the 6-stage gated onboarding process for comprehensive learning setup',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: '**REQUIRED** Your learning goal or dream to achieve'
        },
        user_context: {
          type: 'object',
          description: 'Optional: Initial context about experience, time, resources'
        }
      },
      required: ['goal']
    }
  },

  continue_onboarding_forest: {
    name: 'continue_onboarding_forest',
    description: 'Continue through the 6-stage gated onboarding process with quality gates',
    inputSchema: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          description: 'Current onboarding stage to progress through'
        },
        input_data: {
          type: 'object',
          description: 'Stage-specific input data and responses'
        }
      }
    }
  },

  get_onboarding_status_forest: {
    name: 'get_onboarding_status_forest',
    description: 'Check current onboarding progress and next required steps',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Optional: Specific project ID to check'
        }
      }
    }
  },

  complete_onboarding_forest: {
    name: 'complete_onboarding_forest',
    description: 'Complete the onboarding process and activate project for task execution',
    inputSchema: {
      type: 'object',
      properties: {
        final_confirmation: {
          type: 'boolean',
          description: '**REQUIRED** Confirmation that onboarding is complete'
        }
      },
      required: ['final_confirmation']
    }
  },

  get_landing_page_forest: {
    name: 'get_landing_page_forest',
    description: 'Get helpful guidance and available actions',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  get_next_pipeline_forest: {
    name: 'get_next_pipeline_forest',
    description: 'Get Next + Pipeline presentation (PRIMARY: 1 main task, SECONDARY: 2-3 coming up, TERTIARY: 1-2 alternatives)',
    inputSchema: {
      type: 'object',
      properties: {
        energy_level: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Optional: Current energy level (1-5) to match task difficulty'
        },
        time_available: {
          type: 'string',
          description: 'Optional: Time available (e.g. "30 minutes", "1 hour")'
        },
        focus_preference: {
          type: 'string',
          description: 'Optional: Specific area to focus on'
        }
      }
    }
  }
};

// Export tool list for MCP
export function getCoreToolList() {
  return Object.values(CORE_FOREST_TOOLS);
}

// Export tool names for routing
export function getCoreToolNames() {
  return Object.keys(CORE_FOREST_TOOLS);
}

// Check if tool is in core set
export function isCoretool(toolName) {
  return Object.keys(CORE_FOREST_TOOLS).includes(toolName);
}