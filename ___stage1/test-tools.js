import { getToolList } from './modules/consolidated-tool-definitions.js';
import { McpCore } from './modules/mcp-core.js';

console.log('Testing getToolList...');
const tools = getToolList();
console.log('Tools from getToolList:', Array.isArray(tools), 'length:', tools?.length);

console.log('\nTesting McpCore...');
const mcpCore = new McpCore();
const mcpTools = mcpCore.getToolDefinitions();
console.log('Tools from McpCore:', Array.isArray(mcpTools), 'length:', mcpTools?.length);

if (Array.isArray(mcpTools) && mcpTools.length > 0) {
  console.log('First tool:', mcpTools[0].name);
}
