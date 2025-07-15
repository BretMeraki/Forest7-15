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

async function fixStringIssues(filePath) {
  try {
    console.log(`🔧 Fixing string issues in ${filePath}...`);
    
    // Read the content as buffer first
    const buffer = await fs.readFile(filePath);
    let content = buffer.toString('utf8');
    
    // First fix any remaining HTML entities
    content = content.replace(/\u0026amp;/g, '\u0026');
    content = content.replace(/\u0026gt;/g, '\u003e');
    content = content.replace(/\u0026lt;/g, '\u003c');
    content = content.replace(/\u0026quot;/g, '"');
    content = content.replace(/\u0026apos;/g, "'");
    content = content.replace(/\u0026#39;/g, "'");
    content = content.replace(/\u0026#x27;/g, "'");
    content = content.replace(/\u0026#x2F;/g, "/");
    content = content.replace(/\u0026#x3D;/g, "=");
    
    // Fix malformed template literals
    // Look for patterns like: `...${...}...`
    // and ensure they're properly escaped
    
    // Fix arrow functions in template literals
    content = content.replace(/=\s*\u003e/g, ' =\u003e ');
    
    // Fix template literals with potential issues
    // Replace problematic sequences that might cause unterminated strings
    content = content.replace(/`([^`]*?)\n\n\${/g, '`$1\n\n${');
    content = content.replace(/\${([^}]*?)}([^`]*?)`/g, '${$1}$2`');
    
    // Fix specific patterns that might cause issues
    content = content.replace(/\n\n\${claudeContextSnippet}/g, '\n\n${claudeContextSnippet}');
    content = content.replace(/\n\nEXISTING PROJECTS TO DISPLAY/g, '\n\nEXISTING PROJECTS TO DISPLAY');
    
    // Fix template literal with complex interpolation
    content = content.replace(/`([^`]*?)\${userContext\.hasExistingProjects ? `([^`]*?)` : '([^']*?)'}/g, '`$1${userContext.hasExistingProjects ? `$2` : `$3`}');
    
    // Fix nested template literals
    content = content.replace(/`([^`]*?)\${([^}]*?)\s*\?\s*`([^`]*?)`([^}]*?)}/g, '`$1${$2 ? `$3`$4}');

    // Ensure proper closing of template literals
    const lines = content.split('\n');
    let inTemplateLiteral = false;
    let templateLiteralDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Count backticks to track template literal state
      const backticks = (line.match(/`/g) || []).length;
      if (backticks % 2 === 1) {
        inTemplateLiteral = !inTemplateLiteral;
      }
      
      // If we're in a template literal and the line ends without proper continuation
      if (inTemplateLiteral && !line.endsWith('\') && !line.includes('`')) {
        // Check if this might be causing the unterminated string issue
        if (line.includes('${') && !line.includes('}')) {
          // This might be a problematic line - ensure it's properly formatted
          lines[i] = line.replace(/\${([^}]*?)$/, '${$1}');
        }
      }
    }
    
    content = lines.join('\n');
    
    // Write the fixed content back
    await fs.writeFile(filePath, content, { encoding: 'utf8' });
    
    console.log(`✅ Fixed string issues in ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive String Issues Fix...\n');
  
  for (const filePath of FILES_TO_FIX) {
    await fixStringIssues(filePath);
  }
  
  console.log('\n🎉 Comprehensive string fix complete!');
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
