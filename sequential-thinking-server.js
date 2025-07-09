// Official entry point for Sequential Thinking MCP Server
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'servers', 'sequentialthinking', 'dist', 'index.js');

const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'servers', 'sequentialthinking'),
});

child.on('error', (err) => {
  console.error('Failed to start Sequential Thinking MCP Server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Sequential Thinking MCP Server exited with code ${code}`);
  }
}); 