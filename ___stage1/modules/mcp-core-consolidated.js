/**
 * Consolidated MCP Core Module
 * Clean implementation with single-purpose tools only
 */

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
} from '../local-mcp-types.js';

import {
  CORE_FOREST_TOOLS,
  getCoreToolList,
  isCoretool
} from './core-tool-definitions.js';

// Fallback to full tool set if needed for internal operations
import {
  FOREST_TOOLS,
  getToolList,
  isDeprecatedTool,
  DEPRECATED_TOOLS
} from './consolidated-tool-definitions.js';

import { DeprecatedToolRedirects } from './deprecated-tool-redirects.js';
import { logger } from './utils/logger.js';
import { ClaudeASTAnalyzer } from '../claude-ast-analyzer.js';
import { ReadOnlyFileSystem } from './read-only-filesystem.js';

// Create debugLogger interface that matches expected usage
const debugLogger = {
  logEvent: (event, data) => {
    logger.debug(`[${event}]`, data);
  }
};

export class ConsolidatedMcpCore {
  constructor(server) {
    this.server = server;
    this.toolRouter = null;
    this.astAnalyzer = new ClaudeASTAnalyzer();
    this.astAlwaysEnabled = true;
    this.fullCodebaseVisibility = true;
    
    // Initialize read-only filesystem
    this.readOnlyFS = new ReadOnlyFileSystem('/Users/bretmeraki/Downloads/7-3forest-main/___stage1', {
      allowedExtensions: ['.js', '.ts', '.json', '.md', '.txt', '.py', '.java', '.cpp', '.h', '.css', '.html'],
      blockedPaths: ['node_modules', '.git', '.env', 'package-lock.json', '.forest-data'],
      maxFileSize: 2 * 1024 * 1024 // 2MB limit
    });
  }

