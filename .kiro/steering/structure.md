# Project Structure

## Root Directory Organization
```
7-2forest/
├── ___stage1/                 # Main consolidated codebase (primary)
├── modules/                   # Legacy module structure (deprecated)
├── servers/                   # Additional server implementations
├── utils/                     # Shared utility functions
├── test-data/                 # Test fixtures and sample data
├── .forest-data/              # Runtime data storage
├── .forest-vectors/           # Vector database files
├── node_modules/              # Dependencies
└── package.json               # Project configuration
```

## Core Architecture (___stage1/)

### Entry Points
- **`forest-mcp-server.js`** - Main MCP server entry point
- **`core-server.js`** - Consolidated server with all modules
- **`core-initialization.js`** - Startup validation and health checks

### Local MCP Implementation
- **`local-mcp-server.js`** - ES module Server replacement
- **`local-stdio-transport.js`** - Working stdio transport layer
- **`local-mcp-client.js`** - Client and transport implementations
- **`local-mcp-types.js`** - Schema type definitions

### Core Modules (___stage1/modules/)
- **`enhanced-hta-core.js`** - HTA intelligence and tree building
- **`task-strategy-core.js`** - Task selection and strategy evolution
- **`data-persistence.js`** - File operations and caching
- **`project-management.js`** - Project lifecycle management
- **`mcp-core.js`** - MCP tool definitions and handlers
- **`memory-sync.js`** - Memory operations and constants
- **`core-intelligence.js`** - Reasoning and analysis
- **`schemas.js`** - Domain-agnostic intelligence schemas

### Specialized Modules
- **`vector-providers/`** - Vector database implementations
- **`ambiguous-desires/`** - Goal clarification system
- **`__tests__/`** - Module-specific tests

### Utilities (___stage1/utils/)
- **`claude-context-builder.js`** - RAG context generation
- **`tool-schemas.js`** - MCP tool validation
- **`embedding-service.js`** - Vector embedding operations
- **`diagnostic-verifier.js`** - System health checks

## Data Organization

### Runtime Data (.forest-data/)
- **Project workspaces** - Isolated project data
- **HTA trees** - Hierarchical task analysis structures
- **Vector indices** - Semantic search data
- **Cache files** - Performance optimization

### Configuration Files
- **`mcp-config-*.json`** - MCP server configurations
- **`jest.config.cjs`** - Test configuration
- **`tsconfig.json`** - TypeScript settings
- **`.nycrc`** - Coverage reporting config

## Naming Conventions

### Files
- **kebab-case** for filenames (`enhanced-hta-core.js`)
- **PascalCase** for class files when exported as classes
- **camelCase** for utility functions

### MCP Tools
- All tools suffixed with `_forest` (e.g., `create_project_forest`)
- Descriptive action-based naming

### Modules
- **Core modules**: Essential system functionality
- **Enhanced modules**: Advanced AI-powered features
- **Utility modules**: Helper functions and services

## Import Patterns
- **ES Modules**: All imports use `.js` extensions
- **Relative imports**: Use `./` and `../` for local modules
- **Absolute imports**: For external dependencies only
- **Consolidated exports**: Core functionality exported from main modules

## Testing Structure
- **Unit tests**: `__tests__/` directories alongside modules
- **Integration tests**: Root-level test files
- **Validation scripts**: Standalone verification tools
- **Coverage targets**: 90%+ for all metrics