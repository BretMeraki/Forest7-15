#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const FILES_TO_FIX = [
  '___stage1/core-server.js',
  '___stage1/modules/diagnostic-handlers.js',
  '___stage1/utils/diagnostic-verifier.js',
  '___stage1/utils/claude-diagnostic-helper.js',
  '___stage1/utils/runtime-safety.js'
];

async function fixHtmlEntities(filePath) {
  try {
    console.log(`Fixing HTML entities in ${filePath}...`);
    
    let content = await fs.readFile(filePath, 'utf8');
    
    // Fix HTML entities
    content = content.replace(/&amp;/g, '&');
    content = content.replace(/&gt;/g, '>');
    content = content.replace(/&lt;/g, '<');
    content = content.replace(/&quot;/g, '"');
    content = content.replace(/&apos;/g, "'");
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🔧 Starting HTML entities fix...\n');
  
  for (const filePath of FILES_TO_FIX) {
    await fixHtmlEntities(filePath);
  }
  
  console.log('\n✅ HTML entities fix complete!');
}

main().catch(console.error);
