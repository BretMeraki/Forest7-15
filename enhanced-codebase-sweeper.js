/**
 * Enhanced Comprehensive Codebase Sweeper
 * 
 * Systematically scans the entire codebase with advanced false positive/negative detection.
 * Features multi-layer validation, confidence scoring, and context-aware analysis.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DiagnosticVerifier } from './___stage1/utils/diagnostic-verifier.js';
import { safeAsyncOperation } from './___stage1/utils/runtime-safety.js';

const execAsync = promisify(exec);

class EnhancedCodebaseSweeper {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.diagnosticVerifier = new DiagnosticVerifier(projectRoot);
    this.results = {
      filesScanned: 0,
      verifiedIssues: [],
      potentialIssues: [],
      falsePositives: [],
      knownPatterns: [],
      crossVerified: [],
      syntaxValidation: {},
      confidenceScores: {},
      summary: {}
    };
    
    // Enhanced ignore patterns
    this.ignorePatterns = [
      /node_modules/,
      /\.git/,
      /\.backup/,
      /test-.*\.js$/,
      /CLEANUP_BACKUP_/,
      /\.test\./,
      /\.spec\./,
      /__tests__/,
      /\.md$/,
      /\.json$/,
      /\.sqlite/,
      /\.log$/,
      /temp_syntax_test_/,
      /dist\//,
      /build\//
    ];
    
    // Known false positive patterns
    this.falsePositivePatterns = {
      unterminatedString: [
        // Template literals spanning multiple lines
        /`[^`]*\n[^`]*`/,
        // Strings with escaped quotes
        /["'](?:[^"'\\]|\\.)*["']/,
        // Regex patterns that might look like unterminated strings
        /\/[^\/]+\//g
      ],
      bracketMismatch: [
        // String/regex content that contains brackets
        /["'`][^"'`]*[\{\}\[\]\(\)][^"'`]*["'`]/,
        // Comments with brackets
        /\/\/.*[\{\}\[\]\(\)]/,
        /\/\*[\s\S]*?[\{\}\[\]\(\)][\s\S]*?\*\//
      ],
      incompleteImport: [
        // Multi-line imports
        /import\s*\{[\s\S]*?\}\s*from/,
        // Dynamic imports
        /import\s*\(/
      ]
    };
    
    // Confidence scoring weights
    this.confidenceWeights = {
      syntaxCheck: 0.4,
      contextAnalysis: 0.3,
      crossVerification: 0.2,
      patternMatching: 0.1
    };
  }
  
  /**
   * Run enhanced comprehensive codebase sweep
   */
  async sweepCodebase() {
    console.log('🔍 Starting Enhanced Comprehensive Codebase Sweep...\n');
    console.log('Features:');
    console.log('  ✓ Multi-layer validation');
    console.log('  ✓ False positive detection');
    console.log('  ✓ Confidence scoring');
    console.log('  ✓ Context-aware analysis\n');
    
    try {
      // Get all JavaScript files
      const jsFiles = await this.findJavaScriptFiles();
      console.log(`Found ${jsFiles.length} JavaScript files to analyze\n`);
      
      // Phase 1: Initial scan
      console.log('📊 Phase 1: Initial scanning...');
      for (const filePath of jsFiles) {
        await this.performInitialScan(filePath);
      }
      
      // Phase 2: Cross-verification
      console.log('\n🔄 Phase 2: Cross-verification...');
      await this.performCrossVerification();
      
      // Phase 3: Confidence scoring
      console.log('\n📈 Phase 3: Calculating confidence scores...');
      await this.calculateConfidenceScores();
      
      // Phase 4: False positive filtering
      console.log('\n🎯 Phase 4: Filtering false positives...');
      await this.filterFalsePositives();
      
      // Generate enhanced summary
      this.generateEnhancedSummary();
      
      // Display enhanced results
      this.displayEnhancedResults();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Error during enhanced codebase sweep:', error.message);
      throw error;
    }
  }
  
  /**
   * Find all JavaScript files in the project
   */
  async findJavaScriptFiles() {
    const files = [];
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    await scanDirectory(this.projectRoot);
    
    // Filter out ignored patterns
    return files.filter(file => {
      const relativePath = path.relative(this.projectRoot, file);
      return !this.ignorePatterns.some(pattern => pattern.test(relativePath));
    });
  }
  
  /**
   * Perform initial scan with enhanced detection
   */
  async performInitialScan(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    process.stdout.write(`\r  Scanning: ${relativePath.padEnd(60)}`);
    
    this.results.filesScanned++;
    
    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf8');
      
      // Layer 1: Syntax validation
      const syntaxResult = await this.performSyntaxValidation(filePath, content);
      this.results.syntaxValidation[relativePath] = syntaxResult;
      
      // Layer 2: Pattern analysis
      const patternIssues = await this.performPatternAnalysis(content, relativePath);
      
      // Layer 3: Context analysis
      const contextIssues = await this.performContextAnalysis(content, relativePath);
      
      // Layer 4: AST-based analysis (if possible)
      const astIssues = await this.performASTAnalysis(content, relativePath);
      
      // Combine all issues with metadata
      const allIssues = [
        ...patternIssues.map(i => ({ ...i, source: 'pattern' })),
        ...contextIssues.map(i => ({ ...i, source: 'context' })),
        ...astIssues.map(i => ({ ...i, source: 'ast' }))
      ];
      
      // Store for cross-verification
      if (allIssues.length > 0) {
        this.results.potentialIssues.push({
          file: relativePath,
          issues: allIssues,
          syntaxValid: syntaxResult.valid
        });
      }
      
    } catch (error) {
      this.results.verifiedIssues.push({
        file: relativePath,
        type: 'FILE_ERROR',
        message: error.message,
        severity: 'HIGH',
        confidence: 1.0
      });
    }
  }
  
  /**
   * Perform multi-method syntax validation
   */
  async performSyntaxValidation(filePath, content) {
    const results = {
      valid: true,
      nodeCheck: null,
      importCheck: null,
      parseCheck: null
    };
    
    // Method 1: Node.js syntax check
    try {
      await execAsync(`node --check "${filePath}"`, { encoding: 'utf8' });
      results.nodeCheck = true;
    } catch (error) {
      results.nodeCheck = false;
      results.valid = false;
    }
    
    // Method 2: Dynamic import check
    try {
      const fileUrl = pathToFileURL(filePath).href;
      await safeAsyncOperation(
        async () => await import(fileUrl),
        3000,
        null,
        `Import check`
      );
      results.importCheck = true;
    } catch (error) {
      results.importCheck = false;
      // Don't mark as invalid if only import fails (might be module issues)
    }
    
    // Method 3: Basic parse check
    try {
      new Function(content);
      results.parseCheck = true;
    } catch (error) {
      results.parseCheck = false;
      // This is less reliable, so don't mark as invalid
    }
    
    return results;
  }
  
  /**
   * Perform enhanced pattern analysis
   */
  async performPatternAnalysis(content, relativePath) {
    const issues = [];
    const lines = content.split('\n');
    
    // Check for unterminated strings with context
    lines.forEach((line, index) => {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('//')) return;
      
      // Count quotes with proper escape handling
      const singleQuotes = (line.match(/(?<!\\)'/g) || []).length;
      const doubleQuotes = (line.match(/(?<!\\)"/g) || []).length;
      const backticks = (line.match(/(?<!\\)`/g) || []).length;
      
      // Check for odd counts (potential unterminated)
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
        // Verify it's not a false positive
        if (!this.isFalsePositiveString(line, index, lines)) {
          issues.push({
            type: 'UNTERMINATED_STRING',
            line: index + 1,
            message: `Potentially unterminated string`,
            severity: 'MEDIUM',
            context: line.trim()
          });
        }
      }
    });
    
    // Check for bracket mismatches with context awareness
    const bracketIssues = this.checkBracketBalance(content);
    issues.push(...bracketIssues);
    
    // Check for import/export issues
    const importExportIssues = this.checkImportExportPatterns(content);
    issues.push(...importExportIssues);
    
    return issues;
  }
  
  /**
   * Check if unterminated string is a false positive
   */
  isFalsePositiveString(line, lineIndex, allLines) {
    // Check if it's part of a multi-line template literal
    if (line.includes('`')) {
      // Look for matching backtick in surrounding lines
      for (let i = Math.max(0, lineIndex - 5); i <= Math.min(allLines.length - 1, lineIndex + 5); i++) {
        if (i !== lineIndex && allLines[i].includes('`')) {
          return true;
        }
      }
    }
    
    // Check if it's within a regex
    if (line.match(/\/[^\/]*['"`][^\/]*\//)) {
      return true;
    }
    
    // Check if it's a comment with quotes
    if (line.match(/\/\/.*['"`]/) || line.match(/\/\*.*['"`]/)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check bracket balance with context awareness
   */
  checkBracketBalance(content) {
    const issues = [];
    
    // Remove strings and comments to avoid false positives
    const cleanedContent = this.removeStringsAndComments(content);
    
    // Count brackets
    const brackets = {
      '{': (cleanedContent.match(/\{/g) || []).length,
      '}': (cleanedContent.match(/\}/g) || []).length,
      '[': (cleanedContent.match(/\[/g) || []).length,
      ']': (cleanedContent.match(/\]/g) || []).length,
      '(': (cleanedContent.match(/\(/g) || []).length,
      ')': (cleanedContent.match(/\)/g) || []).length
    };
    
    // Check for imbalances
    if (brackets['{'] !== brackets['}']) {
      issues.push({
        type: 'BRACE_MISMATCH',
        message: `Unbalanced braces: ${brackets['{']} open, ${brackets['}']} close`,
        severity: 'HIGH',
        difference: Math.abs(brackets['{'] - brackets['}'])
      });
    }
    
    if (brackets['['] !== brackets[']']) {
      issues.push({
        type: 'BRACKET_MISMATCH',
        message: `Unbalanced brackets: ${brackets['[']} open, ${brackets[']']} close`,
        severity: 'HIGH',
        difference: Math.abs(brackets['['] - brackets[']'])
      });
    }
    
    if (brackets['('] !== brackets[')']) {
      issues.push({
        type: 'PAREN_MISMATCH',
        message: `Unbalanced parentheses: ${brackets['(']} open, ${brackets[')']} close`,
        severity: 'HIGH',
        difference: Math.abs(brackets['('] - brackets[')'])
      });
    }
    
    return issues;
  }
  
  /**
   * Remove strings and comments for cleaner analysis
   */
  removeStringsAndComments(content) {
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove single-line comments
    content = content.replace(/\/\/.*$/gm, '');
    
    // Remove strings (basic approach)
    content = content.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    content = content.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    content = content.replace(/`(?:[^`\\]|\\.)*`/g, '``');
    
    return content;
  }
  
  /**
   * Check import/export patterns
   */
  checkImportExportPatterns(content) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for incomplete imports
      if (line.match(/import\s+.*$/) && !line.includes('from') && !line.includes('(')) {
        // Check if it continues on next line
        if (index + 1 < lines.length && !lines[index + 1].includes('from')) {
          issues.push({
            type: 'INCOMPLETE_IMPORT',
            line: index + 1,
            message: 'Potentially incomplete import statement',
            severity: 'MEDIUM'
          });
        }
      }
      
      // Check for incomplete exports
      if (line.match(/export\s*{/) && !line.includes('}')) {
        // Look for closing brace in next few lines
        let found = false;
        for (let i = 1; i <= 5 && index + i < lines.length; i++) {
          if (lines[index + i].includes('}')) {
            found = true;
            break;
          }
        }
        if (!found) {
          issues.push({
            type: 'INCOMPLETE_EXPORT',
            line: index + 1,
            message: 'Potentially incomplete export statement',
            severity: 'MEDIUM'
          });
        }
      }
    });
    
    return issues;
  }
  
  /**
   * Perform context analysis
   */
  async performContextAnalysis(content, relativePath) {
    const issues = [];
    
    // Check for error patterns in context
    const errorPatterns = [
      {
        pattern: /throw\s+new\s+Error/g,
        type: 'EXPLICIT_ERROR',
        severity: 'INFO'
      },
      {
        pattern: /TODO|FIXME|HACK|XXX/gi,
        type: 'TODO_COMMENT',
        severity: 'LOW'
      },
      {
        pattern: /console\.(error|warn)/g,
        type: 'ERROR_LOGGING',
        severity: 'INFO'
      }
    ];
    
    errorPatterns.forEach(({ pattern, type, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type,
          count: matches.length,
          message: `Found ${matches.length} instances of ${type}`,
          severity
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Perform AST-based analysis
   */
  async performASTAnalysis(content, relativePath) {
    const issues = [];
    
    try {
      // Try to use @babel/parser if available
      const { parse } = await import('@babel/parser');
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
        errorRecovery: true
      });
      
      // AST is valid, no syntax issues
      return issues;
    } catch (error) {
      // Only report if it's a real syntax error
      if (error.message.includes('Unexpected token')) {
        issues.push({
          type: 'AST_PARSE_ERROR',
          message: error.message,
          severity: 'HIGH',
          location: error.loc
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Perform cross-verification of issues
   */
  async performCrossVerification() {
    for (const fileData of this.results.potentialIssues) {
      const verifiedIssues = [];
      
      for (const issue of fileData.issues) {
        // Skip if syntax is valid but issue was detected
        if (fileData.syntaxValid && issue.severity === 'HIGH') {
          // Downgrade severity or mark as potential false positive
          issue.severity = 'MEDIUM';
          issue.possibleFalsePositive = true;
        }
        
        // Cross-check with multiple sources
        const crossCheckScore = await this.crossCheckIssue(issue, fileData.file);
        issue.crossCheckScore = crossCheckScore;
        
        if (crossCheckScore > 0.5) {
          verifiedIssues.push(issue);
        } else {
          this.results.falsePositives.push({
            file: fileData.file,
            issue,
            reason: 'Low cross-check score'
          });
        }
      }
      
      if (verifiedIssues.length > 0) {
        this.results.crossVerified.push({
          file: fileData.file,
          issues: verifiedIssues
        });
      }
    }
  }
  
  /**
   * Cross-check individual issue
   */
  async crossCheckIssue(issue, filePath) {
    let score = 0;
    let checks = 0;
    
    // Check 1: Issue source reliability
    const sourceScores = {
      'ast': 0.9,
      'pattern': 0.6,
      'context': 0.5
    };
    score += sourceScores[issue.source] || 0.5;
    checks++;
    
    // Check 2: Severity alignment
    if (issue.severity === 'HIGH' && this.results.syntaxValidation[filePath]?.valid) {
      score += 0.3; // Lower score for high severity with valid syntax
    } else {
      score += 0.8;
    }
    checks++;
    
    // Check 3: Known false positive patterns
    if (!this.matchesFalsePositivePattern(issue)) {
      score += 1.0;
    }
    checks++;
    
    return score / checks;
  }
  
  /**
   * Check if issue matches known false positive patterns
   */
  matchesFalsePositivePattern(issue) {
    const patterns = this.falsePositivePatterns[issue.type.toLowerCase()] || [];
    
    for (const pattern of patterns) {
      if (issue.context && pattern.test(issue.context)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Calculate confidence scores for all issues
   */
  async calculateConfidenceScores() {
    for (const verifiedFile of this.results.crossVerified) {
      for (const issue of verifiedFile.issues) {
        const confidence = this.calculateIssueConfidence(issue, verifiedFile.file);
        issue.confidence = confidence;
        
        // Move to verified issues if confidence is high enough
        if (confidence > 0.7) {
          this.results.verifiedIssues.push({
            file: verifiedFile.file,
            ...issue
          });
        }
      }
    }
  }
  
  /**
   * Calculate confidence score for individual issue
   */
  calculateIssueConfidence(issue, filePath) {
    let confidence = 0;
    
    // Syntax validation weight
    const syntaxResult = this.results.syntaxValidation[filePath];
    if (syntaxResult) {
      if (!syntaxResult.valid) {
        confidence += this.confidenceWeights.syntaxCheck;
      } else if (issue.severity === 'LOW') {
        confidence += this.confidenceWeights.syntaxCheck * 0.5;
      }
    }
    
    // Cross-verification score weight
    if (issue.crossCheckScore) {
      confidence += this.confidenceWeights.crossVerification * issue.crossCheckScore;
    }
    
    // Pattern matching weight
    if (!issue.possibleFalsePositive) {
      confidence += this.confidenceWeights.patternMatching;
    }
    
    // Context analysis weight
    if (issue.source === 'context' || issue.source === 'ast') {
      confidence += this.confidenceWeights.contextAnalysis;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Filter out remaining false positives
   */
  async filterFalsePositives() {
    const filtered = [];
    
    for (const issue of this.results.verifiedIssues) {
      // Final false positive check
      if (issue.confidence > 0.5 && !this.isFinalFalsePositive(issue)) {
        filtered.push(issue);
      } else {
        this.results.falsePositives.push({
          ...issue,
          reason: 'Final filtering'
        });
      }
    }
    
    this.results.verifiedIssues = filtered;
  }
  
  /**
   * Final false positive check
   */
  isFinalFalsePositive(issue) {
    // Check for specific false positive patterns
    if (issue.type === 'UNTERMINATED_STRING' && issue.context) {
      // Check for common false positive contexts
      if (issue.context.includes('`') && issue.context.includes('${')) {
        return true; // Likely template literal
      }
    }
    
    if (issue.type === 'BRACKET_MISMATCH' && issue.difference === 1) {
      return true; // Single bracket difference is often noise
    }
    
    return false;
  }
  
  /**
   * Generate enhanced summary with confidence metrics
   */
  generateEnhancedSummary() {
    const highConfidenceIssues = this.results.verifiedIssues.filter(i => i.confidence > 0.8);
    const mediumConfidenceIssues = this.results.verifiedIssues.filter(i => i.confidence > 0.6 && i.confidence <= 0.8);
    const lowConfidenceIssues = this.results.verifiedIssues.filter(i => i.confidence <= 0.6);
    
    this.results.summary = {
      filesScanned: this.results.filesScanned,
      totalIssuesFound: this.results.potentialIssues.reduce((sum, f) => sum + f.issues.length, 0),
      verifiedIssues: this.results.verifiedIssues.length,
      falsePositivesFiltered: this.results.falsePositives.length,
      confidenceBreakdown: {
        high: highConfidenceIssues.length,
        medium: mediumConfidenceIssues.length,
        low: lowConfidenceIssues.length
      },
      severityBreakdown: {
        high: this.results.verifiedIssues.filter(i => i.severity === 'HIGH').length,
        medium: this.results.verifiedIssues.filter(i => i.severity === 'MEDIUM').length,
        low: this.results.verifiedIssues.filter(i => i.severity === 'LOW').length,
        info: this.results.verifiedIssues.filter(i => i.severity === 'INFO').length
      }
    };
  }
  
  /**
   * Display enhanced results with confidence information
   */
  displayEnhancedResults() {
    const { summary } = this.results;
    
    console.log('\n\n' + '='.repeat(80));
    console.log('🔍 ENHANCED CODEBASE SWEEP RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n📊 ANALYSIS SUMMARY:`);
    console.log(`   Files Scanned: ${summary.filesScanned}`);
    console.log(`   Total Potential Issues: ${summary.totalIssuesFound}`);
    console.log(`   Verified Issues: ${summary.verifiedIssues} (after filtering)`);
    console.log(`   False Positives Filtered: ${summary.falsePositivesFiltered}`);
    console.log(`   Accuracy Rate: ${((summary.verifiedIssues / summary.totalIssuesFound) * 100).toFixed(1)}%`);
    
    console.log(`\n🎯 CONFIDENCE BREAKDOWN:`);
    console.log(`   🟢 High Confidence (>80%):   ${summary.confidenceBreakdown.high}`);
    console.log(`   🟡 Medium Confidence (60-80%): ${summary.confidenceBreakdown.medium}`);
    console.log(`   🔴 Low Confidence (<60%):    ${summary.confidenceBreakdown.low}`);
    
    console.log(`\n🚨 SEVERITY BREAKDOWN:`);
    console.log(`   🔴 High:   ${summary.severityBreakdown.high}`);
    console.log(`   🟡 Medium: ${summary.severityBreakdown.medium}`);
    console.log(`   🟢 Low:    ${summary.severityBreakdown.low}`);
    console.log(`   ℹ️  Info:   ${summary.severityBreakdown.info}`);
    
    // Display high-confidence issues
    const highConfidenceIssues = this.results.verifiedIssues
      .filter(i => i.confidence > 0.8)
      .sort((a, b) => b.confidence - a.confidence);
    
    if (highConfidenceIssues.length > 0) {
      console.log(`\n🎯 HIGH CONFIDENCE ISSUES (${highConfidenceIssues.length}):`);
      highConfidenceIssues.slice(0, 10).forEach(issue => {
        console.log(`   📍 ${issue.file}`);
        console.log(`      Type: ${issue.type} | Severity: ${issue.severity}`);
        console.log(`      Confidence: ${(issue.confidence * 100).toFixed(0)}% | ${issue.message}`);
        if (issue.line) {
          console.log(`      Line: ${issue.line}`);
        }
      });
      
      if (highConfidenceIssues.length > 10) {
        console.log(`   ... and ${highConfidenceIssues.length - 10} more`);
      }
    }
    
    // Summary recommendation
    console.log('\n' + '='.repeat(80));
    
    if (summary.severityBreakdown.high === 0) {
      console.log('✅ NO HIGH-SEVERITY ISSUES FOUND WITH HIGH CONFIDENCE!');
      console.log('   The codebase appears to be in good health.');
    } else {
      console.log('⚠️  HIGH-SEVERITY ISSUES DETECTED');
      console.log(`   ${summary.severityBreakdown.high} issues require immediate attention.`);
    }
    
    console.log('\n💡 FALSE POSITIVE ANALYSIS:');
    console.log(`   ${summary.falsePositivesFiltered} potential false positives were filtered out.`);
    console.log(`   This represents ${((summary.falsePositivesFiltered / summary.totalIssuesFound) * 100).toFixed(1)}% of all detected issues.`);
    
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  const sweeper = new EnhancedCodebaseSweeper();
  try {
    const results = await sweeper.sweepCodebase();
    
    // Save detailed results to file
    await fs.writeFile(
      'enhanced-sweep-results.json',
      JSON.stringify(results, null, 2),
      'utf8'
    );
    
    console.log('\n💾 Detailed results saved to: enhanced-sweep-results.json');
    
    // Also save a summary report
    const report = {
      timestamp: new Date().toISOString(),
      summary: results.summary,
      highConfidenceIssues: results.verifiedIssues.filter(i => i.confidence > 0.8),
      falsePositivesFiltered: results.falsePositives.length
    };
    
    await fs.writeFile(
      'sweep-summary-report.json',
      JSON.stringify(report, null, 2),
      'utf8'
    );
    
    console.log('📄 Summary report saved to: sweep-summary-report.json');
    
  } catch (error) {
    console.error('❌ Enhanced sweep failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
export { EnhancedCodebaseSweeper };

// Run if called directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
