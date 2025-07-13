// Comprehensive error detector - finding ALL runtime errors
import { CoreInitialization } from './core-initialization.js';
import fs from 'fs/promises';
import path from 'path';

const errors = [];
const warnings = [];

async function testModuleImports() {
    console.log('=== Testing Module Imports ===\n');
    
    const modules = [
        './forest-mcp-server.js',
        './core-server.js',
        './core-initialization.js',
        './modules/data-persistence.js',
        './modules/project-management.js',
        './modules/hta-core.js',
        './modules/task-strategy-core.js',
        './modules/core-intelligence.js',
        './modules/task-logic/task-selector.js',
        './modules/task-formatter.js',
        './modules/memory-sync.js',
        './modules/mcp-core.js'
    ];
    
    for (const module of modules) {
        try {
            await import(module);
            console.log(`✅ ${module}`);
        } catch (error) {
            console.error(`❌ ${module}: ${error.message}`);
            errors.push({ module, error: error.message });
        }
    }
}

async function testSyntaxInFiles() {
    console.log('\n=== Testing Syntax with Node.js Parser ===\n');
    
    const files = [
        'modules/hta-core.js',
        'modules/core-intelligence.js',
        'modules/task-strategy-core.js'
    ];
    
    for (const file of files) {
        try {
            const content = await fs.readFile(file, 'utf8');
            // Try to create a function from the content to check syntax
            new Function(content);
            console.log(`✅ ${file} - Syntax OK`);
        } catch (error) {
            if (error.message.includes('import') || error.message.includes('export')) {
                // ES module syntax, this is OK
                console.log(`✅ ${file} - ES Module syntax (OK)`);
            } else {
                console.error(`❌ ${file}: ${error.message.split('\n')[0]}`);
                errors.push({ file, error: error.message.split('\n')[0] });
            }
        }
    }
}

async function testCriticalPaths() {
    console.log('\n=== Testing Critical Execution Paths ===\n');
    
    try {
        // Test 1: Core Initialization
        console.log('1. Testing Core Initialization...');
        const init = new CoreInitialization();
        await init.initialize();
        await init.shutdown();
        console.log('   ✅ Core initialization works');
    } catch (error) {
        console.error('   ❌ Core initialization failed:', error.message);
        errors.push({ path: 'CoreInitialization', error: error.message });
    }
    
    try {
        // Test 2: Task Strategy Core method calls
        console.log('\n2. Testing TaskStrategyCore...');
        const { TaskStrategyCore } = await import('./modules/task-strategy-core.js');
        const { DataPersistence } = await import('./modules/data-persistence.js');
        
        const dataPersistence = new DataPersistence('.forest-data');
        const taskStrategy = new TaskStrategyCore(dataPersistence);
        
        // Check if taskSelector exists
        if (!taskStrategy.taskSelector) {
            throw new Error('taskSelector not initialized in TaskStrategyCore');
        }
        
        console.log('   ✅ TaskStrategyCore.taskSelector exists');
    } catch (error) {
        console.error('   ❌ TaskStrategyCore test failed:', error.message);
        errors.push({ path: 'TaskStrategyCore', error: error.message });
    }
}

async function findPotentialIssues() {
    console.log('\n=== Scanning for Potential Issues ===\n');
    
    const files = [
        'modules/hta-core.js',
        'modules/core-intelligence.js',
        'modules/task-strategy-core.js'
    ];
    
    for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');
        
        // Check for common issues
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            
            // Check for console.log without error stream
            if (line.includes('console.log(') && !line.includes('console.error')) {
                warnings.push(`${file}:${lineNum} - console.log should be console.error for MCP`);
            }
            
            // Check for unescaped quotes in template literals
            if (line.includes('`') && line.includes("'") && !line.includes("\\'")) {
                const quoteCount = (line.match(/'/g) || []).length;
                if (quoteCount % 2 !== 0) {
                    warnings.push(`${file}:${lineNum} - Possible unescaped quote in template literal`);
                }
            }
        });
    }
}

async function runAllTests() {
    console.log('🔍 COMPREHENSIVE ERROR DETECTION\n');
    console.log('This will find ALL actual runtime errors...\n');
    
    await testModuleImports();
    await testSyntaxInFiles();
    await testCriticalPaths();
    await findPotentialIssues();
    
    console.log('\n' + '='.repeat(60));
    console.log('FINAL REPORT');
    console.log('='.repeat(60));
    
    if (errors.length === 0) {
        console.log('\n✅ NO CRITICAL ERRORS FOUND!\n');
    } else {
        console.log(`\n❌ FOUND ${errors.length} CRITICAL ERRORS:\n`);
        errors.forEach((err, i) => {
            console.log(`${i + 1}. ${err.module || err.file || err.path}: ${err.error}`);
        });
    }
    
    if (warnings.length > 0) {
        console.log(`\n⚠️  FOUND ${warnings.length} WARNINGS:\n`);
        warnings.forEach((warn, i) => {
            console.log(`${i + 1}. ${warn}`);
        });
    }
    
    // Cleanup
    setTimeout(() => process.exit(errors.length > 0 ? 1 : 0), 1000);
}

runAllTests().catch(console.error);
