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

async function fixHtmlEntitiesAdvanced(filePath) {
  try {
    console.log(`🔧 Advanced fixing of HTML entities in ${filePath}...`);
    
    // Read as buffer first to handle any encoding issues
    const buffer = await fs.readFile(filePath);
    let content = buffer.toString('utf8');
    
    // Count issues before fix
    const beforeAmp = (content.match(/&amp;/g) || []).length;
    const beforeGt = (content.match(/&gt;/g) || []).length;
    const beforeLt = (content.match(/&lt;/g) || []).length;
    
    console.log(`  Found: ${beforeAmp} &amp;, ${beforeGt} &gt;, ${beforeLt} &lt;`);
    
    // Fix HTML entities with more comprehensive replacement
    content = content.replace(/&amp;/g, '&');
    content = content.replace(/&gt;/g, '>');
    content = content.replace(/&lt;/g, '<');
    content = content.replace(/&quot;/g, '"');
    content = content.replace(/&apos;/g, "'");
    content = content.replace(/&#39;/g, "'");
    content = content.replace(/&#x27;/g, "'");
    content = content.replace(/&#x2F;/g, "/");
    content = content.replace(/&#x3D;/g, "=");
    
    // Additional fixes for arrow functions and comparisons
    content = content.replace(/=\s*&gt;/g, ' => ');
    content = content.replace(/&gt;=\s/g, '>= ');
    content = content.replace(/&lt;=\s/g, '<= ');
    content = content.replace(/&gt;\s/g, '> ');
    content = content.replace(/&lt;\s/g, '< ');
    content = content.replace(/&amp;&amp;/g, '&&');
    
    // Write back with explicit UTF-8 encoding
    await fs.writeFile(filePath, content, { encoding: 'utf8' });
    
    // Verify the fix
    const verifyBuffer = await fs.readFile(filePath);
    const verifyContent = verifyBuffer.toString('utf8');
    const afterAmp = (verifyContent.match(/&amp;/g) || []).length;
    const afterGt = (verifyContent.match(/&gt;/g) || []).length;
    const afterLt = (verifyContent.match(/&lt;/g) || []).length;
    
    console.log(`  After: ${afterAmp} &amp;, ${afterGt} &gt;, ${afterLt} &lt;`);
    
    if (afterAmp === 0 && afterGt === 0 && afterLt === 0) {
      console.log(`  ✅ Successfully fixed ${filePath}`);
    } else {
      console.log(`  ⚠️  Some entities remain in ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Advanced HTML Entities Fix...\n');
  
  for (const filePath of FILES_TO_FIX) {
    await fixHtmlEntitiesAdvanced(filePath);
  }
  
  console.log('\n🎉 Advanced HTML entities fix complete!');
  console.log('\nRunning syntax check to verify fixes...');
  
  // Run syntax check after fixes
  try {
    const { spawn } = await import('child_process');
    const syntaxCheck = spawn('node', ['simple-syntax-check.js'], { stdio: 'inherit' });
    
    syntaxCheck.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Syntax check passed!');
      } else {
        console.log('⚠️  Some syntax issues may remain');
      }
    });
  } catch (error) {
    console.log('Could not run syntax check automatically');
  }
}

main().catch(console.error);