  async setupHandlers() {
    console.error('[ConsolidatedMCP] Setting up handlers...');

    // List tools handler - only show core tools for Claude
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = getCoreToolList();
      
      console.error(`[ConsolidatedMCP] Returning ${tools.length} core tools for Claude (AST: ${this.astAlwaysEnabled ? 'enabled' : 'disabled'})`);
      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;
      
      try {
        // Check if tool is deprecated and redirect
        if (isDeprecatedTool(name)) {
          console.error(`[ConsolidatedMCP] Deprecated tool called: ${name}`);
          return DeprecatedToolRedirects.handleDeprecatedOnboardingTool(name, args || {});
        }

        // Check if tool exists in core tools (what Claude sees) or full tools (internal)
        const coreTools = getCoreToolList();
        const isCoreTool = coreTools.some(t => t.name === name);
        const isFullTool = FOREST_TOOLS[name] || getToolList().some(t => t.name === name);

        if (!isCoreTool && !isFullTool) {
          console.error(`[ConsolidatedMCP] Unknown tool: ${name}`);
          return {
            content: [{
              type: 'text',
              text: `# Unknown Tool: ${name}

This tool doesn't exist in Forest Suite.

**Available tools:**
${this.formatAvailableTools()}

Need help? Use \`get_landing_page_forest\` to see what you can do.`
            }],
            isError: true
          };
        }

        // Handle AST analysis tool directly
        if (name === 'analyze_code_ast_forest') {
          return await this.handleASTAnalysis(args || {});
        }

        // Handle read-only filesystem tools directly
        if (name === 'read_file_forest') {
          return await this.handleReadFile(args || {});
        }
        if (name === 'list_files_forest') {
          return await this.handleListFiles(args || {});
        }
        if (name === 'search_files_forest') {
          return await this.handleSearchFiles(args || {});
        }
        if (name === 'get_file_info_forest') {
          return await this.handleGetFileInfo(args || {});
        }
        if (name === 'read_multiple_files_forest') {
          return await this.handleReadMultipleFiles(args || {});
        }
        
        // Route to handler
        const result = await this.handleToolCall(name, args || {});
        return result;
        
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[ConsolidatedMCP] Tool error for ${name}:`, err.message);
        
        return {
          content: [{
            type: 'text',
            text: `# Tool Error: ${name}

${err.message}

**Quick Help:**
- Check your parameters match the tool requirements
- Use \`get_current_config\` to check system status
- Use \`get_landing_page_forest\` for guidance`
          }],
          isError: true
        };
      }
    });

    // Required MCP handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources: [] };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return { prompts: [] };
    });

    console.error('[ConsolidatedMCP] Setup complete');
  }

  setToolRouter(toolRouter) {
    this.toolRouter = toolRouter;
  }

  async handleToolCall(toolName, args) {
    if (!this.toolRouter) {
      throw new Error('Tool router not set. Server may not be fully initialized.');
    }
    
    // Simplify arguments for create_project_forest
    if (toolName === 'create_project_forest') {
      args = this.simplifyCreateProjectArgs(args);
    }
    
    return await this.toolRouter.handleToolCall(toolName, args);
  }

  /**
   * Simplify create_project_forest arguments
   * Accept many variations but normalize to simple format
   */
  simplifyCreateProjectArgs(args) {
    // Extract goal from various possible fields
    const goal = args.goal || 
                 args.name || 
                 args.project_name || 
                 args.description || 
                 args.project_id || 
                 '';
    
    // Generate project_id if not provided
    const project_id = args.project_id || this.generateProjectId(goal);
    
    // Keep only essential fields
    return {
      goal,
      project_id,
      context: args.context || `User wants to achieve: ${goal}`,
      learning_style: args.learning_style || 'mixed'
    };
  }

  /**
   * Generate simple project ID from goal
   */
  generateProjectId(goal) {
    const words = goal.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 3);
    
    return words.join('_') || `project_${Date.now()}`;
  }

  /**
   * Format available tools for display
   */
  formatAvailableTools() {
    const categories = {
      'Getting Started': [
        '• `create_project_forest` - Create a new project',
        '• `list_projects_forest` - See all your projects',
        '• `get_landing_page_forest` - Get helpful guidance'
      ],
      'Daily Work': [
        '• `get_next_task_forest` - Get your next task',
        '• `complete_block_forest` - Mark task complete',
        '• `current_status_forest` - Check today\'s progress'
      ],
      'Project Management': [
        '• `switch_project_forest` - Switch projects',
        '• `get_hta_status_forest` - View learning strategy',
        '• `evolve_strategy_forest` - Adapt your approach'
      ]
    };

    let output = '';
    for (const [category, tools] of Object.entries(categories)) {
      output += `\n**${category}:**\n${tools.join('\n')}\n`;
    }
    return output;
  }

  /**
   * Get core tool definitions for Claude
   */
  getToolDefinitions() {
    return getCoreToolList();
  }

  /**
   * Get available tools for compliance testing
   */
  getAvailableTools() {
    const tools = [
      // Core 12 tools
      'create_project_forest',
      'switch_project_forest', 
      'list_projects_forest',
      'build_hta_tree_forest',
      'get_hta_status_forest',
      'get_next_task_forest',
      'complete_block_forest',
      'evolve_strategy_forest',
      'current_status_forest',
      'generate_daily_schedule_forest',
      'sync_forest_memory_forest',
      
      // System Management
      'factory_reset_forest',
      'get_landing_page_forest',
      'get_current_config',
      
      // Gated Onboarding & Pipeline Tools
      'start_learning_journey_forest',
      'continue_onboarding_forest',
      'get_onboarding_status_forest',
      'complete_onboarding_forest',
      'get_next_pipeline_forest',
      'evolve_pipeline_forest',
      
      // Ambiguous Desires Tools
      'assess_goal_clarity_forest',
      'start_clarification_dialogue_forest', 
      'continue_clarification_dialogue_forest',
      'analyze_goal_convergence_forest',
      'smart_evolution_forest',
      'adaptive_evolution_forest',
      'get_ambiguous_desire_status_forest',
      
      // Diagnostic Tools
      'verify_system_health_forest',
      'verify_function_exists_forest',
      'run_diagnostic_verification_forest',
      
      // Code Analysis Tools
      'analyze_code_ast_forest'
    ];
    
    return tools;
  }

  /**
   * Handle AST analysis tool call
   */
  async handleASTAnalysis(args) {
    try {
      const { file_paths, analysis_type = 'structure', focus_area } = args;
      
      // If no file paths provided but full codebase visibility is enabled, analyze all relevant files
      let pathsToAnalyze = file_paths;
      
      if (this.fullCodebaseVisibility && (!file_paths || file_paths.length === 0)) {
        // Get all JavaScript files in the project for full visibility
        const basePath = '/Users/bretmeraki/Downloads/7-3forest-main/___stage1';
        const fs = await import('fs');
        const path = await import('path');
        
        const getAllJSFiles = (dir) => {
          const files = [];
          const items = fs.readdirSync(dir, { withFileTypes: true });
          
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
              files.push(...getAllJSFiles(fullPath));
            } else if (item.isFile() && item.name.endsWith('.js')) {
              files.push(fullPath.replace(basePath + '/', ''));
            }
          }
          return files;
        };
        
        pathsToAnalyze = getAllJSFiles(basePath);
        console.error(`[AST] Full codebase visibility: analyzing ${pathsToAnalyze.length} files`);
      }
      
      if (!pathsToAnalyze || pathsToAnalyze.length === 0) {
        return {
          content: [{
            type: 'text',
            text: '**AST Analysis Error**\n\nPlease provide an array of file paths to analyze.\n\n**Example:**\n```\nanalyze_code_ast_forest({\n  "file_paths": ["modules/hta-task-generation.js"],\n  "analysis_type": "task_generation"\n})\n```'
          }],
          isError: true
        };
      }
      
      // Convert relative paths to absolute paths
      const basePath = '/Users/bretmeraki/Downloads/7-3forest-main/___stage1';
      const absolutePaths = pathsToAnalyze.map(path => {
        return path.startsWith('/') ? path : `${basePath}/${path}`;
      });
      
      // Analyze files
      const analyses = await this.astAnalyzer.analyzeMultipleFiles(absolutePaths);
      
      // Format results based on analysis type
      let formattedResult;
      switch (analysis_type) {
        case 'task_generation':
          formattedResult = this.formatTaskGenerationAnalysis(analyses, focus_area);
          break;
        case 'complexity':
          formattedResult = this.formatComplexityAnalysis(analyses);
          break;
        case 'patterns':
          formattedResult = this.formatPatternAnalysis(analyses);
          break;
        case 'summary':
          formattedResult = this.formatSummaryAnalysis(analyses);
          break;
        default:
          formattedResult = this.formatStructureAnalysis(analyses);
      }
      
      return {
        content: [{
          type: 'text',
          text: formattedResult
        }],
        analysis_data: analyses,
        analysis_type
      };
      
    } catch (error) {
      console.error('[AST Analysis Error]:', error);
      return {
        content: [{
          type: 'text',
          text: `**AST Analysis Error**\n\n${error.message}\n\nPlease check file paths and try again.`
        }],
        isError: true
      };
    }
  }
  
  /**
   * Format task generation specific analysis
   */
  formatTaskGenerationAnalysis(analyses, focusArea) {
    let result = '# 🔍 **Task Generation Analysis**\n\n';
    
    analyses.forEach(analysis => {
      if (analysis.error) {
        result += `## ❌ ${analysis.file}\n**Error**: ${analysis.error}\n\n`;
        return;
      }
      
      result += `## 📄 **${analysis.file}**\n\n`;
      
      // Find task generation related functions
      const taskGenFunctions = analysis.functions?.filter(func => 
        func.name.toLowerCase().includes('task') ||
        func.name.toLowerCase().includes('generate') ||
        func.name.toLowerCase().includes('format') ||
        func.name.toLowerCase().includes('validate')
      ) || [];
      
      if (taskGenFunctions.length > 0) {
        result += `### 🎯 **Task Generation Functions** (${taskGenFunctions.length})\n`;
        taskGenFunctions.forEach(func => {
          result += `- **${func.name}** (line ${func.line}, complexity: ${func.complexity})\n`;
          if (func.calls && func.calls.length > 0) {
            result += `  - Calls: ${func.calls.slice(0, 3).join(', ')}${func.calls.length > 3 ? '...' : ''}\n`;
          }
        });
        result += '\n';
      }
      
      // Look for patterns that might generate generic tasks
      const genericPatterns = analysis.patterns?.filter(pattern => 
        pattern.pattern.includes('generic') ||
        pattern.pattern.includes('template') ||
        pattern.pattern.includes('format')
      ) || [];
      
      if (genericPatterns.length > 0) {
        result += `### ⚠️ **Generic Pattern Alerts** (${genericPatterns.length})\n`;
        genericPatterns.forEach(pattern => {
          result += `- Line ${pattern.line}: ${pattern.pattern}\n`;
        });
        result += '\n';
      }
      
      // Show imports for understanding dependencies
      if (analysis.imports && analysis.imports.length > 0) {
        result += `### 📦 **Key Imports** (${analysis.imports.length})\n`;
        analysis.imports.slice(0, 5).forEach(imp => {
          result += `- ${imp.source}\n`;
        });
        if (analysis.imports.length > 5) {
          result += `- ...and ${analysis.imports.length - 5} more\n`;
        }
        result += '\n';
      }
      
      result += `**File Stats**: ${analysis.lineCount} lines, ${analysis.functions?.length || 0} functions, complexity ${analysis.complexity}\n\n`;
    });
    
    // Add recommendations
    result += '## 💡 **Recommendations**\n\n';
    result += '1. **Look for hardcoded templates** in task generation functions\n';
    result += '2. **Check for generic language patterns** like "learn about", "understand"\n';
    result += '3. **Find where task descriptions are formatted** for user display\n';
    result += '4. **Identify validation functions** that could catch generic tasks\n\n';
    
    if (focusArea) {
      result += `**Focus Area**: ${focusArea}\n`;
      result += 'Analysis filtered to show functions and patterns related to your focus area.\n';
    }
    
    return result;
  }
  
  /**
   * Format structure analysis
   */
  formatStructureAnalysis(analyses) {
    let result = '# 📊 **Code Structure Analysis**\n\n';
    
    analyses.forEach(analysis => {
      if (analysis.error) {
        result += `## ❌ ${analysis.file}\n**Error**: ${analysis.error}\n\n`;
        return;
      }
      
      result += `## 📄 **${analysis.file}**\n\n`;
      result += `- **Lines**: ${analysis.lineCount}\n`;
      result += `- **Functions**: ${analysis.functions?.length || 0}\n`;
      result += `- **Classes**: ${analysis.classes?.length || 0}\n`;
      result += `- **Imports**: ${analysis.imports?.length || 0}\n`;
      result += `- **Complexity**: ${analysis.complexity}\n\n`;
      
      if (analysis.functions && analysis.functions.length > 0) {
        result += `### 🔧 **Functions**\n`;
        analysis.functions.slice(0, 10).forEach(func => {
          result += `- **${func.name}** (${func.params?.length || 0} params, complexity ${func.complexity})\n`;
        });
        if (analysis.functions.length > 10) {
          result += `- ...and ${analysis.functions.length - 10} more functions\n`;
        }
        result += '\n';
      }
    });
    
    return result;
  }
  
  /**
   * Format complexity analysis
   */
  formatComplexityAnalysis(analyses) {
    let result = '# 📈 **Complexity Analysis**\n\n';
    
    const summary = this.astAnalyzer.generateSummaryReport(analyses);
    result += `**Overall Stats**:\n`;
    result += `- Files analyzed: ${summary.totalFiles}\n`;
    result += `- Total functions: ${summary.totalFunctions}\n`;
    result += `- Average complexity: ${summary.averageComplexity.toFixed(2)}\n\n`;
    
    analyses.forEach(analysis => {
      if (analysis.error) return;
      
      result += `## ${analysis.file}\n`;
      result += `**File Complexity**: ${analysis.complexity}\n\n`;
      
      if (analysis.functions) {
        const highComplexity = analysis.functions.filter(f => f.complexity > 5);
        if (highComplexity.length > 0) {
          result += `### ⚠️ **High Complexity Functions**\n`;
          highComplexity.forEach(func => {
            result += `- **${func.name}**: ${func.complexity} (${func.bodyLength} statements)\n`;
          });
          result += '\n';
        }
      }
    });
    
    return result;
  }
  
  /**
   * Format pattern analysis
   */
  formatPatternAnalysis(analyses) {
    let result = '# 🔍 **Pattern Analysis**\n\n';
    
    analyses.forEach(analysis => {
      if (analysis.error || !analysis.patterns) return;
      
      result += `## ${analysis.file}\n`;
      if (analysis.patterns.length > 0) {
        analysis.patterns.forEach(pattern => {
          result += `- **${pattern.type}**: ${pattern.pattern} (line ${pattern.line})\n`;
        });
      } else {
        result += 'No significant patterns detected.\n';
      }
      result += '\n';
    });
    
    return result;
  }
  
  /**
   * Format summary analysis
   */
  formatSummaryAnalysis(analyses) {
    let result = '# 📋 **Summary Analysis**\n\n';
    
    const summary = this.astAnalyzer.generateSummaryReport(analyses);
    result += `**Project Overview**:\n`;
    result += `- **Files**: ${summary.totalFiles}\n`;
    result += `- **Functions**: ${summary.totalFunctions}\n`;
    result += `- **Classes**: ${summary.totalClasses}\n`;
    result += `- **Average Complexity**: ${summary.averageComplexity.toFixed(2)}\n\n`;
    
    result += `**Files by Complexity**:\n`;
    analyses
      .filter(a => !a.error)
      .sort((a, b) => (b.complexity || 0) - (a.complexity || 0))
      .slice(0, 5)
      .forEach(analysis => {
        result += `- **${analysis.file}**: ${analysis.complexity} complexity\n`;
      });
    
    return result;
  }
  
  /**
   * Log deprecated tool usage for analytics
   */
  logDeprecatedToolUsage(toolName) {
    debugLogger.logEvent('DEPRECATED_TOOL_USED', {
      tool: toolName,
      timestamp: new Date().toISOString(),
      alternative: DeprecatedToolRedirects.getSimplifiedAlternative(toolName)
    });
  }

  // ========== READ-ONLY FILESYSTEM HANDLERS ==========

  /**
   * Handle read_file_forest tool call
   */
  async handleReadFile(args) {
    try {
      const { file_path } = args;
      
      if (!file_path) {
        return {
          content: [{
            type: 'text',
            text: '**Read File Error**\n\nPlease provide a file_path parameter.\n\n**Example:**\n```\nread_file_forest({"file_path": "modules/hta-core.js"})\n```'
          }],
          isError: true
        };
      }

      console.error(`[ReadOnlyFS] Reading file: ${file_path}`);
      const file = await this.readOnlyFS.readFile(file_path);
      
      return {
        content: [{
          type: 'text',
          text: `# File: ${file.path}\n\n**Size:** ${file.size} bytes | **Modified:** ${file.modified} | **Read-Only:** ${file.readonly}\n\n\`\`\`\n${file.content}\n\`\`\``
        }],
        file_data: file
      };
      
    } catch (error) {
      console.error(`[ReadOnlyFS] Read file error:`, error.message);
      return {
        content: [{
          type: 'text',
          text: `**Read File Error**\n\n${error.message}\n\n**Note:** This is a read-only filesystem access. You can only view files, not modify them.`
        }],
        isError: true
      };
    }
  }

  /**
   * Handle list_files_forest tool call
   */
  async handleListFiles(args) {
    try {
      const { directory_path = '' } = args;
      
      console.error(`[ReadOnlyFS] Listing files in: ${directory_path || 'root'}`);
      const files = await this.readOnlyFS.listFiles(directory_path);
      
      const formattedFiles = files.map(file => {
        if (file.type === 'directory') {
          return `📁 **${file.name}/** (directory)`;
        } else {
          return `📄 **${file.name}** (${file.size} bytes, modified: ${file.modified})`;
        }
      }).join('\n');
      
      return {
        content: [{
          type: 'text',
          text: `# Directory: ${directory_path || 'root'}\n\n**Read-Only Access** - You can view files but not modify them.\n\n${formattedFiles || 'No files found'}`
        }],
        files: files
      };
      
    } catch (error) {
      console.error(`[ReadOnlyFS] List files error:`, error.message);
      return {
        content: [{
          type: 'text',
          text: `**List Files Error**\n\n${error.message}`
        }],
        isError: true
      };
    }
  }

  /**
   * Handle search_files_forest tool call
   */
  async handleSearchFiles(args) {
    try {
      const { pattern, search_path = '' } = args;
      
      if (!pattern) {
        return {
          content: [{
            type: 'text',
            text: '**Search Files Error**\n\nPlease provide a search pattern.\n\n**Example:**\n```\nsearch_files_forest({"pattern": "hta", "search_path": "modules"})\n```'
          }],
          isError: true
        };
      }

      console.error(`[ReadOnlyFS] Searching for pattern: ${pattern} in ${search_path || 'root'}`);
      const results = await this.readOnlyFS.searchFiles(pattern, search_path);
      
      const formattedResults = results.map(file => 
        `📄 **${file.name}** (${file.path}) - ${file.size} bytes`
      ).join('\n');
      
      return {
        content: [{
          type: 'text',
          text: `# Search Results: "${pattern}"\n\n**Found ${results.length} files** (Read-Only Access)\n\n${formattedResults || 'No files found'}`
        }],
        results: results
      };
      
    } catch (error) {
      console.error(`[ReadOnlyFS] Search files error:`, error.message);
      return {
        content: [{
          type: 'text',
          text: `**Search Files Error**\n\n${error.message}`
        }],
        isError: true
      };
    }
  }

  /**
   * Handle get_file_info_forest tool call
   */
  async handleGetFileInfo(args) {
    try {
      const { file_path } = args;
      
      if (!file_path) {
        return {
          content: [{
            type: 'text',
            text: '**Get File Info Error**\n\nPlease provide a file_path parameter.\n\n**Example:**\n```\nget_file_info_forest({"file_path": "modules/hta-core.js"})\n```'
          }],
          isError: true
        };
      }

      console.error(`[ReadOnlyFS] Getting file info: ${file_path}`);
      const info = await this.readOnlyFS.getFileInfo(file_path);
      
      return {
        content: [{
          type: 'text',
          text: `# File Info: ${info.path}\n\n**Type:** ${info.isDirectory ? 'Directory' : 'File'}\n**Size:** ${info.size} bytes\n**Modified:** ${info.modified}\n**Created:** ${info.created}\n**Read-Only:** ${info.readonly}`
        }],
        file_info: info
      };
      
    } catch (error) {
      console.error(`[ReadOnlyFS] Get file info error:`, error.message);
      return {
        content: [{
          type: 'text',
          text: `**Get File Info Error**\n\n${error.message}`
        }],
        isError: true
      };
    }
  }

  /**
   * Handle read_multiple_files_forest tool call
   */
  async handleReadMultipleFiles(args) {
    try {
      const { file_paths } = args;
      
      if (!file_paths || !Array.isArray(file_paths) || file_paths.length === 0) {
        return {
          content: [{
            type: 'text',
            text: '**Read Multiple Files Error**\n\nPlease provide an array of file paths.\n\n**Example:**\n```\nread_multiple_files_forest({"file_paths": ["modules/hta-core.js", "modules/enhanced-hta-core.js"]})\n```'
          }],
          isError: true
        };
      }

      console.error(`[ReadOnlyFS] Reading ${file_paths.length} files`);
      const results = await this.readOnlyFS.readMultipleFiles(file_paths);
      
      const formattedResults = results.map(result => {
        if (result.error) {
          return `❌ **${result.path}**: ${result.error}`;
        } else {
          return `✅ **${result.path}** (${result.size} bytes)\n\`\`\`\n${result.content.substring(0, 500)}${result.content.length > 500 ? '...' : ''}\n\`\`\``;
        }
      }).join('\n\n');
      
      return {
        content: [{
          type: 'text',
          text: `# Multiple Files Read (Read-Only Access)\n\n**Processed ${results.length} files**\n\n${formattedResults}`
        }],
        files: results
      };
      
    } catch (error) {
      console.error(`[ReadOnlyFS] Read multiple files error:`, error.message);
      return {
        content: [{
          type: 'text',
          text: `**Read Multiple Files Error**\n\n${error.message}`
        }],
        isError: true
      };
    }
  }
}

// Export a factory function for consistency
export function createConsolidatedMcpCore(server) {
  return new ConsolidatedMcpCore(server);
}
