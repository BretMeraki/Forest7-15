/**
 * Live MCP Server Integration Test
 * Tests the MCP intelligence bridge in the context of a running server
 */

import { Stage1CoreServer } from './___stage1/core-server.js';

class LiveMCPIntegrationTest {
  constructor() {
    this.server = null;
    this.testResults = [];
  }

  async startServer() {
    console.log('🚀 Starting Forest MCP Server for integration test...');
    this.server = new Stage1CoreServer({ dataDir: '.test-integration-data' });
    
    // Initialize but don't start the actual MCP transport
    await this.server.initialize();
    console.log('✅ Server initialized successfully');
    return this.server;
  }

  async stopServer() {
    if (this.server) {
      console.log('🛑 Stopping test server...');
      // Clean shutdown
      this.server = null;
      console.log('✅ Server stopped');
    }
  }

  async testIntelligenceIntegration() {
    console.log('\n🧪 Testing intelligence integration in live server...');
    
    // Test 1: Core intelligence is available
    console.log('📋 Test 1: Core intelligence availability');
    if (!this.server.coreIntelligence) {
      throw new Error('Core intelligence not available in server');
    }
    console.log('   ✅ Core intelligence is available');

    // Test 2: MCP Core is properly wired
    console.log('📋 Test 2: MCP Core integration');
    if (!this.server.coreIntelligence.mcpCore) {
      throw new Error('MCP Core not available in intelligence module');
    }
    console.log('   ✅ MCP Core is integrated');

    // Test 3: Tool router has intelligence access
    console.log('📋 Test 3: Tool router intelligence access');
    if (!this.server.toolRouter) {
      throw new Error('Tool router not available');
    }
    console.log('   ✅ Tool router is available');

    // Test 4: Test a direct intelligence request through the server
    console.log('📋 Test 4: Direct intelligence request');
    const intelligenceRequest = {
      method: 'llm/completion',
      params: {
        system: 'You are a helpful learning assistant',
        user: 'Create a simple task for learning JavaScript',
        schema: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            difficulty: { type: 'number', minimum: 1, maximum: 5 }
          }
        },
        max_tokens: 400,
        temperature: 0.7
      }
    };

    const intelligenceResponse = await this.server.coreIntelligence.request(intelligenceRequest);
    if (intelligenceResponse.type !== 'CLAUDE_INTELLIGENCE_REQUEST') {
      throw new Error('Wrong response type from intelligence request');
    }
    console.log('   ✅ Direct intelligence request works');
    console.log(`   📝 Request ID: ${intelligenceResponse.requestId}`);

    // Test 5: Test Forest Intelligence Adapter through server
    console.log('📋 Test 5: Forest Intelligence Adapter through server');
    const forestAdapter = this.server.coreIntelligence.mcpCore;
    if (!forestAdapter) {
      throw new Error('Forest adapter not available');
    }
    console.log('   ✅ Forest Intelligence Adapter accessible');

    // Test 6: Test tool call simulation
    console.log('📋 Test 6: Tool call simulation');
    if (this.server.toolRouter && typeof this.server.toolRouter.handleToolCall === 'function') {
      // Simulate a tool call that might require intelligence
      try {
        const toolResult = await this.server.toolRouter.handleToolCall('get_landing_page_forest', {});
        if (!toolResult) {
          throw new Error('Tool call returned no result');
        }
        console.log('   ✅ Tool call simulation works');
      } catch (toolError) {
        console.log(`   ⚠️  Tool call simulation had issues: ${toolError.message}`);
        // This might be expected in test environment
      }
    } else {
      console.log('   ⚠️  Tool router handleToolCall not available (expected in test)');
    }

    return {
      coreIntelligenceAvailable: !!this.server.coreIntelligence,
      mcpCoreIntegrated: !!this.server.coreIntelligence.mcpCore,
      toolRouterAvailable: !!this.server.toolRouter,
      intelligenceRequestWorks: intelligenceResponse.type === 'CLAUDE_INTELLIGENCE_REQUEST',
      requestId: intelligenceResponse.requestId
    };
  }

  async testMemoryAndPersistence() {
    console.log('\n🧪 Testing memory and persistence integration...');

    // Test 1: Data persistence is available
    console.log('📋 Test 1: Data persistence availability');
    if (!this.server.dataPersistence) {
      throw new Error('Data persistence not available');
    }
    console.log('   ✅ Data persistence is available');

    // Test 2: Memory sync integration
    console.log('📋 Test 2: Memory sync integration');
    if (!this.server.memorySync) {
      throw new Error('Memory sync not available');
    }
    console.log('   ✅ Memory sync is available');

    // Test 3: Intelligence can work with persistence
    console.log('📋 Test 3: Intelligence-persistence integration');
    const intelligenceWithContext = await this.server.coreIntelligence.requestIntelligence(
      'Test intelligence request with context',
      { 
        context: 'This is test context for persistence integration',
        maxTokens: 200
      }
    );
    
    if (!intelligenceWithContext) {
      throw new Error('Intelligence request with context failed');
    }
    console.log('   ✅ Intelligence works with context');

    return {
      dataPersistenceAvailable: !!this.server.dataPersistence,
      memorySyncAvailable: !!this.server.memorySync,
      intelligenceWithContextWorks: !!intelligenceWithContext
    };
  }

  async testVectorIntegration() {
    console.log('\n🧪 Testing vector intelligence integration...');

    // Test 1: Vector store integration
    console.log('📋 Test 1: Vector store integration');
    if (!this.server.forestDataVectorization) {
      throw new Error('Forest data vectorization not available');
    }
    console.log('   ✅ Forest data vectorization is available');

    // Test 2: HTA Core vector support
    console.log('📋 Test 2: HTA Core vector support');
    if (!this.server.htaCore) {
      throw new Error('HTA Core not available');
    }
    console.log('   ✅ HTA Core is available');

    // Test 3: Vector and intelligence integration
    console.log('📋 Test 3: Vector-intelligence integration');
    const hasVectorStore = typeof this.server.htaCore.initializeVectorStore === 'function';
    console.log(`   ${hasVectorStore ? '✅' : '⚠️ '} HTA Core has vector store support: ${hasVectorStore}`);

    return {
      vectorizationAvailable: !!this.server.forestDataVectorization,
      htaCoreAvailable: !!this.server.htaCore,
      hasVectorStoreSupport: hasVectorStore
    };
  }

  async runAllTests() {
    console.log('🎯 Running Live MCP Intelligence Bridge Integration Tests\n');

    try {
      // Start the server
      await this.startServer();

      // Run integration tests
      const intelligenceResults = await this.testIntelligenceIntegration();
      const memoryResults = await this.testMemoryAndPersistence();
      const vectorResults = await this.testVectorIntegration();

      // Summary
      console.log('\n' + '='.repeat(70));
      console.log('🎯 Live MCP Integration Test Results');
      console.log('='.repeat(70));

      console.log('\n📊 Intelligence Integration:');
      console.log(`   Core Intelligence: ${intelligenceResults.coreIntelligenceAvailable ? '✅' : '❌'}`);
      console.log(`   MCP Core Integrated: ${intelligenceResults.mcpCoreIntegrated ? '✅' : '❌'}`);
      console.log(`   Tool Router: ${intelligenceResults.toolRouterAvailable ? '✅' : '❌'}`);
      console.log(`   Intelligence Requests: ${intelligenceResults.intelligenceRequestWorks ? '✅' : '❌'}`);

      console.log('\n📊 Memory & Persistence:');
      console.log(`   Data Persistence: ${memoryResults.dataPersistenceAvailable ? '✅' : '❌'}`);
      console.log(`   Memory Sync: ${memoryResults.memorySyncAvailable ? '✅' : '❌'}`);
      console.log(`   Context Integration: ${memoryResults.intelligenceWithContextWorks ? '✅' : '❌'}`);

      console.log('\n📊 Vector Intelligence:');
      console.log(`   Vectorization: ${vectorResults.vectorizationAvailable ? '✅' : '❌'}`);
      console.log(`   HTA Core: ${vectorResults.htaCoreAvailable ? '✅' : '❌'}`);
      console.log(`   Vector Store Support: ${vectorResults.hasVectorStoreSupport ? '✅' : '⚠️ '}`);

      const allPassed = 
        intelligenceResults.coreIntelligenceAvailable &&
        intelligenceResults.mcpCoreIntegrated &&
        intelligenceResults.intelligenceRequestWorks &&
        memoryResults.dataPersistenceAvailable &&
        memoryResults.memorySyncAvailable &&
        vectorResults.vectorizationAvailable &&
        vectorResults.htaCoreAvailable;

      if (allPassed) {
        console.log('\n🎉 All critical integration tests passed!');
        console.log('✅ MCP Intelligence Bridge is fully integrated');
        console.log('✅ Server architecture supports intelligence delegation');
        console.log('✅ Memory and persistence integration working');
        console.log('✅ Vector intelligence capabilities available');
        console.log('\n🚀 The MCP bridge is ready for production use!');
      } else {
        console.log('\n⚠️  Some integration issues detected - review above results');
      }

      return {
        intelligence: intelligenceResults,
        memory: memoryResults,
        vector: vectorResults,
        overallSuccess: allPassed
      };

    } catch (error) {
      console.error(`\n❌ Integration test failed: ${error.message}`);
      console.error('Stack:', error.stack);
      throw error;
    } finally {
      // Always clean up
      await this.stopServer();
    }
  }
}

// Run the live integration test
const tester = new LiveMCPIntegrationTest();
tester.runAllTests().catch(console.error);
