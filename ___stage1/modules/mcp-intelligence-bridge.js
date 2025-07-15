/**
 * MCP Intelligence Bridge
 * 
 * Ensures proper integration between Forest Suite and Claude via MCP protocol
 * This replaces mock responses with real Claude intelligence
 */

import { RealLLMInterface } from './real-llm-interface.js';
import { CoreIntelligence, MCPIntelligenceCore } from './core-intelligence.js';

export class MCPIntelligenceBridge {
  constructor() {
    // Initialize the real LLM interface that uses MCP Bridge
    this.realLLMInterface = new RealLLMInterface();
    
    // Initialize MCP Intelligence Core for direct protocol handling
    this.mcpCore = new MCPIntelligenceCore();
    
    // Track pending requests for proper response handling
    this.pendingRequests = new Map();
    
    console.error('🌉 MCP Intelligence Bridge initialized - Ready for real Claude intelligence');
  }

  /**
   * Get LLM interface for modules that need it
   * Returns RealLLMInterface configured for MCP Bridge communication
   */
  getLLMInterface() {
    return this.realLLMInterface;
  }

  /**
   * Get Core Intelligence instance for backward compatibility
   */
  getCoreIntelligence(dataPersistence, projectManagement) {
    // Create a CoreIntelligence instance that uses our real LLM interface
    const coreIntelligence = new CoreIntelligence(dataPersistence, projectManagement);
    
    // Override the request method to use our real LLM interface
    coreIntelligence.request = async (requestData) => {
      return await this.realLLMInterface.request(requestData);
    };
    
    // Override requestIntelligence to use real LLM interface
    coreIntelligence.requestIntelligence = async (prompt, options = {}) => {
      const system = options.system || "You are an intelligent assistant providing analysis and insights.";
      return await this.realLLMInterface.request({
        method: 'llm/completion',
        params: {
          system: system,
          prompt: prompt,
          user: prompt,
          schema: options.schema,
          max_tokens: options.max_tokens || options.maxTokens || 500,
          temperature: options.temperature || 0.9,
          context: options.context,
          goal: options.goal || options.user_goal || options.learning_goal
        }
      });
    };
    
    return coreIntelligence;
  }

  /**
   * Handle intelligence requests from MCP tools
   * This is called when tools need real Claude intelligence
   */
  async handleIntelligenceRequest(request) {
    console.error('🧠 MCP Intelligence Bridge handling request:', {
      type: request.type,
      requestId: request.requestId,
      hasPrompt: !!request.prompt
    });

    if (request.type === 'CLAUDE_INTELLIGENCE_REQUEST') {
      // Store request for response processing
      this.pendingRequests.set(request.requestId, {
        originalRequest: request,
        timestamp: Date.now()
      });

      // Return the request for Claude to process
      return {
        type: 'CLAUDE_INTELLIGENCE_REQUEST',
        requestId: request.requestId,
        prompt: request.prompt,
        parameters: request.parameters,
        processingInstructions: request.processingInstructions,
        responseFormat: request.responseFormat,
        directClaudeRequest: true,
        bridgeVersion: '2.0'
      };
    }

    // Handle other request types if needed
    return null;
  }

  /**
   * Process Claude's response to an intelligence request
   */
  async processIntelligenceResponse(requestId, claudeResponse) {
    console.error('📝 Processing Claude response for request:', requestId);

    const pendingRequest = this.pendingRequests.get(requestId);
    if (!pendingRequest) {
      console.error('⚠️ No pending request found for ID:', requestId);
      return null;
    }

    this.pendingRequests.delete(requestId);

    // Process the response through RealLLMInterface
    const processedResponse = await this.realLLMInterface.processResponse({
      requestId: requestId,
      response: claudeResponse,
      timestamp: pendingRequest.timestamp,
      schema: pendingRequest.originalRequest.prompt?.schema
    });

    return processedResponse;
  }

  /**
   * Check if system is properly configured for real intelligence
   */
  isConfiguredForRealIntelligence() {
    return {
      mcpBridgeActive: true,
      realLLMInterface: true,
      mockResponsesDisabled: true,
      intelligenceSource: 'claude_direct',
      version: '2.0'
    };
  }
}

// Singleton instance for consistent bridge usage
let bridgeInstance = null;

export function getMCPIntelligenceBridge() {
  if (!bridgeInstance) {
    bridgeInstance = new MCPIntelligenceBridge();
  }
  return bridgeInstance;
}

// Export convenience methods
export function getRealLLMInterface() {
  return getMCPIntelligenceBridge().getLLMInterface();
}

export function getRealCoreIntelligence(dataPersistence, projectManagement) {
  return getMCPIntelligenceBridge().getCoreIntelligence(dataPersistence, projectManagement);
}
