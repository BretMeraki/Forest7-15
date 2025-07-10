/**
 * Diagnostic Handlers - Extracted from core server
 * 
 * Handles system diagnostics, health checks, and utility functions
 */

export class DiagnosticHandlers {
  constructor(diagnosticHelper, chromaDBLifecycle, dataPersistence, projectManagement) {
    this.diagnosticHelper = diagnosticHelper;
    this.chromaDBLifecycle = chromaDBLifecycle;
    this.dataPersistence = dataPersistence;
    this.projectManagement = projectManagement;
  }

  /**
   * Verify overall system health to prevent false positive diagnostics
   */
  async verifySystemHealth(args = {}) {
    try {
      const includeTests = args.include_tests !== false;
      const verification = await this.diagnosticHelper.verifier.runComprehensiveVerification();
      
      // Add test results if requested
      if (includeTests) {
        const testsPass = await this.diagnosticHelper.verifier.verifyCodeExecution('npm test', 'Full test suite');
        verification.verifications.tests_pass = testsPass;
      }
      
      const successCount = Object.values(verification.verifications).filter(v => v).length;
      const totalCount = Object.values(verification.verifications).length;
      const successRate = successCount / totalCount;
      
      let healthStatus = 'HEALTHY';
      let statusEmoji = '✅';
      
      if (successRate < 0.5) {
        healthStatus = 'UNHEALTHY';
        statusEmoji = '🔴';
      } else if (successRate < 0.8) {
        healthStatus = 'DEGRADED';
        statusEmoji = '🟡';
      }
      
      return {
        content: [{
          type: 'text',
          text: `**System Health Verification** ${statusEmoji}\n\n` +
                `**Overall Status**: ${healthStatus}\n` +
                `**Success Rate**: ${Math.round(successRate * 100)}% (${successCount}/${totalCount})\n\n` +
                `**Verification Results**:\n` +
                Object.entries(verification.verifications)
                  .map(([key, value]) => `- ${key}: ${value ? '✅' : '❌'}`)
                  .join('\n') +
                `\n\n**Recommendations**:\n` +
                verification.recommendations.join('\n')
        }],
        health_status: healthStatus,
        success_rate: successRate,
        verifications: verification.verifications
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `**System Health Verification Failed** ❌\n\nError: ${error.message}\n\nThis may indicate a genuine system issue.`
        }],
        error: error.message,
        health_status: 'ERROR'
      };
    }
  }

  /**
   * Verify if a specific function exists before reporting it as missing
   */
  async verifyFunctionExists(args) {
    try {
      const { function_name, file_path } = args;
      
      if (!function_name || !file_path) {
        return {
          content: [{
            type: 'text',
            text: '**Function Verification Error** ❌\n\nBoth function_name and file_path are required.'
          }],
          error: 'Missing required parameters'
        };
      }
      
      const verification = await this.diagnosticHelper.verifyFunctionIssue(
        function_name,
        file_path,
        `Function ${function_name} existence check`
      );
      
      return {
        content: [{
          type: 'text',
          text: `**Function Verification: ${function_name}** 📋\n\n` +
                `**File**: ${file_path}\n` +
                `**Status**: ${verification.severity === 'LOW' ? '✅ EXISTS' : verification.severity === 'HIGH' ? '❌ MISSING' : '🟡 INVESTIGATE'}\n\n` +
                `**Verification Results**:\n` +
                Object.entries(verification.verificationResults)
                  .map(([key, value]) => `- ${key}: ${typeof value === 'boolean' ? (value ? '✅' : '❌') : value}`)
                  .join('\n') +
                `\n\n**Recommendation**: ${verification.recommendation}`
        }],
        function_exists: verification.verificationResults.functionExists,
        severity: verification.severity,
        verification_results: verification.verificationResults
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `**Function Verification Failed** ❌\n\nError: ${error.message}`
        }],
        error: error.message
      };
    }
  }

  /**
   * Run comprehensive diagnostic verification for reported issues
   */
  async runDiagnosticVerification(args) {
    try {
      const { reported_issues = [] } = args;
      
      const report = await this.diagnosticHelper.generateDiagnosticReport(reported_issues);
      
      const summary = report.summary;
      const verificationText = report.issue_verifications.map(v => {
        const statusEmoji = v.severity === 'LOW' ? '✅' : v.severity === 'HIGH' ? '❌' : '🟡';
        return `${statusEmoji} **${v.issue}**\n   ${v.recommendation}`;
      }).join('\n\n');
      
      return {
        content: [{
          type: 'text',
          text: `**Diagnostic Verification Report** 📊\n\n` +
                `**Summary**:\n` +
                `- Total Issues Reported: ${summary.total_issues_reported}\n` +
                `- False Positives: ${summary.false_positives}\n` +
                `- Verified Issues: ${summary.verified_issues}\n` +
                `- Needs Investigation: ${summary.needs_investigation}\n\n` +
                `**Issue Verifications**:\n${verificationText}\n\n` +
                `**System Health**: ${report.system_health?.verifications ? 
                  Object.values(report.system_health.verifications).filter(v => v).length + '/' + 
                  Object.values(report.system_health.verifications).length + ' checks passing' : 'Unknown'}\n\n` +
                `**Recommendations**:\n${report.recommendations.join('\n')}`
        }],
        report,
        false_positive_rate: summary.false_positives / Math.max(1, summary.total_issues_reported)
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `**Diagnostic Verification Failed** ❌\n\nError: ${error.message}`
        }],
        error: error.message
      };
    }
  }

  /**
   * Get system health status with comprehensive checks
   */
  async getHealthStatus() {
    try {
      const fs = await import('fs/promises');
      
      // Check data directory writable
      const dataDir = this.dataPersistence?.dataDir || this.dataPersistence?.baseDir;
      let dataDirWritable = false;
      if (dataDir) {
        try {
          await fs.access(dataDir, fs.constants.W_OK);
          dataDirWritable = true;
        } catch {
          dataDirWritable = false;
        }
      }

      // ChromaDB health check
      let chromaDBHealthy = false;
      let chromaDBStatus = null;
      if (this.chromaDBLifecycle) {
        try {
          chromaDBStatus = await this.chromaDBLifecycle.getHealthStatus();
          chromaDBHealthy = chromaDBStatus.status === 'healthy';
        } catch (error) {
          chromaDBStatus = { status: 'error', reason: error.message };
        }
      }

      const memory = process.memoryUsage();

      return {
        content: [{
          type: 'text',
          text: `**🏥 System Health Status**\n\n` +
                `**Data Directory**: ${dataDirWritable ? '✅ Writable' : '❌ Not Writable'}\n` +
                `**ChromaDB**: ${chromaDBHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n` +
                `**Memory Usage**: ${Math.round(memory.heapUsed / 1024 / 1024)}MB / ${Math.round(memory.heapTotal / 1024 / 1024)}MB\n` +
                `**External Memory**: ${Math.round(memory.external / 1024 / 1024)}MB\n` +
                `**Array Buffers**: ${Math.round(memory.arrayBuffers / 1024 / 1024)}MB\n\n` +
                `**Overall**: ${dataDirWritable && chromaDBHealthy ? '✅ Healthy' : '⚠️ Issues Detected'}\n\n` +
                `**ChromaDB Details**: ${chromaDBStatus ? chromaDBStatus.reason || 'Running normally' : 'Not configured'}`
        }],
        health_summary: {
          overall_healthy: dataDirWritable && chromaDBHealthy,
          data_directory: dataDirWritable,
          chromadb: chromaDBHealthy,
          memory_usage: memory,
          chromadb_status: chromaDBStatus
        }
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `**❌ Health Check Failed**\n\nError: ${error.message}`
        }],
        error: error.message
      };
    }
  }

  /**
   * Debug cache state for troubleshooting
   */
  async debugCacheState(args) {
    try {
      const { project_id, cache_type = 'all' } = args;
      
      let targetProjectId = project_id;
      if (!targetProjectId) {
        const activeProject = await this.projectManagement.getActiveProject();
        if (activeProject && activeProject.project_id) {
          targetProjectId = activeProject.project_id;
        }
      }

      const cacheState = this.dataPersistence.debugCacheState(targetProjectId, cache_type);
      
      return {
        content: [{
          type: 'text',
          text: `**🔍 Cache Debug Information**\n\n` +
                `**Project**: ${targetProjectId || 'All projects'}\n` +
                `**Cache Type**: ${cache_type}\n` +
                `**Timestamp**: ${new Date().toISOString()}\n\n` +
                `**Cache State**:\n` +
                `• Total Entries: ${cacheState.totalEntries}\n` +
                `• Memory Usage: ${cacheState.memoryUsage}\n` +
                `• Hit Rate: ${cacheState.hitRate}%\n` +
                `• Most Recent: ${cacheState.mostRecent || 'None'}\n\n` +
                `**Cache Contents**:\n` +
                Object.entries(cacheState.contents || {})
                  .map(([key, value]) => `• ${key}: ${typeof value === 'object' ? JSON.stringify(value).slice(0, 50) + '...' : value}`)
                  .join('\n') +
                `\n\n**Actions**:\n` +
                `• Use \`emergency_clear_cache_forest\` to clear cache if needed\n` +
                `• Cache is automatically managed but can be cleared for troubleshooting`
        }],
        cache_state: cacheState
      };
    } catch (error) {
      console.error('DiagnosticHandlers.debugCacheState failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**❌ Cache Debug Failed**\n\nError: ${error.message}`
        }],
        error: error.message
      };
    }
  }

  /**
   * Emergency cache clear for troubleshooting
   */
  async emergencyClearCache(args) {
    try {
      const { project_id, clear_all = false } = args;
      
      if (clear_all) {
        // Clear entire cache
        const result = this.dataPersistence.emergencyClearCache();
        return {
          content: [{
            type: 'text',
            text: `**🚨 EMERGENCY CACHE CLEARED**\n\n` +
                  `**Scope**: All cached data\n` +
                  `**Action**: Full cache clear\n` +
                  `**Timestamp**: ${new Date().toISOString()}\n\n` +
                  `All cached data has been cleared. Next data access will reload from disk.`
          }]
        };
      } else if (project_id) {
        // Clear specific project cache
        const result = this.dataPersistence.emergencyClearProjectCache(project_id);
        return {
          content: [{
            type: 'text',
            text: `**🚨 EMERGENCY PROJECT CACHE CLEARED**\n\n` +
                  `**Project**: ${project_id}\n` +
                  `**Timestamp**: ${new Date().toISOString()}\n` +
                  `**Success**: ${result}\n\n` +
                  `Project cache has been cleared. Next access will reload from disk.`
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: `**⚠️ Emergency Cache Clear Usage**\n\n` +
                  `**Options**:\n` +
                  `• \`emergency_clear_cache_forest\` with \`{"project_id": "PROJECT_ID"}\` - Clear specific project\n` +
                  `• \`emergency_clear_cache_forest\` with \`{"clear_all": true}\` - Clear entire cache\n\n` +
                  `Use \`debug_cache_forest\` first to inspect cache state.`
          }]
        };
      }
    } catch (error) {
      console.error('DiagnosticHandlers.emergencyClearCache failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**❌ Emergency Cache Clear Failed**\n\nError: ${error.message}`
        }],
        error: error.message
      };
    }
  }

  /**
   * Get ChromaDB status
   */
  async getChromaDBStatus(args) {
    try {
      if (!this.chromaDBLifecycle) {
        return {
          content: [{
            type: 'text',
            text: '**ChromaDB Not Configured** ℹ️\n\nChromaDB is not enabled for this Forest instance.\n\nVector provider: ' + (process.env.FOREST_VECTOR_PROVIDER || 'sqlitevec')
          }],
          chromadb_enabled: false
        };
      }

      const status = this.chromaDBLifecycle.getStatus();
      const healthStatus = await this.chromaDBLifecycle.getHealthStatus();
      
      let statusText = `**🔧 ChromaDB Server Status**\n\n`;
      
      // Server status
      statusText += `**Server Status**: ${status.isRunning ? '✅ Running' : status.isStarting ? '🔄 Starting' : status.isStopping ? '🛑 Stopping' : '❌ Stopped'}\n`;
      statusText += `**Host**: ${status.host}\n`;
      statusText += `**Port**: ${status.port}\n`;
      statusText += `**Data Directory**: ${status.dataDir}\n`;
      
      if (status.pid) {
        statusText += `**Process ID**: ${status.pid}\n`;
      }
      
      if (status.retryCount > 0) {
        statusText += `**Retry Count**: ${status.retryCount}/${status.maxRetries}\n`;
      }
      
      statusText += `\n`;
      
      // Health status
      statusText += `**Health Status**: ${healthStatus.status === 'healthy' ? '✅ Healthy' : healthStatus.status === 'unhealthy' ? '⚠️ Unhealthy' : '❌ Error'}\n`;
      
      if (healthStatus.lastCheck) {
        statusText += `**Last Health Check**: ${healthStatus.lastCheck.timestamp}\n`;
        if (healthStatus.lastCheck.statusCode) {
          statusText += `**HTTP Status**: ${healthStatus.lastCheck.statusCode}\n`;
        }
        if (healthStatus.lastCheck.error) {
          statusText += `**Error**: ${healthStatus.lastCheck.error}\n`;
        }
      }
      
      if (healthStatus.reason) {
        statusText += `**Reason**: ${healthStatus.reason}\n`;
      }
      
      statusText += `\n`;
      
      // Configuration
      statusText += `**Configuration**\n`;
      statusText += `• Auto-restart: ${this.chromaDBLifecycle.options.enableAutoRestart ? 'Enabled' : 'Disabled'}\n`;
      statusText += `• Health check interval: ${this.chromaDBLifecycle.options.healthCheckInterval}ms\n`;
      statusText += `• Startup timeout: ${this.chromaDBLifecycle.options.startupTimeout}ms\n`;
      statusText += `• Max retries: ${this.chromaDBLifecycle.options.maxRetries}\n\n`;
      
      // Instructions
      statusText += `**Management**\n`;
      statusText += `• Use \`restart_chromadb_forest\` to restart the server\n`;
      statusText += `• ChromaDB starts automatically with Forest and shuts down when Forest stops\n`;
      statusText += `• Server will auto-restart on failures if enabled`;
      
      return {
        content: [{ type: 'text', text: statusText }],
        server_status: status,
        health_status: healthStatus,
        success: true
      };
    } catch (error) {
      console.error('DiagnosticHandlers.getChromaDBStatus failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**❌ ChromaDB Status Check Failed**\n\nError: ${error.message}\n\nChromaDB may not be properly initialized.`
        }],
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Restart ChromaDB server
   */
  async restartChromaDB(args) {
    try {
      if (!this.chromaDBLifecycle) {
        return {
          content: [{
            type: 'text',
            text: '**ChromaDB Not Configured** ℹ️\n\nChromaDB is not enabled for this Forest instance.\n\nVector provider: ' + (process.env.FOREST_VECTOR_PROVIDER || 'sqlitevec')
          }],
          chromadb_enabled: false
        };
      }

      let statusText = `**🔄 Restarting ChromaDB Server...**\n\n`;
      
      const initialStatus = this.chromaDBLifecycle.getStatus();
      statusText += `**Initial Status**: ${initialStatus.isRunning ? 'Running' : 'Stopped'}\n`;
      statusText += `**Port**: ${initialStatus.port}\n\n`;
      
      // Perform restart
      const restartResult = await this.chromaDBLifecycle.restart();
      
      const finalStatus = this.chromaDBLifecycle.getStatus();
      
      statusText += `**Restart Result**: ✅ Success\n`;
      statusText += `**Final Status**: ${finalStatus.isRunning ? '✅ Running' : '⚠️ Not Running'}\n`;
      statusText += `**Process ID**: ${finalStatus.pid || 'Unknown'}\n`;
      statusText += `**Port**: ${finalStatus.port}\n\n`;
      
      if (restartResult && restartResult.status) {
        statusText += `**Details**: ${restartResult.status}\n\n`;
      }
      
      statusText += `**Next Steps**\n`;
      statusText += `• ChromaDB server has been restarted\n`;
      statusText += `• Vector operations should now work normally\n`;
      statusText += `• Use \`get_chromadb_status_forest\` to verify health\n`;
      statusText += `• Use \`get_vectorization_status_forest\` to check vectorization capabilities`;
      
      return {
        content: [{ type: 'text', text: statusText }],
        restart_result: restartResult,
        final_status: finalStatus,
        success: true
      };
    } catch (error) {
      console.error('DiagnosticHandlers.restartChromaDB failed:', error);
      return {
        content: [{
          type: 'text',
          text: `**❌ ChromaDB Restart Failed**\n\nError: ${error.message}\n\nThe server may need manual intervention or there could be a configuration issue.`
        }],
        error: error.message,
        success: false
      };
    }
  }
}
