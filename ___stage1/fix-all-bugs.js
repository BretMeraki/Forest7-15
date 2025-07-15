#!/usr/bin/env node

/**
 * Fix script for bugs 4, 5, and 6
 * - Bug 4: Cache Invalidation Race Conditions
 * - Bug 5: Onboarding Dialogue ID Tracking
 * - Bug 6: Object vs String Parameter Validation
 */

import { promises as fs } from 'fs';
import path from 'path';

async function fixBugs() {
  console.log('🔧 Starting comprehensive bug fixes...\n');
  
  // Bug 4: Fix Cache Invalidation Race Conditions
  console.log('📦 Fixing Bug 4: Cache Invalidation Race Conditions...');
  await fixCacheInvalidation();
  
  // Bug 5: Fix Onboarding Dialogue ID Tracking
  console.log('\n📦 Fixing Bug 5: Onboarding Dialogue ID Tracking...');
  await fixDialogueTracking();
  
  // Bug 6: Fix Object vs String Parameter Validation
  console.log('\n📦 Fixing Bug 6: Object vs String Parameter Validation...');
  await fixParameterValidation();
  
  console.log('\n✅ All fixes applied successfully!');
}

async function fixCacheInvalidation() {
  const dataPersistencePath = '/Users/bretmeraki/Downloads/7-3forest-main/___stage1/modules/data-persistence.js';
  let content = await fs.readFile(dataPersistencePath, 'utf8');
  
  // Fix 1: Add cache invalidation BEFORE atomic write in saveProjectData
  content = content.replace(
    `        // Atomic write with validation
        await this._atomicWriteJSON(filePath, normalizedData);

        // CRITICAL FIX: Invalidate cache BEFORE AND AFTER successful write
        // This prevents race conditions where reads happen between write and cache invalidation
        await this.invalidateProjectCache(projectId);`,
    `        // CRITICAL FIX: Invalidate cache BEFORE write to prevent stale reads
        const cacheKey = \`project:\${projectId}:\${fileName}\`;
        await this.cache.delete(cacheKey);
        await this.invalidateProjectCache(projectId);
        
        // Atomic write with validation
        await this._atomicWriteJSON(filePath, normalizedData);

        // Invalidate cache AFTER successful write as well
        await this.cache.delete(cacheKey);
        await this.invalidateProjectCache(projectId);`
  );
  
  // Fix 2: Add cache invalidation BEFORE atomic write in savePathData
  content = content.replace(
    `        // Atomic write with validation
        await this._atomicWriteJSON(filePath, normalizedData);

        // CRITICAL FIX: Invalidate cache BEFORE AND AFTER successful write
        // This prevents race conditions where reads happen between write and cache invalidation
        await this.invalidateProjectCache(projectId);`,
    `        // CRITICAL FIX: Invalidate cache BEFORE write to prevent stale reads
        const cacheKey = \`path:\${projectId}:\${pathName}:\${fileName}\`;
        await this.cache.delete(cacheKey);
        await this.invalidateProjectCache(projectId);
        
        // Atomic write with validation
        await this._atomicWriteJSON(filePath, normalizedData);

        // Invalidate cache AFTER successful write as well
        await this.cache.delete(cacheKey);
        await this.invalidateProjectCache(projectId);`
  );
  
  // Fix 3: Add cache invalidation BEFORE atomic write in saveGlobalData
  content = content.replace(
    `        await this._atomicWriteJSON(filePath, data);
        
        // Clear cache after successful write
        await this.cache.delete(\`global:\${fileName}\`);`,
    `        // Clear cache BEFORE write to prevent stale reads
        const cacheKey = \`global:\${fileName}\`;
        await this.cache.delete(cacheKey);
        
        await this._atomicWriteJSON(filePath, data);
        
        // Clear cache after successful write as well
        await this.cache.delete(cacheKey);`
  );
  
  await fs.writeFile(dataPersistencePath, content, 'utf8');
  console.log('✅ Cache invalidation race conditions fixed');
}

async function fixDialogueTracking() {
  const clarificationDialoguePath = '/Users/bretmeraki/Downloads/7-3forest-main/___stage1/modules/ambiguous-desires/clarification-dialogue.js';
  let content = await fs.readFile(clarificationDialoguePath, 'utf8');
  
  // Fix 1: Update continueDialogue to save session after each update
  content = content.replace(
    `      session.responses.push(responseData);
      session.currentRound++;

      // Analyze convergence`,
    `      session.responses.push(responseData);
      session.currentRound++;
      
      // Save updated session to persistence
      await this.dialoguePersistence.saveDialogueSession(session);

      // Analyze convergence`
  );
  
  // Fix 2: Add session persistence update before concluding dialogue
  content = content.replace(
    `      // Generate next question based on patterns
      const nextQuestion = this.generateAdaptiveQuestion(session, convergenceAnalysis);
      session.lastQuestion = nextQuestion.text;`,
    `      // Generate next question based on patterns
      const nextQuestion = this.generateAdaptiveQuestion(session, convergenceAnalysis);
      session.lastQuestion = nextQuestion.text;
      
      // Save session state before returning
      await this.dialoguePersistence.saveDialogueSession(session);`
  );
  
  await fs.writeFile(clarificationDialoguePath, content, 'utf8');
  console.log('✅ Dialogue ID tracking fixed');
}

