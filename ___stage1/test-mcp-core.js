console.log('Testing direct import...');

async function test() {
  try {
    const module = await import('./modules/mcp-core.js');
    console.log('Imported module:', Object.keys(module));
    
    const { McpCore } = module;
    console.log('McpCore type:', typeof McpCore);
    
    const mcpCore = new McpCore();
    console.log('McpCore instance:', mcpCore);
    
    // Check if getToolList is imported in mcp-core
    console.log('\nChecking getToolList availability...');
    const toolDefsModule = await import('./modules/consolidated-tool-definitions.js');
    const { getToolList } = toolDefsModule;
    console.log('getToolList type:', typeof getToolList);
    console.log('getToolList result:', Array.isArray(getToolList()), getToolList().length);
    
    // Test the method directly
    console.log('\nTesting getToolDefinitions method...');
    console.log('Method exists?', typeof mcpCore.getToolDefinitions);
    const result = mcpCore.getToolDefinitions();
    console.log('Result:', result);
    console.log('Is array?', Array.isArray(result));
    console.log('Length:', result?.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
