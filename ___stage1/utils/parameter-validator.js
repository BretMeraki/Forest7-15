/**
 * Parameter Validation Utility
 * Standardizes parameter validation across all Forest modules
 */

/**
 * Extract and validate project ID from various input formats
 * @param {string|object} input - The input that should contain a project ID
 * @param {string} methodName - Name of the calling method for logging
 * @returns {string|null} - The extracted project ID or null if invalid
 */
export function extractProjectId(input, methodName = 'Unknown') {
  // If already a string, return it
  if (typeof input === 'string' && input.trim() !== '') {
    return input;
  }
  
  // If it's an object, try to extract project_id or projectId
  if (typeof input === 'object' && input !== null) {
    const projectId = input.project_id || input.projectId || input.id;
    if (typeof projectId === 'string' && projectId.trim() !== '') {
      return projectId;
    }
    
    // Log the issue for debugging
    console.error(`[${methodName}] Received object without valid project ID:`, {
      keys: Object.keys(input).slice(0, 10),
      type: input.constructor.name
    });
  }
  
  return null;
}

/**
 * Extract and validate project ID from args object with fallback to active project
 * @param {object} args - Arguments object that may contain project_id
 * @param {object} projectManagement - ProjectManagement instance for fallback
 * @param {string} methodName - Name of the calling method for logging
 * @returns {Promise<string>} - The validated project ID
 */
export async function requireProjectId(args, projectManagement, methodName = 'Unknown') {
  // Try to extract from args
  const projectId = extractProjectId(args, methodName) || 
                   extractProjectId(args?.project_id, methodName) ||
                   extractProjectId(args?.projectId, methodName);
  
  if (projectId) {
    return projectId;
  }
  
  // Fallback to active project
  try {
    const activeProject = await projectManagement.requireActiveProject();
    if (activeProject?.projectId) {
      console.error(`[${methodName}] Using active project as fallback: ${activeProject.projectId}`);
      return activeProject.projectId;
    }
  } catch (error) {
    console.error(`[${methodName}] Failed to get active project fallback:`, error.message);
  }
  
  throw new Error(`No valid project ID found. Please provide project_id parameter or ensure an active project is set.`);
}

/**
 * Validate and extract common parameters from args
 * @param {object} args - Arguments object
 * @param {object} options - Validation options
 * @returns {object} - Validated parameters
 */
export function validateCommonArgs(args, options = {}) {
  const {
    requireProjectId: needProjectId = false,
    requireGoal = false,
    requireFeedback = false,
    methodName = 'Unknown'
  } = options;
  
  const result = {
    projectId: null,
    goal: null,
    feedback: null,
    pathName: null,
    context: null
  };
  
  // Extract project ID
  if (needProjectId) {
    result.projectId = extractProjectId(args, methodName);
    if (!result.projectId) {
      throw new Error(`Missing required project_id parameter in ${methodName}`);
    }
  } else {
    result.projectId = extractProjectId(args, methodName);
  }
  
  // Extract goal
  result.goal = args?.goal || args?.ambiguous_goal || args?.original_goal || null;
  if (requireGoal && !result.goal) {
    throw new Error(`Missing required goal parameter in ${methodName}`);
  }
  
  // Extract feedback
  result.feedback = args?.feedback || args?.response || args?.user_input || null;
  if (requireFeedback && !result.feedback) {
    throw new Error(`Missing required feedback parameter in ${methodName}`);
  }
  
  // Extract other common parameters
  result.pathName = args?.path_name || args?.pathName || null;
  result.context = args?.context || null;
  
  return result;
}

/**
 * Normalize boolean parameters that might come as strings
 * @param {any} value - The value to normalize
 * @param {boolean} defaultValue - Default value if undefined
 * @returns {boolean} - Normalized boolean value
 */
export function normalizeBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return Boolean(value);
}

/**
 * Validate numeric parameters with range checking
 * @param {any} value - The value to validate
 * @param {object} options - Validation options
 * @returns {number} - Validated number
 */
export function validateNumber(value, options = {}) {
  const {
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    defaultValue = 0,
    methodName = 'Unknown'
  } = options;
  
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Invalid number value in ${methodName}: ${value}`);
  }
  
  if (num < min || num > max) {
    throw new Error(`Number ${num} out of range [${min}, ${max}] in ${methodName}`);
  }
  
  return num;
}

/**
 * Validate string parameters with length checking
 * @param {any} value - The value to validate
 * @param {object} options - Validation options
 * @returns {string} - Validated string
 */
export function validateString(value, options = {}) {
  const {
    minLength = 0,
    maxLength = Number.POSITIVE_INFINITY,
    required = false,
    defaultValue = '',
    methodName = 'Unknown'
  } = options;
  
  if (value === undefined || value === null) {
    if (required) {
      throw new Error(`Required string parameter missing in ${methodName}`);
    }
    return defaultValue;
  }
  
  const str = String(value).trim();
  
  if (required && str.length === 0) {
    throw new Error(`Required string parameter empty in ${methodName}`);
  }
  
  if (str.length < minLength || str.length > maxLength) {
    throw new Error(`String length ${str.length} out of range [${minLength}, ${maxLength}] in ${methodName}`);
  }
  
  return str;
}