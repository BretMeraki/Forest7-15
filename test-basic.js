/**
 * Basic System Test
 * Validates core system initialization and basic functionality
 */

// Configuration constants
const TEST_CONFIG = {
  INITIALIZATION_TIMEOUT_MS: 5000,
  EXIT_CODES: {
    SUCCESS: 0,
    FAILURE: 1
  }
};

class TestLogger {
  constructor() {
    this.startTime = Date.now();
  }
  
  log(message, ...args) {
    const elapsed = Date.now() - this.startTime;
    console.log(`[${elapsed}ms] ${message}`, ...args);
  }
  
  error(message, ...args) {
    const elapsed = Date.now() - this.startTime;
    console.error(`[${elapsed}ms] ❌ ${message}`, ...args);
  }
  
  success(message, ...args) {
    const elapsed = Date.now() - this.startTime;
    console.log(`[${elapsed}ms] ✅ ${message}`, ...args);
  }
}

class MemoryMonitor {
  constructor() {
    this.initialMemory = process.memoryUsage();
  }
  
  getCurrentUsage() {
    const current = process.memoryUsage();
    return {
      heapUsed: this.formatBytes(current.heapUsed),
      heapTotal: this.formatBytes(current.heapTotal),
      deltaHeap: this.formatBytes(current.heapUsed - this.initialMemory.heapUsed)
    };
  }
  
  formatBytes(bytes) {
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }
  
  logUsage(label = 'Memory Usage') {
    const usage = this.getCurrentUsage();
    this.logger?.log(`${label}: Heap ${usage.heapUsed}/${usage.heapTotal} (Δ${usage.deltaHeap})`);
  }
  
  setLogger(logger) {
    this.logger = logger;
  }
}

class BasicSystemTest {
  constructor(config = {}) {
    this.config = { ...TEST_CONFIG, ...config };
    this.logger = new TestLogger();
    this.memoryMonitor = new MemoryMonitor();
    this.memoryMonitor.setLogger(this.logger);
  }
  
  async testEnvironment() {
    this.logger.log('Testing environment...');
    this.logger.log('Node.js version:', process.version);
    this.logger.log('Current directory:', process.cwd());
    this.memoryMonitor.logUsage('Initial memory');
  }
  
  async testModuleImport() {
    this.logger.log('Testing module import...');
    
    try {
      const module = await import('./___stage1/core-initialization.js');
      this.logger.success('CoreInitialization module loaded');
      this.memoryMonitor.logUsage('After module import');
      return module;
    } catch (error) {
      throw new Error(`Module import failed: ${error.message}`);
    }
  }
  
  async testInitialization(CoreInitialization) {
    this.logger.log('Testing system initialization...');
    
    const init = new CoreInitialization();
    this.logger.log('CoreInitialization instance created');
    
    const server = await Promise.race([
      init.initialize(),
      this.createTimeoutPromise()
    ]);
    
    this.logger.success('System initialized successfully');
    this.memoryMonitor.logUsage('After initialization');
    return server;
  }
  
  createTimeoutPromise() {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Initialization timeout after ${this.config.INITIALIZATION_TIMEOUT_MS}ms`)), 
        this.config.INITIALIZATION_TIMEOUT_MS)
    );
  }
  
  async safeShutdown(server) {
    if (!server?.shutdown) {
      this.logger.log('No shutdown method available');
      return;
    }
    
    try {
      this.logger.log('Shutting down server...');
      await server.shutdown();
      this.logger.success('Server shutdown completed');
      this.memoryMonitor.logUsage('After shutdown');
    } catch (error) {
      this.logger.error('Shutdown failed:', error.message);
    }
  }
  
  async run() {
    let server = null;
    
    try {
      this.logger.log('Starting basic system test...');
      
      await this.testEnvironment();
      const { CoreInitialization } = await this.testModuleImport();
      server = await this.testInitialization(CoreInitialization);
      
      this.logger.success('All tests passed! System is operational.');
      return true;
      
    } catch (error) {
      this.logger.error('Test failed:', error.message);
      if (error.stack) {
        this.logger.error('Stack trace:', error.stack);
      }
      return false;
      
    } finally {
      if (server) {
        await this.safeShutdown(server);
      }
      this.memoryMonitor.logUsage('Final memory');
    }
  }
}

// Execute the test
async function main() {
  const test = new BasicSystemTest();
  const success = await test.run();
  process.exit(success ? TEST_CONFIG.EXIT_CODES.SUCCESS : TEST_CONFIG.EXIT_CODES.FAILURE);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(TEST_CONFIG.EXIT_CODES.FAILURE);
});

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(TEST_CONFIG.EXIT_CODES.FAILURE);
});