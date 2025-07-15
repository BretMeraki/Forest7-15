import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Real Web Context Implementation
 * Provides dynamic context about system resources, environment, and project state
 */
export class WebContext {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.lastRefresh = new Map();
    this.projectRoot = this._findProjectRoot();
  }

  /**
   * Find the project root directory
   * @returns {string} Project root path
   */
  _findProjectRoot() {
    let currentDir = __dirname;
    while (currentDir !== '/' && currentDir !== '.') {
      try {
        if (fs.existsSync(join(currentDir, 'package.json')) || 
            fs.existsSync(join(currentDir, '.git'))) {
          return currentDir;
        }
        currentDir = dirname(currentDir);
      } catch (error) {
        break;
      }
    }
    return process.cwd();
  }

  /**
   * Refresh web context if needed
   * @param {string} [resource] - Optional specific resource to refresh
   * @returns {Promise<string>} Context information
   */
  async refreshIfNeeded(resource = 'general') {
    const now = Date.now();
    const lastRefresh = this.lastRefresh.get(resource) || 0;
    
    if (now - lastRefresh < this.cacheTimeout) {
      return this.cache.get(resource) || '';
    }

    try {
      const context = await this._fetchContext(resource);
      this.cache.set(resource, context);
      this.lastRefresh.set(resource, now);
      return context;
    } catch (error) {
      console.warn(`[WebContext] Failed to refresh context for ${resource}:`, error.message);
      return this.cache.get(resource) || '';
    }
  }

  /**
   * Fetch context for a specific resource
   * @param {string} resource - Resource identifier
   * @returns {Promise<string>} Context information
   */
  async _fetchContext(resource) {
    switch (resource) {
      case 'general':
        return this._getGeneralContext();
      case 'learning':
        return this._getLearningContext();
      case 'project':
        return this._getProjectContext();
      case 'system':
        return this._getSystemContext();
      case 'git':
        return this._getGitContext();
      case 'network':
        return this._getNetworkContext();
      default:
        return '';
    }
  }

  /**
   * Get general system context
   * @returns {Promise<string>} General context
   */
  async _getGeneralContext() {
    const context = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      shell: process.env.SHELL || 'unknown',
      user: process.env.USER || process.env.USERNAME || 'unknown',
      home: process.env.HOME || process.env.USERPROFILE || 'unknown',
      pwd: process.cwd(),
      projectRoot: this.projectRoot,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      systemUptime: os.uptime(),
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      hostname: os.hostname(),
      osType: os.type(),
      osRelease: os.release()
    };

    return JSON.stringify(context, null, 2);
  }

  /**
   * Get system-specific context
   * @returns {Promise<string>} System context
   */
  async _getSystemContext() {
    const context = {
      timestamp: new Date().toISOString(),
      cpu: {
        model: os.cpus()[0]?.model || 'unknown',
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        process: process.memoryUsage()
      },
      disk: await this._getDiskInfo(),
      network: await this._getNetworkInterfaces(),
      processes: await this._getProcessInfo()
    };

    return JSON.stringify(context, null, 2);
  }

  /**
   * Get disk information
   * @returns {Promise<Object>} Disk info
   */
  async _getDiskInfo() {
    try {
      if (process.platform === 'darwin') {
        const { stdout } = await execAsync('df -h /');
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          return {
            filesystem: parts[0],
            size: parts[1],
            used: parts[2],
            available: parts[3],
            usePercent: parts[4],
            mountpoint: parts[8] || '/'
          };
        }
      } else if (process.platform === 'linux') {
        const { stdout } = await execAsync('df -h /');
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          return {
            filesystem: parts[0],
            size: parts[1],
            used: parts[2],
            available: parts[3],
            usePercent: parts[4],
            mountpoint: parts[5]
          };
        }
      }
    } catch (error) {
      console.warn('[WebContext] Failed to get disk info:', error.message);
    }
    return { error: 'Unable to retrieve disk information' };
  }

  /**
   * Get network interfaces
   * @returns {Promise<Object>} Network interfaces
   */
  async _getNetworkInterfaces() {
    try {
      const interfaces = os.networkInterfaces();
      const result = {};
      
      for (const [name, addresses] of Object.entries(interfaces)) {
        result[name] = addresses.map(addr => ({
          address: addr.address,
          family: addr.family,
          internal: addr.internal,
          mac: addr.mac
        }));
      }
      
      return result;
    } catch (error) {
      console.warn('[WebContext] Failed to get network interfaces:', error.message);
      return { error: 'Unable to retrieve network information' };
    }
  }

  /**
   * Get process information
   * @returns {Promise<Object>} Process info
   */
  async _getProcessInfo() {
    try {
      const result = {
        pid: process.pid,
        ppid: process.ppid,
        title: process.title,
        argv: process.argv,
        execPath: process.execPath,
        versions: process.versions,
        resourceUsage: process.resourceUsage ? process.resourceUsage() : null
      };
      
      // Get running processes count (if available)
      if (process.platform === 'darwin' || process.platform === 'linux') {
        try {
          const { stdout } = await execAsync('ps aux | wc -l');
          result.totalProcesses = parseInt(stdout.trim()) - 1; // Subtract header
        } catch (error) {
          // Ignore if ps command fails
        }
      }
      
      return result;
    } catch (error) {
      console.warn('[WebContext] Failed to get process info:', error.message);
      return { error: 'Unable to retrieve process information' };
    }
  }

  /**
   * Get Git repository context
   * @returns {Promise<string>} Git context
   */
  async _getGitContext() {
    try {
      const gitInfo = await this._getGitInfo();
      const context = {
        timestamp: new Date().toISOString(),
        repository: gitInfo,
        workingDirectory: process.cwd(),
        projectRoot: this.projectRoot
      };
      
      return JSON.stringify(context, null, 2);
    } catch (error) {
      console.warn('[WebContext] Failed to get git context:', error.message);
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        error: 'Not a git repository or git not available'
      }, null, 2);
    }
  }

  /**
   * Get Git repository information
   * @returns {Promise<Object>} Git info
   */
  async _getGitInfo() {
    try {
      const gitCommands = {
        branch: 'git branch --show-current',
        commit: 'git rev-parse HEAD',
        shortCommit: 'git rev-parse --short HEAD',
        status: 'git status --porcelain',
        remoteUrl: 'git config --get remote.origin.url',
        lastCommit: 'git log -1 --format="%H|%an|%ae|%ad|%s"',
        stashCount: 'git stash list | wc -l',
        tags: 'git tag -l | tail -5'
      };
      
      const results = {};
      
      for (const [key, command] of Object.entries(gitCommands)) {
        try {
          const { stdout } = await execAsync(command, { cwd: this.projectRoot });
          results[key] = stdout.trim();
        } catch (error) {
          results[key] = null;
        }
      }
      
      // Parse last commit info
      if (results.lastCommit) {
        const [hash, author, email, date, message] = results.lastCommit.split('|');
        results.lastCommitInfo = { hash, author, email, date, message };
      }
      
      // Parse status
      if (results.status) {
        const statusLines = results.status.split('\n').filter(line => line.trim());
        results.statusSummary = {
          modified: statusLines.filter(line => line.startsWith(' M')).length,
          added: statusLines.filter(line => line.startsWith('A')).length,
          deleted: statusLines.filter(line => line.startsWith(' D')).length,
          untracked: statusLines.filter(line => line.startsWith('??')).length,
          total: statusLines.length
        };
      }
      
      return results;
    } catch (error) {
      throw new Error(`Git information unavailable: ${error.message}`);
    }
  }

  /**
   * Get network connectivity context
   * @returns {Promise<string>} Network context
   */
  async _getNetworkContext() {
    try {
      const connectivity = await this._checkConnectivity();
      const context = {
        timestamp: new Date().toISOString(),
        connectivity,
        interfaces: await this._getNetworkInterfaces()
      };
      
      return JSON.stringify(context, null, 2);
    } catch (error) {
      console.warn('[WebContext] Failed to get network context:', error.message);
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        error: 'Unable to retrieve network information'
      }, null, 2);
    }
  }

  /**
   * Check network connectivity
   * @returns {Promise<Object>} Connectivity info
   */
  async _checkConnectivity() {
    const tests = [
      { name: 'Google DNS', host: '8.8.8.8', port: 53 },
      { name: 'GitHub', host: 'github.com', port: 443 },
      { name: 'NPM Registry', host: 'registry.npmjs.org', port: 443 }
    ];
    
    const results = {};
    
    for (const test of tests) {
      try {
        if (process.platform === 'darwin' || process.platform === 'linux') {
          const { stdout } = await execAsync(`ping -c 1 -W 3000 ${test.host}`, { timeout: 5000 });
          results[test.name] = { status: 'reachable', details: 'ping successful' };
        } else {
          // Windows
          const { stdout } = await execAsync(`ping -n 1 -w 3000 ${test.host}`, { timeout: 5000 });
          results[test.name] = { status: 'reachable', details: 'ping successful' };
        }
      } catch (error) {
        results[test.name] = { status: 'unreachable', details: error.message };
      }
    }
    
    return results;
  }

  /**
   * Get learning-specific context
   * @returns {Promise<string>} Learning context
   */
  async _getLearningContext() {
    const context = {
      timestamp: new Date().toISOString(),
      environment: {
        platform: process.platform,
        shell: process.env.SHELL || 'unknown',
        editor: process.env.EDITOR || process.env.VISUAL || 'unknown',
        terminal: process.env.TERM || 'unknown'
      },
      learningResources: {
        documentationSites: [
          'MDN Web Docs',
          'Node.js Documentation',
          'Stack Overflow',
          'GitHub',
          'Official Documentation'
        ],
        learningPlatforms: [
          'freeCodeCamp',
          'Codecademy',
          'Khan Academy',
          'Coursera',
          'edX',
          'Udemy'
        ],
        practiceResources: [
          'LeetCode',
          'HackerRank',
          'Codewars',
          'Project Euler',
          'GitHub Projects'
        ]
      },
      developmentTools: {
        available: await this._checkDevelopmentTools(),
        packageManagers: await this._checkPackageManagers()
      },
      commonPatterns: [
        'Read official documentation',
        'Follow interactive tutorials',
        'Practice with coding challenges',
        'Join developer communities',
        'Build real projects',
        'Contribute to open source',
        'Attend meetups and conferences'
      ]
    };

    return JSON.stringify(context, null, 2);
  }

  /**
   * Check available development tools
   * @returns {Promise<Object>} Available tools
   */
  async _checkDevelopmentTools() {
    const tools = ['git', 'node', 'npm', 'yarn', 'docker', 'code', 'vim', 'emacs'];
    const available = {};
    
    for (const tool of tools) {
      try {
        await execAsync(`which ${tool}`, { timeout: 2000 });
        available[tool] = true;
      } catch (error) {
        available[tool] = false;
      }
    }
    
    return available;
  }

  /**
   * Check package managers
   * @returns {Promise<Object>} Package manager info
   */
  async _checkPackageManagers() {
    const managers = ['npm', 'yarn', 'pnpm', 'bun'];
    const info = {};
    
    for (const manager of managers) {
      try {
        const { stdout } = await execAsync(`${manager} --version`, { timeout: 2000 });
        info[manager] = { available: true, version: stdout.trim() };
      } catch (error) {
        info[manager] = { available: false, version: null };
      }
    }
    
    return info;
  }

  /**
   * Get project-specific context
   * @returns {Promise<string>} Project context
   */
  async _getProjectContext() {
    try {
      const projectInfo = await this._getProjectInfo();
      const context = {
        timestamp: new Date().toISOString(),
        projectRoot: this.projectRoot,
        currentDirectory: process.cwd(),
        project: projectInfo,
        capabilities: [
          'Task generation',
          'Progress tracking',
          'Adaptive learning',
          'Goal achievement',
          'Context awareness',
          'System integration'
        ],
        integrations: [
          'Vector databases',
          'LLM services',
          'File systems',
          'MCP protocol',
          'Git repositories',
          'System resources'
        ]
      };
      
      return JSON.stringify(context, null, 2);
    } catch (error) {
      console.warn('[WebContext] Failed to get project context:', error.message);
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        error: 'Unable to retrieve project information'
      }, null, 2);
    }
  }

  /**
   * Get project information
   * @returns {Promise<Object>} Project info
   */
  async _getProjectInfo() {
    try {
      const info = {
        type: 'learning-assistant',
        structure: await this._analyzeProjectStructure(),
        dependencies: await this._getDependencies(),
        scripts: await this._getScripts()
      };
      
      return info;
    } catch (error) {
      throw new Error(`Project analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze project structure
   * @returns {Promise<Object>} Structure analysis
   */
  async _analyzeProjectStructure() {
    try {
      const { stdout } = await execAsync(`find ${this.projectRoot} -type f -name "*.js" -o -name "*.json" -o -name "*.md" | head -20`, { timeout: 5000 });
      const files = stdout.trim().split('\n').filter(file => file.trim());
      
      const structure = {
        totalFiles: files.length,
        jsFiles: files.filter(f => f.endsWith('.js')).length,
        jsonFiles: files.filter(f => f.endsWith('.json')).length,
        mdFiles: files.filter(f => f.endsWith('.md')).length,
        directories: await this._getDirectories()
      };
      
      return structure;
    } catch (error) {
      return { error: 'Unable to analyze project structure' };
    }
  }

  /**
   * Get project directories
   * @returns {Promise<Array>} Directory list
   */
  async _getDirectories() {
    try {
      const { stdout } = await execAsync(`find ${this.projectRoot} -type d -maxdepth 2 | head -10`, { timeout: 3000 });
      return stdout.trim().split('\n').filter(dir => dir.trim());
    } catch (error) {
      return [];
    }
  }

  /**
   * Get project dependencies
   * @returns {Promise<Object>} Dependencies info
   */
  async _getDependencies() {
    try {
      const packageJsonPath = join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      return {
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {}),
        totalDependencies: Object.keys(packageJson.dependencies || {}).length + Object.keys(packageJson.devDependencies || {}).length
      };
    } catch (error) {
      return { error: 'No package.json found or unable to read dependencies' };
    }
  }

  /**
   * Get project scripts
   * @returns {Promise<Object>} Scripts info
   */
  async _getScripts() {
    try {
      const packageJsonPath = join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      return {
        scripts: packageJson.scripts || {},
        scriptCount: Object.keys(packageJson.scripts || {}).length
      };
    } catch (error) {
      return { error: 'No package.json found or unable to read scripts' };
    }
  }

  /**
   * Clear cache for a specific resource or all resources
   * @param {string} [resource] - Optional resource to clear. If not provided, clears all
   */
  clearCache(resource) {
    if (resource) {
      this.cache.delete(resource);
      this.lastRefresh.delete(resource);
    } else {
      this.cache.clear();
      this.lastRefresh.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      cachedResources: Array.from(this.cache.keys()),
      cacheTimeout: this.cacheTimeout,
      lastRefreshTimes: Object.fromEntries(this.lastRefresh)
    };
  }

  /**
   * Check if a resource is cached and fresh
   * @param {string} resource - Resource identifier
   * @returns {boolean} True if cached and fresh
   */
  isCached(resource) {
    const now = Date.now();
    const lastRefresh = this.lastRefresh.get(resource) || 0;
    return this.cache.has(resource) && (now - lastRefresh) < this.cacheTimeout;
  }
}
