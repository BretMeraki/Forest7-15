/**
 * Mock Babel Parser for environments without @babel/parser package
 * Provides fallback functionality for AST parsing
 */

export function parse(code, options = {}) {
  console.warn('[MockBabelParser] AST parsing mocked - returning empty AST');
  
  // Return a minimal AST structure that won't break the traversal
  return {
    type: 'Program',
    body: [],
    sourceType: options.sourceType || 'module',
    comments: [],
    tokens: []
  };
}

// Mock traverse function
const mockTraverse = (ast, visitors) => {
  console.warn('[MockBabelParser] AST traversal mocked - no actual traversal performed');
  // Don't actually traverse since we have an empty AST
};

// Export both named and default
export default mockTraverse;
export { mockTraverse as traverse };