# Technology Stack

## Runtime & Language
- **Node.js**: ES Modules (type: "module" in package.json)
- **JavaScript**: Modern ES2020+ syntax with ESNext modules
- **TypeScript**: Configuration available but primarily JavaScript codebase

## Core Dependencies
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **@babel/parser & @babel/traverse**: AST parsing and traversal
- **sqlite3**: Vector database storage
- **node-fetch**: HTTP client for external services
- **ws**: WebSocket support

## Testing & Quality
- **Jest**: Primary testing framework with ES module support
- **NYC**: Code coverage reporting (100% coverage targets)
- **Mocha**: Additional testing support

## Architecture Patterns
- **ES Module Architecture**: All imports use .js extensions
- **Local MCP Implementations**: Custom ES module replacements for SDK compatibility
- **Consolidated Module System**: Core logic in ___stage1/modules/
- **Vector Intelligence**: Qdrant primary, LocalJSON fallback
- **Circuit Breaker Pattern**: For external service reliability

## Common Commands

### Development
```bash
# Start server (main entry point)
npm start
# or directly
node ___stage1/forest-mcp-server.js

# Start with memory optimization
npm run start:optimized

# Development mode with blueprint generation
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:golden-path
npm run test:task-scorer

# Coverage reporting
npm run coverage

# Validation tests
node ___stage1/run_tests.js
node ___stage1/validate_consolidation.js
```

### Memory & Performance
```bash
# Monitor memory usage
npm run memory:monitor

# Analyze memory with inspector
npm run memory:analyze

# Check embedding cache stats
npm run cache:stats
```

### Diagnostics
```bash
# Verify diagnostic tools
npm run verify:diagnostics
npm run test:diagnostics
```

## Environment Variables
- **FOREST_DATA_DIR**: Data storage directory (default: .forest-data)
- **FOREST_VECTOR_PROVIDER**: Vector provider (sqlitevec/qdrant)
- **DEBUG_CONTEXT**: Enable debug logging
- **LOG_LEVEL**: Logging verbosity