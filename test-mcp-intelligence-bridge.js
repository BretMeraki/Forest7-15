/**
 * Comprehensive MCP Intelligence Bridge Test
 * Tests the complete flow of intelligence requests through the MCP bridge
 */

import { MCPIntelligenceCore, ForestIntelligenceAdapter, CoreIntelligence } from './___stage1/modules/core-intelligence.js';
import { Stage1CoreServer } from './___stage1/core-server.js';

class MCPIntelligenceBridgeTest {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      const result = await testFunction();
      console.log(`   ✅ PASSED: ${testName}`);
      this.testResults.push({ test: testName, status: 'PASSED', result });
      this.passedTests++;
      return result;
    } catch (error) {
      console.log(`   ❌ FAILED: ${testName}`);
      console.log(`   Error: ${error.message}`);
      this.testResults.push({ test: testName, status: 'FAILED', error: error.message });
      this.failedTests++;
      throw error;
    }
  }

  async runAllTests() {
    console.log('🎯 Testing MCP Intelligence Bridge Functionality\n');
    
    try {
      // Test 1: Basic MCP Intelligence Core initialization
      await this.runTest('MCPIntelligenceCore Basic Initialization', async () => {
        const core = new MCPIntelligenceCore();
        if (!core.pendingRequests) throw new Error('pendingRequests not initialized');
        return { initialized: true, type: 'MCPIntelligenceCore' };
      });

      // Test 2: Forest Intelligence Adapter initialization
      await this.runTest('ForestIntelligenceAdapter Initialization', async () => {
        const adapter = new ForestIntelligenceAdapter();
        if (!adapter.core) throw new Error('Core not initialized');
        if (!(adapter.core instanceof MCPIntelligenceCore)) throw new Error('Core not correct type');
        return { initialized: true, type: 'ForestIntelligenceAdapter' };
      });

      // Test 3: Request delegation flow
      await this.runTest('Intelligence Request Delegation', async () => {
        const core = new MCPIntelligenceCore();
        const params = {
          system: "You are a test assistant",
          user: "Create a simple test task",
          schema: {
            type: "object",
            required: ['title', 'description'],
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              difficulty: { type: 'number' }
            }
          },
          max_tokens: 300,
          temperature: 0.7
        };

        const response = await core.delegateToClaudeIntelligence(params);
        
        if (response.type !== 'CLAUDE_INTELLIGENCE_REQUEST') {
          throw new Error('Wrong response type');
        }
        if (!response.requestId) {
          throw new Error('No request ID generated');
        }
        if (!response.prompt) {
          throw new Error('No prompt generated');
        }
        if (response.responseFormat !== 'structured_json') {
          throw new Error('Wrong response format');
        }

        return { 
          requestId: response.requestId, 
          hasSchema: !!response.prompt.schema,
          format: response.responseFormat,
          processingInstructions: response.processingInstructions.split('\n').length
        };
      });

      // Test 4: Schema validation
      await this.runTest('Schema Validation', async () => {
        const core = new MCPIntelligenceCore();
        const validData = { title: "Test Task", description: "A test task", difficulty: 3 };
        const invalidData = { title: "Test Task" }; // missing required description
        
        const schema = {
          required: ['title', 'description']
        };

        const validResult = core.validateAgainstSchema(validData, schema);
        const invalidResult = core.validateAgainstSchema(invalidData, schema);

        if (!validResult) throw new Error('Valid data failed validation');
        if (invalidResult) throw new Error('Invalid data passed validation');

        return { validPassed: validResult, invalidFailed: !invalidResult };
      });

      // Test 5: Forest Intelligence Adapter specific methods
      await this.runTest('Forest Intelligence Adapter Methods', async () => {
        const adapter = new ForestIntelligenceAdapter();
        
        // Test task generation request
        const taskRequest = await adapter.requestTaskGeneration(
          "Learning JavaScript fundamentals",
          "Become proficient in JavaScript programming"
        );
        
        if (taskRequest.type !== 'CLAUDE_INTELLIGENCE_REQUEST') {
          throw new Error('Wrong request type for task generation');
        }

        // Test strategic branches request
        const branchRequest = await adapter.requestStrategicBranches(
          "Learn React development",
          { score: 7, level: "intermediate" },
          ["Frontend", "JavaScript", "React"],
          "visual",
          { context: "Career development" }
        );
        
        if (branchRequest.type !== 'CLAUDE_INTELLIGENCE_REQUEST') {
          throw new Error('Wrong request type for strategic branches');
        }

        return { 
          taskRequestId: taskRequest.requestId,
          branchRequestId: branchRequest.requestId,
          taskHasSchema: !!taskRequest.prompt.schema,
          branchHasSchema: !!branchRequest.prompt.schema
        };
      });

      // Test 6: Legacy compatibility
      await this.runTest('Legacy CoreIntelligence Compatibility', async () => {
        const legacyCore = new CoreIntelligence(null, null);
        
        // Test legacy methods
        const reasoning = await legacyCore.analyzeReasoning();
        if (!reasoning.content || !Array.isArray(reasoning.content)) {
          throw new Error('Legacy reasoning analysis failed');
        }

        const deductions = await legacyCore.generateLogicalDeductions('test input');
        if (!Array.isArray(deductions)) {
          throw new Error('Legacy deductions generation failed');
        }

        return { 
          reasoningContent: reasoning.content.length,
          deductionsArray: Array.isArray(deductions),
          mcpCore: legacyCore.mcpCore instanceof MCPIntelligenceCore
        };
      });

      // Test 7: Static methods
      await this.runTest('Static Method Functionality', async () => {
        const request = MCPIntelligenceCore.createIntelligenceRequest(
          "System prompt",
          "User prompt",
          { schema: { type: "object" }, maxTokens: 600, temperature: 0.8 }
        );

        if (request.method !== 'llm/completion') {
          throw new Error('Wrong request method');
        }
        if (!request.params.system || !request.params.user) {
          throw new Error('Missing system/user params');
        }

        const processRequest = MCPIntelligenceCore.processIntelligenceResponse(
          'test-req-id',
          'test response content'
        );

        if (processRequest.method !== 'llm/process_response') {
          throw new Error('Wrong process method');
        }

        return {
          requestMethod: request.method,
          processMethod: processRequest.method,
          hasSchema: !!request.params.schema,
          maxTokens: request.params.max_tokens
        };
      });

      // Test 8: Response processing simulation
      await this.runTest('Response Processing Simulation', async () => {
        const core = new MCPIntelligenceCore();
        
        // First create a request to get a requestId
        const delegateResponse = await core.delegateToClaudeIntelligence({
          system: "Test system",
          user: "Test user",
          schema: { required: ['title'] }
        });

        // Simulate processing a valid response
        const mockResponse = JSON.stringify({ title: "Test Title", description: "Test Description" });
        
        const processedResponse = await core.processClaudeResponse({
          requestId: delegateResponse.requestId,
          response: mockResponse
        });

        if (processedResponse.type !== 'INTELLIGENCE_RESPONSE') {
          throw new Error('Wrong processed response type');
        }
        if (!processedResponse.data) {
          throw new Error('No processed data');
        }

        return {
          responseType: processedResponse.type,
          hasData: !!processedResponse.data,
          processingTime: processedResponse.metadata.processingTime,
          schemaStatus: processedResponse.metadata.schema
        };
      });

      // Test 9: Error handling
      await this.runTest('Error Handling', async () => {
        const core = new MCPIntelligenceCore();
        
        // Test processing response without pending request
        try {
          await core.processClaudeResponse({
            requestId: 'non-existent-id',
            response: 'test response'
          });
          throw new Error('Should have thrown error for non-existent request');
        } catch (error) {
          if (!error.message.includes('No pending request found')) {
            throw new Error('Wrong error message');
          }
        }

        // Test unknown method
        try {
          await core.request({ method: 'unknown_method', params: {} });
          throw new Error('Should have thrown error for unknown method');
        } catch (error) {
          if (!error.message.includes('Unknown method')) {
            throw new Error('Wrong error message for unknown method');
          }
        }

        return { errorHandlingWorks: true };
      });

      // Test 10: Integration with server architecture
      await this.runTest('Server Integration Check', async () => {
        // This tests that the MCP bridge can be integrated into the server
        const serverOptions = { dataDir: '.test-data' };
        
        // We don't actually start the server, just check initialization
        const server = new Stage1CoreServer(serverOptions);
        
        if (!server.coreIntelligence) {
          throw new Error('Core intelligence not initialized in server');
        }
        
        if (!(server.coreIntelligence instanceof CoreIntelligence)) {
          throw new Error('Core intelligence not correct type');
        }

        return { 
          serverHasIntelligence: !!server.coreIntelligence,
          intelligenceType: server.coreIntelligence.constructor.name,
          hasMCPCore: !!server.coreIntelligence.mcpCore
        };
      });

    } catch (error) {
      console.error(`\n❌ Test suite failed: ${error.message}`);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 MCP Intelligence Bridge Test Results');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`📊 Total: ${this.passedTests + this.failedTests}`);
    
    if (this.failedTests === 0) {
      console.log('\n🎉 All tests passed! MCP Intelligence Bridge is fully functional.');
      console.log('✅ Intelligence delegation is working correctly');
      console.log('✅ Schema validation is working');
      console.log('✅ Forest integration is ready');
      console.log('✅ Legacy compatibility is maintained');
      console.log('✅ Error handling is robust');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }
    
    return {
      passed: this.passedTests,
      failed: this.failedTests,
      total: this.passedTests + this.failedTests,
      success: this.failedTests === 0
    };
  }
}

// Run the comprehensive test
const tester = new MCPIntelligenceBridgeTest();
tester.runAllTests().catch(console.error);
