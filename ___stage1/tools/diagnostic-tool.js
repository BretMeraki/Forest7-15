/**
 * Comprehensive Diagnostic Tool
 * 
 * This tool provides Claude with comprehensive diagnostics to prevent false positives
 * and ensure accurate issue reporting.
 */

import { DiagnosticHandlers } from '../modules/diagnostic-handlers.js';
import { ClaudeDiagnosticHelper } from '../utils/claude-diagnostic-helper.js';
import { analyzeErrorPatterns } from '../errors.js';
import { safeAsyncOperation } from '../utils/runtime-safety.js';

export class ComprehensiveDiagnosticTool {
  constructor(dataPersistence, projectManagement, vectorStore) {
    this.dataPersistence = dataPersistence;
    this.projectManagement = projectManagement;
    this.vectorStore = vectorStore;
    
    // Initialize diagnostic components
    this.diagnosticHelper = new ClaudeDiagnosticHelper();
    this.diagnosticHandlers = new DiagnosticHandlers(
      this.diagnosticHelper,
      vectorStore,
      dataPersistence,
      projectManagement
    );
  }
  
  /**
   * Run comprehensive diagnostics with false positive prevention
   */
  async runComprehensiveDiagnostics(args = {}) {
    const report = {
      timestamp: new Date().toISOString(),
      sections: {},
      falsePositivePrevention: {
        enabled: true,
        verificationMethods: ['static_analysis', 'dynamic_import', 'runtime_check']
      }
    };
    
    try {
      // 1. System Health Check (with timeout protection)
      report.sections.systemHealth = await safeAsyncOperation(
        async () => await this.diagnosticHandlers.verifySystemHealth({ include_tests: false }),
        10000,
        { health_status: 'TIMEOUT', message: 'Health check timed out' },
        'System Health Check'
      );
      
      // 2. Error Pattern Analysis
      report.sections.errorPatterns = analyzeErrorPatterns();
      
      // 3. Vector Store Status
      report.sections.vectorStore = await safeAsyncOperation(
        async () => await this.diagnosticHandlers.getVectorStoreStatus({}),
        5000,
        { success: false, message: 'Vector store check timed out' },
        'Vector Store Status'
      );
      
      // 4. Project Status
      report.sections.projectStatus = await this.getProjectStatus();
      
      // 5. Runtime Metrics
      report.sections.runtimeMetrics = this.getRuntimeMetrics();
      
      // 6. False Positive Analysis
      report.sections.falsePositiveAnalysis = await this.analyzeFalsePositives(args.reported_issues || []);
      
      // Generate summary
      report.summary = this.generateSummary(report);
      
      return {
        content: [{
          type: 'text',
          text: this.formatReport(report)
        }],
        report,
        success: true
      };
    } catch (error) {
      console.error('[ComprehensiveDiagnosticTool] Error:', error);
      return {
        content: [{
          type: 'text',
          text: `**Diagnostic Tool Error** ❌\n\nError: ${error.message}\n\nPartial report available.`
        }],
        report,
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get current project status
   */
  async getProjectStatus() {
    try {
      const activeProject = await this.projectManagement.getActiveProject();
      if (!activeProject) {
        return { status: 'NO_ACTIVE_PROJECT' };
      }
      
      return {
        status: 'ACTIVE',
        projectId: activeProject.project_id,
        goalType: activeProject.goal_type,
        created: activeProject.created_at,
        dataPresent: {
          config: !!activeProject.config,
          hta: !!activeProject.hta_data,
          schedule: !!activeProject.daily_schedule
        }
      };
    } catch (error) {
      return { status: 'ERROR', error: error.message };
    }
  }
  
  /**
   * Get runtime metrics
   */
  getRuntimeMetrics() {
    const memory = process.memoryUsage();
    return {
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024),
        rss: Math.round(memory.rss / 1024 / 1024)
      },
      nodeVersion: process.version,
      platform: process.platform
    };
  }
  
  /**
   * Analyze reported issues for false positives
   */
  async analyzeFalsePositives(reportedIssues) {
    if (!reportedIssues || reportedIssues.length === 0) {
      return {
        analyzed: 0,
        falsePositives: 0,
        verifiedIssues: 0,
        needsInvestigation: 0
      };
    }
    
    const results = {
      analyzed: reportedIssues.length,
      falsePositives: 0,
      verifiedIssues: 0,
      needsInvestigation: 0,
      details: []
    };
    
    for (const issue of reportedIssues) {
      let verification;
      
      if (issue.type === 'function_missing') {
        verification = await this.diagnosticHelper.verifyFunctionIssue(
          issue.functionName,
          issue.filePath,
          issue.description
        );
      } else {
        verification = await this.diagnosticHelper.verifySystemIssue(issue.description);
      }
      
      results.details.push(verification);
      
      if (verification.severity === 'LOW') {
        results.falsePositives++;
      } else if (verification.severity === 'HIGH') {
        results.verifiedIssues++;
      } else {
        results.needsInvestigation++;
      }
    }
    
    return results;
  }
  
  /**
   * Generate summary from report sections
   */
  generateSummary(report) {
    const summary = {
      overallStatus: 'HEALTHY',
      issues: [],
      recommendations: []
    };
    
    // Check system health
    if (report.sections.systemHealth?.health_status === 'UNHEALTHY') {
      summary.overallStatus = 'UNHEALTHY';
      summary.issues.push('System health check failed');
    } else if (report.sections.systemHealth?.health_status === 'DEGRADED') {
      summary.overallStatus = 'DEGRADED';
      summary.issues.push('System health degraded');
    }
    
    // Check error patterns
    if (report.sections.errorPatterns?.totalErrors > 10) {
      summary.issues.push(`High error rate: ${report.sections.errorPatterns.totalErrors} errors in last 5 minutes`);
      if (summary.overallStatus === 'HEALTHY') {
        summary.overallStatus = 'DEGRADED';
      }
    }
    
    // Check for possible false positives
    if (report.sections.errorPatterns?.possibleFalsePositives?.length > 0) {
      summary.recommendations.push(
        `Possible false positive patterns detected: ${report.sections.errorPatterns.possibleFalsePositives.join(', ')}`
      );
    }
    
    // Check vector store
    if (!report.sections.vectorStore?.success) {
      summary.issues.push('Vector store not healthy');
    }
    
    // Check memory usage
    const memoryUsage = report.sections.runtimeMetrics?.memory;
    if (memoryUsage && memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      summary.issues.push('High memory usage (>90%)');
      summary.recommendations.push('Consider restarting the server to free memory');
    }
    
    // Add general recommendations
    if (summary.overallStatus === 'HEALTHY') {
      summary.recommendations.push('System is operating normally');
    }
    
    return summary;
  }
  
  /**
   * Format report for display
   */
  formatReport(report) {
    let text = '**🔍 Comprehensive Diagnostic Report**\n\n';
    text += `**Generated**: ${report.timestamp}\n\n`;
    
    // Summary
    const summary = report.summary;
    const statusEmoji = summary.overallStatus === 'HEALTHY' ? '✅' : 
                       summary.overallStatus === 'DEGRADED' ? '🟡' : '🔴';
    
    text += `**Overall Status**: ${statusEmoji} ${summary.overallStatus}\n\n`;
    
    if (summary.issues.length > 0) {
      text += '**Issues Detected**:\n';
      summary.issues.forEach(issue => text += `• ${issue}\n`);
      text += '\n';
    }
    
    // System Health
    if (report.sections.systemHealth) {
      const health = report.sections.systemHealth;
      text += `**System Health**: ${health.health_status || 'Unknown'}\n`;
      if (health.success_rate !== undefined) {
        text += `• Success Rate: ${Math.round(health.success_rate * 100)}%\n`;
      }
      text += '\n';
    }
    
    // Error Patterns
    if (report.sections.errorPatterns) {
      const errors = report.sections.errorPatterns;
      text += `**Error Analysis**:\n`;
      text += `• Recent Errors: ${errors.totalErrors}\n`;
      if (errors.possibleFalsePositives.length > 0) {
        text += `• Possible False Positives: ${errors.possibleFalsePositives.join(', ')}\n`;
      }
      text += '\n';
    }
    
    // False Positive Analysis
    if (report.sections.falsePositiveAnalysis && report.sections.falsePositiveAnalysis.analyzed > 0) {
      const fp = report.sections.falsePositiveAnalysis;
      text += `**False Positive Analysis**:\n`;
      text += `• Issues Analyzed: ${fp.analyzed}\n`;
      text += `• False Positives: ${fp.falsePositives}\n`;
      text += `• Verified Issues: ${fp.verifiedIssues}\n`;
      text += `• Needs Investigation: ${fp.needsInvestigation}\n\n`;
    }
    
    // Runtime Metrics
    if (report.sections.runtimeMetrics) {
      const metrics = report.sections.runtimeMetrics;
      text += `**Runtime Metrics**:\n`;
      text += `• Uptime: ${Math.round(metrics.uptime / 60)} minutes\n`;
      text += `• Memory: ${metrics.memory.heapUsed}MB / ${metrics.memory.heapTotal}MB\n`;
      text += `• Platform: ${metrics.platform} (${metrics.nodeVersion})\n\n`;
    }
    
    // Recommendations
    if (summary.recommendations.length > 0) {
      text += '**Recommendations**:\n';
      summary.recommendations.forEach(rec => text += `• ${rec}\n`);
    }
    
    text += '\n**False Positive Prevention**: ✅ Enabled\n';
    text += 'All diagnostics include verification to prevent false positives.';
    
    return text;
  }
}

export default ComprehensiveDiagnosticTool;
