/**
 * AST Parser Module
 * Provides AST parsing capabilities with fallback to regex-based parsing
 */

import { createRequire } from 'module';

let babelParser;
let babelTraverse;

try {
  const require = createRequire(import.meta.url);
  babelParser = require('@babel/parser');
  babelTraverse = require('@babel/traverse').default;
} catch (error) {
  console.warn('[ASTParser] Babel parser not available, using fallback regex-based parsing');
}

export class ASTParser {
  constructor() {
    this.supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c'];
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Parse code and extract AST structure
   */
  async parseCode(code, language = 'javascript') {
    // Check cache first
    const cacheKey = `${language}:${this._hash(code)}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.result;
      }
    }

    let result;
    
    // Try Babel parser first for JavaScript/TypeScript
    if (babelParser && (language === 'javascript' || language === 'typescript')) {
      try {
        result = await this._parseBabel(code, language);
      } catch (error) {
        console.warn('[ASTParser] Babel parsing failed, falling back to regex:', error.message);
        result = await this._parseRegex(code, language);
      }
    } else {
      // Use regex-based parsing for other languages or when Babel is unavailable
      result = await this._parseRegex(code, language);
    }
    
    // Cache the result
    this.cache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
  }

  /**
   * Parse using Babel parser
   */
  async _parseBabel(code, language) {
    const parserOptions = {
      sourceType: 'module',
      plugins: [
        'classProperties',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator',
        'decorators-legacy',
        'objectRestSpread',
        'asyncGenerators'
      ],
      allowImportExportEverywhere: true,
      errorRecovery: true
    };

    if (language === 'typescript') {
      parserOptions.plugins.push('typescript');
    }

    const ast = babelParser.parse(code, parserOptions);
    
    const functions = [];
    const classes = [];
    const imports = [];
    const variables = [];
    const methods = [];
    const exports = [];

    babelTraverse(ast, {
      FunctionDeclaration(path) {
        functions.push({
          type: 'function',
          line: path.node.loc?.start?.line || 0,
          name: path.node.id?.name || 'anonymous',
          params: path.node.params.map(p => p.name || '?'),
          async: path.node.async,
          generator: path.node.generator
        });
      },
      ClassDeclaration(path) {
        classes.push({
          type: 'class',
          line: path.node.loc?.start?.line || 0,
          name: path.node.id?.name || 'anonymous',
          superClass: path.node.superClass?.name || null
        });
      },
      ImportDeclaration(path) {
        imports.push({
          type: 'import',
          line: path.node.loc?.start?.line || 0,
          source: path.node.source.value,
          specifiers: path.node.specifiers.map(s => s.local?.name || s.imported?.name || 'default')
        });
      },
      VariableDeclaration(path) {
        path.node.declarations.forEach(decl => {
          variables.push({
            type: 'variable',
            line: path.node.loc?.start?.line || 0,
            name: decl.id?.name || 'unknown',
            kind: path.node.kind
          });
        });
      },
      ClassMethod(path) {
        methods.push({
          type: 'method',
          line: path.node.loc?.start?.line || 0,
          name: path.node.key?.name || 'unknown',
          static: path.node.static,
          kind: path.node.kind
        });
      },
      ExportNamedDeclaration(path) {
        exports.push({
          type: 'export',
          line: path.node.loc?.start?.line || 0,
          specifiers: path.node.specifiers?.map(s => s.exported?.name) || [],
          source: path.node.source?.value || null
        });
      }
    });

    return {
      language,
      functions,
      classes,
      imports,
      variables,
      methods,
      exports,
      lineCount: code.split('\n').length,
      parsed: true,
      parserUsed: 'babel',
      timestamp: Date.now()
    };
  }

  /**
   * Parse using regex patterns (fallback)
   */
  async _parseRegex(code, language) {
    const lines = code.split('\n');
    const functions = [];
    const classes = [];
    const imports = [];
    const variables = [];
    const methods = [];
    const comments = [];
    
    // Language-specific patterns
    const patterns = this._getLanguagePatterns(language);
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Functions
      if (this._matchesPattern(trimmed, patterns.function)) {
        functions.push({
          type: 'function',
          line: index + 1,
          content: trimmed,
          name: this._extractFunctionName(trimmed, language)
        });
      }
      
      // Classes
      if (this._matchesPattern(trimmed, patterns.class)) {
        classes.push({
          type: 'class',
          line: index + 1,
          content: trimmed,
          name: this._extractClassName(trimmed, language)
        });
      }
      
      // Imports
      if (this._matchesPattern(trimmed, patterns.import)) {
        imports.push({
          type: 'import',
          line: index + 1,
          content: trimmed,
          module: this._extractImportModule(trimmed, language)
        });
      }
      
      // Variables
      if (this._matchesPattern(trimmed, patterns.variable)) {
        variables.push({
          type: 'variable',
          line: index + 1,
          content: trimmed,
          name: this._extractVariableName(trimmed, language)
        });
      }
      
      // Methods
      if (this._matchesPattern(trimmed, patterns.method)) {
        methods.push({
          type: 'method',
          line: index + 1,
          content: trimmed,
          name: this._extractMethodName(trimmed, language)
        });
      }
      
      // Comments
      if (this._matchesPattern(trimmed, patterns.comment)) {
        comments.push({
          type: 'comment',
          line: index + 1,
          content: trimmed
        });
      }
    });
    
    return {
      language,
      functions,
      classes,
      imports,
      variables,
      methods,
      comments,
      lineCount: lines.length,
      parsed: true,
      parserUsed: 'regex',
      timestamp: Date.now()
    };
  }

  /**
   * Extract semantic information from AST
   */
  extractSemanticInfo(ast) {
    return {
      functionCount: ast.functions.length,
      classCount: ast.classes.length,
      importCount: ast.imports.length,
      complexity: Math.min(10, ast.functions.length + ast.classes.length)
    };
  }

  /**
   * Analyze code patterns
   */
  analyzePatterns(code, language = 'javascript') {
    // Enhanced pattern analysis
    const patterns = {
      hasAsyncCode: code.includes('async') || code.includes('await'),
      hasErrorHandling: code.includes('try') || code.includes('catch'),
      hasTests: code.includes('test(') || code.includes('describe('),
      hasLoops: code.includes('for') || code.includes('while') || code.includes('forEach'),
      hasConditionals: code.includes('if') || code.includes('switch'),
      hasExports: code.includes('export') || code.includes('module.exports'),
      designPatterns: this._identifyDesignPatterns(code, language)
    };
    
    return patterns;
  }

  /**
   * Get language-specific patterns
   */
  _getLanguagePatterns(language) {
    const patterns = {
      javascript: {
        function: [/^function\s+\w+/, /^const\s+\w+\s*=\s*\(/, /^\w+\s*=\s*function/, /^\w+\s*=\s*\(/],
        class: [/^class\s+\w+/, /^export\s+class\s+\w+/],
        import: [/^import\s+/, /^const\s+.*=\s*require\(/],
        variable: [/^(let|const|var)\s+\w+/, /^\w+\s*=\s*[^=]/],
        method: [/^\s*\w+\s*\(.*\)\s*{/, /^\s*async\s+\w+\s*\(/],
        comment: [/^\/\//, /^\/\*/, /^\*\//]
      },
      python: {
        function: [/^def\s+\w+/, /^async\s+def\s+\w+/],
        class: [/^class\s+\w+/],
        import: [/^import\s+/, /^from\s+.*import/],
        variable: [/^\w+\s*=\s*[^=]/],
        method: [/^\s*def\s+\w+/, /^\s*async\s+def\s+\w+/],
        comment: [/^#/, /^"""/, /^'''/]
      },
      java: {
        function: [/^(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/],
        class: [/^(public|private)?\s*class\s+\w+/],
        import: [/^import\s+/, /^package\s+/],
        variable: [/^(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*[;=]/],
        method: [/^\s*(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/],
        comment: [/^\/\//, /^\/\*/, /^\*\//]
      }
    };
    
    return patterns[language] || patterns.javascript;
  }

  /**
   * Check if line matches any of the given patterns
   */
  _matchesPattern(line, patterns) {
    if (!patterns || !Array.isArray(patterns)) return false;
    return patterns.some(pattern => pattern.test(line));
  }

  /**
   * Extract function name from line
   */
  _extractFunctionName(line, language) {
    const patterns = {
      javascript: [/function\s+(\w+)/, /const\s+(\w+)\s*=/, /(\w+)\s*=\s*function/, /(\w+)\s*=\s*\(/],
      python: [/def\s+(\w+)/, /async\s+def\s+(\w+)/],
      java: [/\w+\s+(\w+)\s*\(/]
    };
    
    const langPatterns = patterns[language] || patterns.javascript;
    for (const pattern of langPatterns) {
      const match = line.match(pattern);
      if (match) return match[1];
    }
    return 'unknown';
  }

  /**
   * Extract class name from line
   */
  _extractClassName(line, language) {
    const patterns = {
      javascript: [/class\s+(\w+)/, /export\s+class\s+(\w+)/],
      python: [/class\s+(\w+)/],
      java: [/class\s+(\w+)/]
    };
    
    const langPatterns = patterns[language] || patterns.javascript;
    for (const pattern of langPatterns) {
      const match = line.match(pattern);
      if (match) return match[1];
    }
    return 'unknown';
  }

  /**
   * Extract import module from line
   */
  _extractImportModule(line, language) {
    const patterns = {
      javascript: [/import.*from\s+['"]([^'"]+)['"]/, /require\(['"]([^'"]+)['"]\)/],
      python: [/import\s+(\w+)/, /from\s+(\w+)\s+import/],
      java: [/import\s+([^;]+);/]
    };
    
    const langPatterns = patterns[language] || patterns.javascript;
    for (const pattern of langPatterns) {
      const match = line.match(pattern);
      if (match) return match[1];
    }
    return 'unknown';
  }

  /**
   * Extract variable name from line
   */
  _extractVariableName(line, language) {
    const patterns = {
      javascript: [/(let|const|var)\s+(\w+)/, /(\w+)\s*=\s*[^=]/],
      python: [/(\w+)\s*=\s*[^=]/],
      java: [/\w+\s+(\w+)\s*[;=]/]
    };
    
    const langPatterns = patterns[language] || patterns.javascript;
    for (const pattern of langPatterns) {
      const match = line.match(pattern);
      if (match) return match[match.length - 1];
    }
    return 'unknown';
  }

  /**
   * Extract method name from line
   */
  _extractMethodName(line, language) {
    return this._extractFunctionName(line, language);
  }

  /**
   * Identify design patterns in code
   */
  _identifyDesignPatterns(code, language) {
    const patterns = [];
    
    // Common patterns
    if (code.includes('singleton') || code.includes('getInstance')) {
      patterns.push('Singleton');
    }
    if (code.includes('factory') || code.includes('Factory')) {
      patterns.push('Factory');
    }
    if (code.includes('observer') || code.includes('Observer')) {
      patterns.push('Observer');
    }
    if (code.includes('strategy') || code.includes('Strategy')) {
      patterns.push('Strategy');
    }
    
    return patterns;
  }

  /**
   * Generate hash for caching
   */
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout
    };
  }
}

export default ASTParser;
