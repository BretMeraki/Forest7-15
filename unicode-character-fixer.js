#!/usr/bin/env node

import fs from 'fs/promises';

const FILES_TO_FIX = [
  '___stage1/core-server.js',
  '___stage1/modules/diagnostic-handlers.js',
  '___stage1/utils/diagnostic-verifier.js',
  '___stage1/utils/claude-diagnostic-helper.js',
  '___stage1/utils/runtime-safety.js'
];

const UNICODE_FIXES = [
  // Fix malformed Unicode characters
  { from: /â€"/g, to: '—' },  // Em dash
  { from: /â€™/g, to: "'" },  // Right single quotation mark
  { from: /â€œ/g, to: '"' },  // Left double quotation mark
  { from: /â€/g, to: '"' },   // Right double quotation mark
  { from: /â€¢/g, to: '•' },  // Bullet point
  { from: /â€¦/g, to: '…' },  // Horizontal ellipsis
  { from: /Â/g, to: '' },     // Non-breaking space issues
  { from: /Ã¢/g, to: '' },    // Other encoding issues
  
  // Fix HTML entities that might have been missed
  { from: /&amp;/g, to: '&' },
  { from: /&gt;/g, to: '>' },
  { from: /&lt;/g, to: '<' },
  { from: /&quot;/g, to: '"' },
  { from: /&apos;/g, to: "'" },
  { from: /&#39;/g, to: "'" },
  { from: /&#x27;/g, to: "'" },
  { from: /&#x2F;/g, to: "/" },
  { from: /&#x3D;/g, to: "=" },
  
  // Fix common template literal issues
  { from: /`([^`]*?)\\n\\n\$\{([^}]+)\}`/g, to: '`$1\\n\\n${$2}`' },
  { from: /`([^`]*?)\\n\$\{([^}]+)\}`/g, to: '`$1\\n${$2}`' },
  
  // Fix arrow functions and operators
  { from: /=\s*â‡'/g, to: ' => ' },
  { from: /â‡'/g, to: '=>' },
  { from: /â‰¥/g, to: '>=' },
  { from: /â‰¤/g, to: '<=' },
  { from: /â‰/g, to: '!=' },
  { from: /â‰¡/g, to: '===' },
  { from: /â‰¢/g, to: '!==' },
  
  // Fix any remaining problematic sequences
  { from: /â€/g, to: '"' },
  { from: /â€™/g, to: "'" },
  { from: /â€œ/g, to: '"' },
  { from: /â€/g, to: '"' },
  { from: /â€¢/g, to: '•' },
  { from: /â€¦/g, to: '…' },
  { from: /â€"/g, to: '—' },
  { from: /â€"/g, to: '–' },
  
  // Fix specific template literal termination issues
  { from: /`([^`]*?)\\n\\n\$\{([^}]*?)\}`\s*;/g, to: '`$1\\n\\n${$2}`;' },
  { from: /`([^`]*?)\\n\$\{([^}]*?)\}`\s*;/g, to: '`$1\\n${$2}`;' }
];

async function fixUnicodeCharacters(filePath) {
  try {
    console.log(`🔧 Fixing Unicode characters in ${filePath}...`);
    
    // Read file content
    let content = await fs.readFile(filePath, 'utf8');
    
    // Apply all fixes
    let fixCount = 0;
    for (const fix of UNICODE_FIXES) {
      const beforeLength = content.length;
      content = content.replace(fix.from, fix.to);
      const afterLength = content.length;
      if (beforeLength !== afterLength) {
        fixCount++;
      }
    }
    
    // Additional manual fixes for specific problematic patterns
    
    // Fix malformed comments
    content = content.replace(/\/\*\*[\s\S]*?\*\//g, (match) => {
      return match.replace(/â€"/g, '—')
                  .replace(/â€™/g, "'")
                  .replace(/â€œ/g, '"')
                  .replace(/â€/g, '"');
    });
    
    // Fix template literals with malformed characters
    content = content.replace(/`[^`]*`/g, (match) => {
      return match.replace(/â€"/g, '—')
                  .replace(/â€™/g, "'")
                  .replace(/â€œ/g, '"')
                  .replace(/â€/g, '"')
                  .replace(/â€¢/g, '•');
    });
    
    // Fix strings with malformed characters
    content = content.replace(/'[^']*'/g, (match) => {
      return match.replace(/â€"/g, '—')
                  .replace(/â€™/g, "'")
                  .replace(/â€œ/g, '"')
                  .replace(/â€/g, '"');
    });
    
    content = content.replace(/"[^"]*"/g, (match) => {
      return match.replace(/â€"/g, '—')
                  .replace(/â€™/g, "'")
                  .replace(/â€œ/g, '"')
                  .replace(/â€/g, '"');
    });
    
    // Write back the fixed content
    await fs.writeFile(filePath, content, 'utf8');
    
    console.log(`  ✅ Fixed ${fixCount} Unicode issues in ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive Unicode Character Fix...\n');
  
  for (const filePath of FILES_TO_FIX) {
    await fixUnicodeCharacters(filePath);
  }
  
  console.log('\n🎉 Unicode character fix complete!');
  console.log('\nRunning syntax check to verify fixes...');
  
  // Run syntax check
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const result = await execAsync('node simple-syntax-check.js');
    console.log('✅ Syntax check results:');
    console.log(result.stdout);
    
  } catch (error) {
    console.log('⚠️  Syntax check output:');
    console.log(error.stdout || error.message);
  }
}

main().catch(console.error);