async function fixParameterValidation() {
  const dataPersistencePath = '/Users/bretmeraki/Downloads/7-3forest-main/___stage1/modules/data-persistence.js';
  let content = await fs.readFile(dataPersistencePath, 'utf8');
  
  // Add a helper method for parameter validation
  const helperMethod = `
  /**
   * Validate and extract project ID from various input formats
   * @param {string|object} input - The input that should contain a project ID
   * @param {string} methodName - Name of the calling method for logging
   * @returns {string|null} - The extracted project ID or null if invalid
   */
  _extractProjectId(input, methodName) {
    // If already a string, return it
    if (typeof input === 'string' && input.trim() !== '') {
      return input;
    }
    
    // If it's an object, try to extract project_id or projectId
    if (typeof input === 'object' && input !== null) {
      const projectId = input.project_id || input.projectId || input.id;
      if (typeof projectId === 'string' && projectId.trim() !== '') {
        console.error(\`[\${methodName}] Extracted project ID from object: \${projectId}\`);
        return projectId;
      }
      
      // Log the issue for debugging
      console.error(\`[\${methodName}] Received object without valid project ID:\`, {
        keys: Object.keys(input).slice(0, 10),
        type: input.constructor.name
      });
    }
    
    return null;
  }
`;

  // Insert the helper method after the class declaration
  const classEndIndex = content.indexOf('  async ensureDataDir() {');
  content = content.slice(0, classEndIndex) + helperMethod + '\n' + content.slice(classEndIndex);
  
  // Update all methods to use the helper
  // Fix saveProjectData
  content = content.replace(
    `  async saveProjectData(projectId, fileName, data, transaction = null) {
    // CRITICAL FIX: Validate projectId is a string
    if (!projectId || typeof projectId !== 'string') {
      if (typeof projectId === 'object' && projectId !== null) {
        await this._log('warn', '[DataPersistence] saveProjectData received object instead of projectId string', {
          projectIdType: typeof projectId,
          projectIdKeys: Object.keys(projectId).slice(0, 5),
          fileName,
        });
      }
      throw new Error('projectId must be a non-empty string');
    }`,
    `  async saveProjectData(projectId, fileName, data, transaction = null) {
    // CRITICAL FIX: Validate and extract projectId
    const validProjectId = this._extractProjectId(projectId, 'saveProjectData');
    if (!validProjectId) {
      await this._log('error', '[DataPersistence] saveProjectData received invalid projectId', {
        projectIdType: typeof projectId,
        fileName,
      });
      throw new Error('projectId must be a non-empty string or object with project_id property');
    }
    projectId = validProjectId;`
  );
  
  // Fix loadProjectData
  content = content.replace(
    `  async loadProjectData(projectId, fileName) {
    try {
      // CRITICAL FIX: Validate projectId is a string to prevent path.join errors
      if (!projectId || typeof projectId !== 'string') {
        if (typeof projectId === 'object' && projectId !== null) {
          await this._log('warn', '[DataPersistence] Received object instead of projectId string', {
            projectIdType: typeof projectId,
            projectIdKeys: Object.keys(projectId).slice(0, 5), // Log first 5 keys for debugging
            fileName,
          });
        }
        return null; // Return null instead of throwing error for invalid projectId
      }`,
    `  async loadProjectData(projectId, fileName) {
    try {
      // CRITICAL FIX: Validate and extract projectId
      const validProjectId = this._extractProjectId(projectId, 'loadProjectData');
      if (!validProjectId) {
        await this._log('warn', '[DataPersistence] loadProjectData received invalid projectId', {
          projectIdType: typeof projectId,
          fileName,
        });
        return null; // Return null for invalid projectId
      }
      projectId = validProjectId;`
  );
  
  // Fix savePathData
  content = content.replace(
    `  async savePathData(projectId, pathName, fileName, data, transaction = null) {
    // CRITICAL FIX: Validate projectId is a string
    if (!projectId || typeof projectId !== 'string') {
      if (typeof projectId === 'object' && projectId !== null) {
        await this._log('warn', '[DataPersistence] savePathData received object instead of projectId string', {
          projectIdType: typeof projectId,
          projectIdKeys: Object.keys(projectId).slice(0, 5),
          pathName,
          fileName,
        });
      }
      throw new Error('projectId must be a non-empty string');
    }`,
    `  async savePathData(projectId, pathName, fileName, data, transaction = null) {
    // CRITICAL FIX: Validate and extract projectId
    const validProjectId = this._extractProjectId(projectId, 'savePathData');
    if (!validProjectId) {
      await this._log('error', '[DataPersistence] savePathData received invalid projectId', {
        projectIdType: typeof projectId,
        pathName,
        fileName,
      });
      throw new Error('projectId must be a non-empty string or object with project_id property');
    }
    projectId = validProjectId;`
  );
  
  // Fix loadPathData
  content = content.replace(
    `  async loadPathData(projectId, pathName, fileName) {
    try {
      // CRITICAL FIX: Validate projectId is a string
      if (!projectId || typeof projectId !== 'string') {
        if (typeof projectId === 'object' && projectId !== null) {
          await this._log('warn', '[DataPersistence] loadPathData received object instead of projectId string', {
            projectIdType: typeof projectId,
            projectIdKeys: Object.keys(projectId).slice(0, 5),
            pathName,
            fileName,
          });
        }
        return null; // Return null instead of throwing error for invalid projectId
      }`,
    `  async loadPathData(projectId, pathName, fileName) {
    try {
      // CRITICAL FIX: Validate and extract projectId
      const validProjectId = this._extractProjectId(projectId, 'loadPathData');
      if (!validProjectId) {
        await this._log('warn', '[DataPersistence] loadPathData received invalid projectId', {
          projectIdType: typeof projectId,
          pathName,
          fileName,
        });
        return null; // Return null for invalid projectId
      }
      projectId = validProjectId;`
  );
  
  await fs.writeFile(dataPersistencePath, content, 'utf8');
  console.log('✅ Parameter validation fixed');
}

// Run the fixes
fixBugs().catch(console.error);
