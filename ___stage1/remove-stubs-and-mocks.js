/**
 * Remove Stubs and Mocks Script
 * This script detects and helps remove all stubs and mocks from the codebase
 * to ensure real implementations are used for 100% test coverage
 */

import fs from 'fs/promises';
import path from 'path';

class StubRemover {
  constructor() {
    this.stubPatterns = [
      /\bmock\b/i,
      /\bstub\b/i,
      /\bspy\b/i,
      /\bfake\b/i,
      /jest\.mock/,
      /sinon\./,
      /\.returns\(/,
      /\.resolves\(/,
      /\.rejects\(/,
      /createMock/,
      /createStub/
    ];
    
    this.filesToCheck = [];
    this.stubsFound = [];
  }
  
  async findAllJsFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await this.findAllJsFiles(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        this.filesToCheck.push(fullPath);
      }
    }
  }
  
  async scanFileForStubs(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const stubs = [];
      
      lines.forEach((line, index) => {
        this.stubPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            stubs.push({
              file: filePath,
              line: index + 1,
              content: line.trim(),
              pattern: pattern.toString()
            });
          }
        });
      });
      
      if (stubs.length > 0) {
        this.stubsFound.push(...stubs);
      }
      
      return stubs;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      return [];
    }
  }
  
  async scanCodebase() {
    console.log('🔍 Scanning codebase for stubs and mocks...\n');
    
    // Find all JS files
    await this.findAllJsFiles('.');
    console.log(`Found ${this.filesToCheck.length} JavaScript files to check\n`);
    
    // Scan each file
    for (const file of this.filesToCheck) {
      await this.scanFileForStubs(file);
    }
    
    // Report findings
    if (this.stubsFound.length === 0) {
      console.log('✅ No stubs or mocks found! The codebase is clean.');
    } else {
      console.log(`⚠️  Found ${this.stubsFound.length} potential stubs/mocks:\n`);
      
      // Group by file
      const byFile = {};
      this.stubsFound.forEach(stub => {
        if (!byFile[stub.file]) {
          byFile[stub.file] = [];
        }
        byFile[stub.file].push(stub);
      });
      
      // Display results
      Object.entries(byFile).forEach(([file, stubs]) => {
        console.log(`\n📄 ${file}:`);
        stubs.forEach(stub => {
          console.log(`   Line ${stub.line}: ${stub.content}`);
        });
      });
      
      // Analyze stub types
      this.analyzeStubTypes();
    }
  }
  
  analyzeStubTypes() {
    console.log('\n📊 Stub Analysis:');
    
    const stubFiles = new Set();
    const mockFiles = new Set();
    const testStubs = [];
    const implementationStubs = [];
    
    this.stubsFound.forEach(stub => {
      const isTest = stub.file.includes('test') || stub.file.includes('spec');
      const isMock = /mock/i.test(stub.content);
      const isStub = /stub/i.test(stub.content);
      
      if (isMock) mockFiles.add(stub.file);
      if (isStub) stubFiles.add(stub.file);
      
      if (isTest) {
        testStubs.push(stub);
      } else {
        implementationStubs.push(stub);
      }
    });
    
    console.log(`\n- Files with mocks: ${mockFiles.size}`);
    console.log(`- Files with stubs: ${stubFiles.size}`);
    console.log(`- Stubs in test files: ${testStubs.length}`);
    console.log(`- Stubs in implementation files: ${implementationStubs.length}`);
    
    if (implementationStubs.length > 0) {
      console.log('\n❗ Critical: Found stubs in implementation files:');
      implementationStubs.forEach(stub => {
        console.log(`   ${stub.file}:${stub.line}`);
      });
      console.log('\n   These should be replaced with real implementations!');
    }
  }
  
  async generateCleanupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: this.filesToCheck.length,
      stubsFound: this.stubsFound.length,
      files: {}
    };
    
    this.stubsFound.forEach(stub => {
      if (!report.files[stub.file]) {
        report.files[stub.file] = {
          stubs: [],
          recommendations: []
        };
      }
      report.files[stub.file].stubs.push({
        line: stub.line,
        content: stub.content
      });
    });
    
    // Add recommendations
    Object.keys(report.files).forEach(file => {
      const recommendations = [];
      
      if (file.includes('test')) {
        recommendations.push('Replace test mocks with real component instances');
        recommendations.push('Use actual implementations instead of stubs');
      } else {
        recommendations.push('CRITICAL: Remove stub from implementation file');
        recommendations.push('Implement real functionality');
      }
      
      report.files[file].recommendations = recommendations;
    });
    
    await fs.writeFile('stub-cleanup-report.json', JSON.stringify(report, null, 2));
    console.log('\n📝 Cleanup report saved to stub-cleanup-report.json');
  }
}

// Run the stub remover
const remover = new StubRemover();

console.log('🧹 Stub and Mock Detection Tool\n');
console.log('This tool will help identify all stubs and mocks in the codebase');
console.log('to ensure 100% real implementation coverage.\n');

remover.scanCodebase()
  .then(() => remover.generateCleanupReport())
  .catch(console.error);
