/**
 * Claude AST Analyzer - Provides detailed AST analysis for Claude
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

let babelParser;
let babelTraverse;

try {
  const require = createRequire(import.meta.url);
  babelParser = require('@babel/parser');
  babelTraverse = require('@babel/traverse').default;
} catch (error) {
  console.warn('[ClaudeASTAnalyzer] Babel parser not available, using fallback mock parser');
  
  // Fallback mock implementations
  babelParser = {
    parse: (code) => {
      console.warn('[ClaudeASTAnalyzer] Mock parser returning empty AST');
      return {
        type: 'Program',
        body: [],
        sourceType: 'module'
      };
    }
  };
  
  babelTraverse = (ast, visitors) => {
    console.warn('[ClaudeASTAnalyzer] Mock traverse - no actual traversal performed');
  };
}

const PARSER_OPTIONS = {
  sourceType: 'module',
  plugins: [
    'classProperties',
    'dynamicImport',
    'optionalChaining',
    'nullishCoalescingOperator',
    'typescript',
  ],
  allowImportExportEverywhere: true,
  errorRecovery: true,
};

export class ClaudeASTAnalyzer {
  
  async analyzeFile(filePath) {
    try {
      const code = fs.readFileSync(filePath, 'utf8');
      const ast = babelParser.parse(code, PARSER_OPTIONS);
      
      const analysis = {
        file: path.basename(filePath),
        path: filePath,
        functions: [],
        classes: [],
        imports: [],
        exports: [],
        patterns: [],
        complexity: 0,
        lineCount: code.split('\n').length
      };
      
      babelTraverse(ast, {
        FunctionDeclaration: (path) => this.analyzeFunctionDeclaration(path, analysis),
        ClassDeclaration: (path) => this.analyzeClassDeclaration(path, analysis),
        ImportDeclaration: (path) => this.analyzeImportDeclaration(path, analysis),
        ExportNamedDeclaration: (path) => this.analyzeExportDeclaration(path, analysis),
        AssignmentExpression: (path) => this.analyzeAssignmentExpression(path, analysis),
        CallExpression: (path) => this.analyzeCallExpression(path, analysis)
      });
      
      analysis.complexity = this.calculateOverallComplexity(analysis);
      return analysis;
      
    } catch (error) {
      return {
        error: error.message,
        file: path.basename(filePath)
      };
    }
  }
  
  analyzeFunctionDeclaration(path, analysis) {
    const func = {
      name: path.node.id?.name || 'anonymous',
      line: path.node.loc.start.line,
      params: path.node.params.map(p => this.getParamName(p)),
      isAsync: path.node.async,
      complexity: this.calculateFunctionComplexity(path),
      calls: [],
      bodyLength: path.node.body.body.length
    };
    
    // Find function calls within this function
    path.traverse({
      CallExpression: (callPath) => {
        const callee = this.getCallExpression(callPath.node);
        if (callee) func.calls.push(callee);
      }
    });
    
    analysis.functions.push(func);
  }
  
  analyzeClassDeclaration(path, analysis) {
    const cls = {
      name: path.node.id.name,
      line: path.node.loc.start.line,
      methods: [],
      properties: []
    };
    
    path.node.body.body.forEach(member => {
      if (member.type === 'MethodDefinition') {
        cls.methods.push({
          name: member.key.name,
          static: member.static,
          kind: member.kind, // constructor, method, get, set
          line: member.loc.start.line
        });
      } else if (member.type === 'ClassProperty') {
        cls.properties.push({
          name: member.key.name,
          static: member.static,
          line: member.loc.start.line
        });
      }
    });
    
    analysis.classes.push(cls);
  }
  
  analyzeImportDeclaration(path, analysis) {
    const imp = {
      source: path.node.source.value,
      specifiers: path.node.specifiers.map(spec => ({
        type: spec.type,
        name: spec.local.name,
        imported: spec.imported?.name
      })),
      line: path.node.loc.start.line
    };
    
    analysis.imports.push(imp);
  }
  
  analyzeExportDeclaration(path, analysis) {
    if (path.node.declaration) {
      const exp = {
        type: path.node.declaration.type,
        name: path.node.declaration.id?.name || 'default',
        line: path.node.loc.start.line
      };
      analysis.exports.push(exp);
    }
  }
  
  analyzeAssignmentExpression(path, analysis) {
    // Look for module.exports or exports.foo patterns
    const left = path.node.left;
    if (left.type === 'MemberExpression') {
      if (left.object.name === 'exports' || 
          (left.object.type === 'MemberExpression' && 
           left.object.object.name === 'module' && 
           left.object.property.name === 'exports')) {
        
        analysis.exports.push({
          type: 'CommonJS',
          name: left.property.name,
          line: path.node.loc.start.line
        });
      }
    }
  }
  
  analyzeCallExpression(path, analysis) {
    const callee = this.getCallExpression(path.node);
    if (callee && this.isPatternOfInterest(callee)) {
      analysis.patterns.push({
        type: 'call',
        pattern: callee,
        line: path.node.loc.start.line,
        args: path.node.arguments.length
      });
    }
  }
  
  getParamName(param) {
    switch (param.type) {
      case 'Identifier':
        return param.name;
      case 'ObjectPattern':
        return `{${param.properties.map(p => p.key.name).join(', ')}}`;
      case 'ArrayPattern':
        return `[${param.elements.map(e => e.name).join(', ')}]`;
      default:
        return 'unknown';
    }
  }
  
  getCallExpression(node) {
    if (node.callee.type === 'Identifier') {
      return node.callee.name;
    } else if (node.callee.type === 'MemberExpression') {
      const object = node.callee.object.name || 'unknown';
      const property = node.callee.property.name || 'unknown';
      return `${object}.${property}`;
    }
    return null;
  }
  
  calculateFunctionComplexity(path) {
    let complexity = 1; // Base complexity
    
    path.traverse({
      IfStatement: () => complexity++,
      ForStatement: () => complexity++,
      WhileStatement: () => complexity++,
      DoWhileStatement: () => complexity++,
      SwitchStatement: () => complexity++,
      ConditionalExpression: () => complexity++,
      LogicalExpression: (logicalPath) => {
        if (logicalPath.node.operator === '&&' || logicalPath.node.operator === '||') {
          complexity++;
        }
      }
    });
    
    return complexity;
  }
  
  calculateOverallComplexity(analysis) {
    const funcComplexity = analysis.functions.reduce((sum, f) => sum + f.complexity, 0);
    const classComplexity = analysis.classes.reduce((sum, c) => sum + c.methods.length, 0);
    return funcComplexity + classComplexity;
  }
  
  isPatternOfInterest(callee) {
    const patterns = [
      'generateTask', 'formatTask', 'selectTask', 'createTask',
      'buildHTA', 'parseHTML', 'renderTemplate', 'validateTask'
    ];
    return patterns.some(pattern => callee.includes(pattern));
  }
  
  async analyzeMultipleFiles(filePaths) {
    const results = [];
    for (const filePath of filePaths) {
      const analysis = await this.analyzeFile(filePath);
      results.push(analysis);
    }
    return results;
  }
  
  generateSummaryReport(analyses) {
    const summary = {
      totalFiles: analyses.length,
      totalFunctions: analyses.reduce((sum, a) => sum + (a.functions?.length || 0), 0),
      totalClasses: analyses.reduce((sum, a) => sum + (a.classes?.length || 0), 0),
      averageComplexity: 0,
      patterns: []
    };
    
    const complexities = analyses
      .filter(a => !a.error)
      .map(a => a.complexity || 0);
    
    if (complexities.length > 0) {
      summary.averageComplexity = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
    }
    
    // Collect all patterns
    analyses.forEach(analysis => {
      if (analysis.patterns) {
        summary.patterns.push(...analysis.patterns);
      }
    });
    
    return summary;
  }
}

// CLI usage
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const analyzer = new ClaudeASTAnalyzer();
  
  if (process.argv[2]) {
    const filePath = process.argv[2];
    analyzer.analyzeFile(filePath).then(result => {
      console.log(JSON.stringify(result, null, 2));
    });
  } else {
    console.log('Usage: node claude-ast-analyzer.js <file-path>');
  }
}

export default ClaudeASTAnalyzer;
