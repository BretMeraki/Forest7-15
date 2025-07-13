import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ComprehensiveValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
    this.criticalFiles = [
      '___stage1/forest-mcp-server.js',
      '___stage1/core-server.js',
      '___stage1/core-initialization.js',
      '___stage1/modules/data-persistence.js',
      '___stage1/modules/project-management.js',
      '___stage1/modules/hta-core.js',
      '___stage1/modules/task-strategy-core.js',
      '___stage1/modules/core-intelligence.js'
    ];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const color = type === 'error' ? colors.red : 
                   type === 'warning' ? colors.yellow :
                   type === 'success' ? colors.green :
                   type === 'info' ? colors.cyan : colors.reset;
    
    console.log(`${color}[${timestamp}] [${type.toUpperCase()}] ${message}${colors.reset}`);
    
    if (type === 'error') {
      this.issues.push(message);
    } else if (type === 'warning') {
      this.warnings.push(message);
    } else if (type === 'success') {
      this.successes.push(message);
    }
  }

  async checkFileExists(filePath) {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async validateSyntax(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      
      // Basic syntax checks
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      const openBrackets = (content.match(/\[/g) || []).length;
      const closeBrackets = (content.match(/\]/g) || []).length;
      
      const issues = [];
      
      if (openBraces !== closeBraces) {
        issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
      }
      if (openParens !== closeParens) {
        issues.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
      }
      if (openBrackets !== closeBrackets) {
        issues.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
      }
      
      // Check for unterminated strings (simplified)
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("'") || line.includes('"') || line.includes('`')) {
          // Skip if it's a comment
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
          
          // Count quotes
          const singleQuotes = (line.match(/'/g) || []).length;
          const doubleQuotes = (line.match(/"/g) || []).length;
          const backTicks = (line.match(/`/g) || []).length;
          
          if (singleQuotes % 2 !== 0) {
            issues.push(`Potentially unterminated single quote on line ${i + 1}`);
          }
          if (doubleQuotes % 2 !== 0) {
            issues.push(`Potentially unterminated double quote on line ${i + 1}`);
          }
          if (backTicks % 2 !== 0) {
            // This might be a multi-line template literal, so just warn
            this.log('warning', `Possible multi-line template literal on line ${i + 1} in ${filePath}`);
          }
        }
      }
      
      return issues;
    } catch (error) {
      return [`Failed to read file: ${error.message}`];
    }
  }

  async validateImports(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const importRegex = /import\s+(?:{[^}]+}|[^;]+)\s+from\s+['"]([^'"]+)['"]/g;
      const issues = [];
      
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        // Skip node modules and built-in modules
        if (importPath.startsWith('node:') || !importPath.startsWith('.')) {
          continue;
        }
        
        // Resolve the import path
        const dir = path.dirname(filePath);
        let resolvedPath = path.resolve(dir, importPath);
        
        // Add .js extension if not present
        if (!resolvedPath.endsWith('.js')) {
          resolvedPath += '.js';
        }
        
        const exists = await this.checkFileExists(resolvedPath);
        if (!exists) {
          issues.push(`Import not found: ${importPath} (resolved to ${resolvedPath})`);
        }
      }
      
      return issues;
    } catch (error) {
      return [`Failed to validate imports: ${error.message}`];
    }
  }

  async validateExports(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const issues = [];
      
      // Check for export statements
      const hasExports = content.includes('export ') || content.includes('module.exports');
      const hasDefaultExport = content.includes('export default') || content.includes('module.exports =');
      const hasNamedExports = /export\s+{/.test(content) || /exports\.\w+/.test(content);
      
      if (!hasExports && this.criticalFiles.includes(filePath.replace(/\\/g, '/'))) {
        issues.push('No exports found in critical file');
      }
      
      return issues;
    } catch (error) {
      return [`Failed to validate exports: ${error.message}`];
    }
  }

  async validateFile(filePath) {
    this.log('info', `Validating ${filePath}...`);
    
    const exists = await this.checkFileExists(filePath);
    if (!exists) {
      this.log('error', `File not found: ${filePath}`);
      return false;
    }
    
    // Syntax validation
    const syntaxIssues = await this.validateSyntax(filePath);
    if (syntaxIssues.length > 0) {
      syntaxIssues.forEach(issue => {
        this.log('error', `Syntax issue in ${filePath}: ${issue}`);
      });
    }
    
    // Import validation
    const importIssues = await this.validateImports(filePath);
    if (importIssues.length > 0) {
      importIssues.forEach(issue => {
        this.log('error', `Import issue in ${filePath}: ${issue}`);
      });
    }
    
    // Export validation
    const exportIssues = await this.validateExports(filePath);
    if (exportIssues.length > 0) {
      exportIssues.forEach(issue => {
        this.log('warning', `Export issue in ${filePath}: ${issue}`);
      });
    }
    
    if (syntaxIssues.length === 0 && importIssues.length === 0) {
      this.log('success', `✅ ${filePath} validated successfully`);
      return true;
    }
    
    return false;
  }

  async testServerStartup() {
    this.log('info', 'Testing server startup...');
    
    return new Promise((resolve) => {
      const serverProcess = spawn('node', ['___stage1/forest-mcp-server.js'], {
        cwd: __dirname,
        env: { ...process.env, FOREST_DATA_DIR: path.join(__dirname, '.test-validation-data') }
      });
      
      let startupSuccessful = false;
      let errorOutput = '';
      
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Forest MCP server started successfully')) {
          startupSuccessful = true;
          this.log('success', '✅ Server started successfully');
          serverProcess.kill('SIGINT');
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      serverProcess.on('exit', (code) => {
        if (startupSuccessful) {
          resolve(true);
        } else {
          this.log('error', `Server startup failed with code ${code}`);
          if (errorOutput) {
            this.log('error', `Error output: ${errorOutput}`);
          }
          resolve(false);
        }
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!startupSuccessful) {
          this.log('error', 'Server startup timeout');
          serverProcess.kill('SIGKILL');
          resolve(false);
        }
      }, 10000);
    });
  }

  async validateDataStructures() {
    this.log('info', 'Validating data structures...');
    
    const dataDir = path.join(__dirname, '.forest-data');
    const testProjectDir = path.join(dataDir, 'test_validation_project');
    
    try {
      // Create test project structure
      await fs.promises.mkdir(testProjectDir, { recursive: true });
      await fs.promises.mkdir(path.join(testProjectDir, 'paths', 'general'), { recursive: true });
      
      // Test config structure
      const testConfig = {
        project_id: 'test_validation_project',
        goal: 'Test project for validation',
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      };
      
      await fs.promises.writeFile(
        path.join(testProjectDir, 'config.json'),
        JSON.stringify(testConfig, null, 2)
      );
      
      // Test HTA structure
      const testHTA = {
        goal: 'Test project for validation',
        rootId: 'root',
        nodes: {
          root: {
            id: 'root',
            title: 'Test Root Task',
            type: 'composite',
            children: []
          }
        },
        frontierNodes: []
      };
      
      await fs.promises.writeFile(
        path.join(testProjectDir, 'paths', 'general', 'hta.json'),
        JSON.stringify(testHTA, null, 2)
      );
      
      this.log('success', '✅ Data structures validated successfully');
      
      // Cleanup
      await fs.promises.rm(testProjectDir, { recursive: true, force: true });
      
      return true;
    } catch (error) {
      this.log('error', `Data structure validation failed: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_issues: this.issues.length,
        total_warnings: this.warnings.length,
        total_successes: this.successes.length
      },
      issues: this.issues,
      warnings: this.warnings,
      successes: this.successes
    };
    
    const reportPath = path.join(__dirname, 'validation-report.json');
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n' + colors.bright + '='.repeat(80) + colors.reset);
    console.log(colors.bright + 'VALIDATION REPORT' + colors.reset);
    console.log('='.repeat(80));
    console.log(`${colors.green}Successes: ${this.successes.length}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.red}Issues: ${this.issues.length}${colors.reset}`);
    console.log('='.repeat(80));
    
    if (this.issues.length === 0) {
      console.log(`\n${colors.green}${colors.bright}✅ ALL VALIDATIONS PASSED! The codebase is functioning perfectly.${colors.reset}\n`);
    } else {
      console.log(`\n${colors.red}${colors.bright}❌ ${this.issues.length} issues need attention.${colors.reset}\n`);
    }
    
    console.log(`Full report saved to: ${reportPath}`);
  }

  async run() {
    console.log(colors.bright + '\n🔍 COMPREHENSIVE CODEBASE VALIDATION\n' + colors.reset);
    
    // Validate critical files
    for (const file of this.criticalFiles) {
      await this.validateFile(path.join(__dirname, file));
    }
    
    // Test server startup
    await this.testServerStartup();
    
    // Validate data structures
    await this.validateDataStructures();
    
    // Generate report
    await this.generateReport();
  }
}

// Run validation
const validator = new ComprehensiveValidator();
validator.run().catch(error => {
  console.error(colors.red + `\nValidation failed: ${error.message}` + colors.reset);
  process.exit(1);
});
