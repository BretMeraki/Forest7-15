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
  },

  // ========== MISSING TOOLS FOR COMPLIANCE ==========
  sync_forest_memory_forest: {
    name: 'sync_forest_memory_forest',
    description: 'Synchronize Forest memory and learning patterns',
    inputSchema: {
      type: 'object',
      properties: {
        sync_type: {
          type: 'string',
          description: 'Type of sync to perform (full, incremental, patterns)'
        }
      }
    }
  },


  factory_reset_forest: {
    name: 'factory_reset_forest',
    description: 'Reset Forest system to factory defaults (WARNING: Destructive operation)',
    inputSchema: {
      type: 'object',
      properties: {
        confirmation: {
          type: 'string',
          description: '**REQUIRED** Type "RESET_CONFIRMED" to proceed'
        },
        backup_first: {
          type: 'boolean',
          description: 'Whether to create backup before reset'
        }
      },
      required: ['confirmation']
    }
  },

  // ========== AMBIGUOUS DESIRES TOOLS ==========
  assess_goal_clarity_forest: {
    name: 'assess_goal_clarity_forest',
    description: 'Assess how clear and actionable your goal is',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: '**REQUIRED** The goal to assess for clarity'
        }
      },
      required: ['goal']
    }
  },

  start_clarification_dialogue_forest: {
    name: 'start_clarification_dialogue_forest',
    description: 'Begin interactive dialogue to clarify ambiguous goals',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: '**REQUIRED** The ambiguous goal to clarify'
        }
      },
      required: ['goal']
    }
  },

  continue_clarification_dialogue_forest: {
    name: 'continue_clarification_dialogue_forest',
    description: 'Continue clarification dialogue with responses',
    inputSchema: {
      type: 'object',
      properties: {
        dialogue_id: {
          type: 'string',
          description: '**REQUIRED** ID of the active dialogue'
        },
        response: {
          type: 'string',
          description: '**REQUIRED** Your response to the clarification questions'
        }
      },
      required: ['dialogue_id', 'response']
    }
  },

  analyze_goal_convergence_forest: {
    name: 'analyze_goal_convergence_forest',
    description: 'Analyze how well clarified goals converge to actionable outcomes',
    inputSchema: {
      type: 'object',
      properties: {
        dialogue_id: {
          type: 'string',
          description: '**REQUIRED** ID of the dialogue to analyze'
        }
      },
      required: ['dialogue_id']
    }
  },

  smart_evolution_forest: {
    name: 'smart_evolution_forest',
    description: 'Intelligently evolve learning approach based on patterns',
    inputSchema: {
      type: 'object',
      properties: {
        evolution_trigger: {
          type: 'string',
          description: 'What triggered the need for evolution?'
        },
        context: {
          type: 'object',
          description: 'Current learning context and patterns'
        }
      }
    }
  },

  adaptive_evolution_forest: {
    name: 'adaptive_evolution_forest',
    description: 'Adaptively evolve strategy based on real-time feedback',
    inputSchema: {
      type: 'object',
      properties: {
        feedback: {
          type: 'string',
          description: '**REQUIRED** Feedback about current approach effectiveness'
        },
        adaptation_type: {
          type: 'string',
          description: 'Type of adaptation needed (difficulty, pace, style)'
        }
      },
      required: ['feedback']
    }
  },

  get_ambiguous_desire_status_forest: {
    name: 'get_ambiguous_desire_status_forest',
    description: 'Get status of ambiguous desire clarification processes',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Optional: Specific project to check'
        }
      }
    }
  },

  // ========== CODE ANALYSIS TOOLS ==========
  analyze_code_ast_forest: {
    name: 'analyze_code_ast_forest',
    description: 'Provide detailed AST analysis of Forest code for Claude to understand structure and identify improvement opportunities. Always enabled for full codebase visibility.',
    inputSchema: {
      type: 'object',
      properties: {
        file_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file paths to analyze (relative to Forest root directory). If omitted, analyzes entire codebase when full visibility is enabled.'
        },
        analysis_type: {
          type: 'string',
          enum: ['structure', 'complexity', 'patterns', 'task_generation', 'summary'],
          default: 'structure',
          description: 'Type of analysis to perform'
        },
        focus_area: {
          type: 'string',
          description: 'Optional: Specific area to focus analysis on (e.g., "task generation", "generic patterns")'
        }
      },
      required: []
    }
  },

  // ========== READ-ONLY FILESYSTEM TOOLS ==========
  read_file_forest: {
    name: 'read_file_forest',
    description: 'Read file contents safely with read-only access. Claude can view code but cannot modify it.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the file to read (relative to project root)'
        }
      },
      required: ['file_path']
    }
  },

  list_files_forest: {
    name: 'list_files_forest',
    description: 'List files and directories with read-only access. Shows file structure without write permissions.',
    inputSchema: {
      type: 'object',
      properties: {
        directory_path: {
          type: 'string',
          description: 'Directory path to list (relative to project root). Leave empty for root directory.',
          default: ''
        }
      },
      required: []
    }
  },

  search_files_forest: {
    name: 'search_files_forest',
    description: 'Search for files matching a pattern with read-only access.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Search pattern to match against filenames'
        },
        search_path: {
          type: 'string',
          description: 'Directory to search within (relative to project root)',
          default: ''
        }
      },
      required: ['pattern']
    }
  },

  get_file_info_forest: {
    name: 'get_file_info_forest',
    description: 'Get file metadata and information without reading content.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the file to get info for (relative to project root)'
        }
      },
      required: ['file_path']
    }
  },

  read_multiple_files_forest: {
    name: 'read_multiple_files_forest',
    description: 'Read multiple files efficiently with read-only access.',
    inputSchema: {
      type: 'object',
      properties: {
        file_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file paths to read (relative to project root, max 50 files)'
        }
      },
      required: ['file_paths']
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