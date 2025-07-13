import { getToolList } from './modules/consolidated-tool-definitions.js';

const tools = getToolList();
console.log('Total tools defined:', tools.length);
console.log('\nTool names:');
tools.forEach((tool, i) => console.log(`${i+1}. ${tool.name}`));