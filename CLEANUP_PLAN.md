# 7-3forest Codebase Cleanup Plan

## 🎯 **OBJECTIVE**
Dramatically reduce codebase size by removing non-essential files while preserving **ALL** runtime critical functionality.

## 📊 **CURRENT STATE**
- **Total Files**: ~1,000+ files
- **Estimated Size**: ~100MB+
- **Redundancy Level**: EXTREMELY HIGH (backup directory + duplicates)
- **Critical Runtime**: ~50-100 files in `___stage1/` directory

## 🔒 **PROTECTED FILES** (NEVER DELETE)

### Core Runtime Infrastructure
```
___stage1/
├── forest-mcp-server.js           # Main server entry point
├── core-initialization.js         # System initialization
├── core-server.js                 # Main server class
├── core-handlers.js              # Request handlers
├── consolidation_tests.js        # Integration tests
├── run_tests.js                  # Test runner
├── line_count_validator.js       # Code validation
└── validate_consolidation.js     # Validation script
```

### Local MCP Implementation (Critical)
```
___stage1/
├── local-mcp-server.js           # ES module Server replacement
├── local-stdio-transport.js      # Transport layer
├── local-mcp-client.js           # Client implementations
└── local-mcp-types.js            # Type definitions
```

### Core Business Logic
```
___stage1/modules/
├── data-persistence.js           # File operations & caching
├── project-management.js         # Project lifecycle
├── hta-core.js                   # HTA intelligence
├── task-strategy-core.js         # Task selection
├── core-intelligence.js          # AI reasoning
├── memory-sync.js                # Memory operations
├── mcp-core.js                   # MCP tool definitions
├── constants.js                  # Configuration
├── schemas.js                    # Data validation
└── stubs/                        # Stub implementations
    ├── cache-manager.js
    ├── sqlite-cache-manager.js
    ├── event-bus.js
    └── web-context.js
```

### Vector Store Integration
```
___stage1/modules/
├── hta-vector-store.js
├── forest-data-vectorization.js
└── vector-providers/
    ├── IVectorProvider.js
    ├── SQLiteVecProvider.js
    ├── LocalJSONProvider.js
    ├── QdrantProvider.js
    └── ChromaDBProvider.js
```

### Essential Utilities
```
___stage1/utils/
├── diagnostic-verifier.js        # Health checks
├── claude-diagnostic-helper.js   # AI integration
├── embedding-service.js          # Embedding service
├── hta-validator.js              # HTA validation
├── hta-guard.js                  # HTA guards
├── hta-hierarchy-utils.js        # HTA utilities
└── file-integrity-checker.js     # File integrity
```

### Configuration Files
```
package.json                      # Dependencies & scripts
tsconfig.json                    # TypeScript config
.gitignore                       # Git ignore rules
```

### User Data (NEVER DELETE)
```
.forest-data/                    # User project data
forest_vectors.sqlite           # Vector database
test-data/                      # Test project data
```

## 🗑️ **FILES TO REMOVE**

### Phase 1: Complete Backup Directory (SAFE TO DELETE)
```
CLEANUP_BACKUP_20250712_153702/  # Entire backup directory
```

### Phase 2: Excessive Documentation (SAFE TO DELETE)
```
# Root level documentation overload
BUG_REPORT.md
CLARIFICATION_DIALOGUE_STATE_FIX.md
CRITICAL_DEPTH_PATCHES.md
DEEPEST_ROOT_CAUSE_FIX_SUMMARY.md
DEPTH_ANALYSIS_SOLUTION.md
DIALOGUE_ID_FIX_IMPLEMENTATION_SUMMARY.md
FOREST_SUITE_CLEAN.md
HTA_TASK_DESCRIPTION_FIX.md
MCP_INTELLIGENCE_BRIDGE_SUCCESS_REPORT.md
MIGRATION_SUMMARY.md
MISSING_CACHE_FUNCTIONS_FIX.md
ONBOARDING_FLOW.md
OOM_FIX_SUMMARY.md
SQLITE_MIGRATION_COMPLETE.md
VECTORIZATION_MIGRATION_COMPLETE.md
VECTORIZED-FOREST-DATA.md
```

### Phase 3: Legacy Archive (SAFE TO DELETE)
```
___archive/                      # Entire legacy directory
```

### Phase 4: Test Data Directories (SAFE TO DELETE)
```
.test-hta-param-fix/
.test-pacing-data/
.test-unique-goal-data/
.snapshots/
```

### Phase 5: IDE & Editor Files (SAFE TO DELETE)
```
.vscode/
.cursor/
```

### Phase 6: Redundant Configuration Files (SAFE TO DELETE)
```
mcp-config-final-working.json
mcp-config-final.json
mcp-config-fixed.json
mcp-config-forest-only.json
mcp-config-simplified.json
mcp-config-working.json
```

### Phase 7: Development Scripts (SAFE TO DELETE)
```
# Root level development files
context-utils.js
create_ai_project.js
create_project.js
health-check.js
hta-analysis-server.js
migrate-to-sqlite.js
sandbox_live_test.js
sequential-thinking-server.js
setup-sqlite-provider.js
simple-test.js
start-forest-optimized.js
tail-error-logger.js
tail-error-logger.cjs
verify-sqlite-provider.js
```

### Phase 8: Results Files (SAFE TO DELETE)
```
function-verification-results.json
health-check-results.json
jest-results.json
sqlite-compatibility-results.json
```

### Phase 9: Redundant Modules (SAFE TO DELETE)
```
modules/                         # Duplicate/legacy modules
utils/                          # Redundant utilities
```

### Phase 10: Test Directories (SAFE TO DELETE)
```
test/                           # Legacy test directory
servers/                        # Alternative server implementations
```

## 🔧 **CLEANUP EXECUTION PLAN**

### Step 1: Backup Validation
```bash
# Validate current system works
cd ___stage1
node run_tests.js
```

### Step 2: Remove Backup Directory
```bash
# Remove the massive backup directory
Remove-Item -Path "CLEANUP_BACKUP_20250712_153702" -Recurse -Force
```

### Step 3: Remove Documentation Overload
```bash
# Remove excessive documentation
$docs = @(
  "BUG_REPORT.md",
  "CLARIFICATION_DIALOGUE_STATE_FIX.md",
  "CRITICAL_DEPTH_PATCHES.md",
  "DEEPEST_ROOT_CAUSE_FIX_SUMMARY.md",
  "DEPTH_ANALYSIS_SOLUTION.md",
  "DIALOGUE_ID_FIX_IMPLEMENTATION_SUMMARY.md",
  "FOREST_SUITE_CLEAN.md",
  "HTA_TASK_DESCRIPTION_FIX.md",
  "MCP_INTELLIGENCE_BRIDGE_SUCCESS_REPORT.md",
  "MIGRATION_SUMMARY.md",
  "MISSING_CACHE_FUNCTIONS_FIX.md",
  "ONBOARDING_FLOW.md",
  "OOM_FIX_SUMMARY.md",
  "SQLITE_MIGRATION_COMPLETE.md",
  "VECTORIZATION_MIGRATION_COMPLETE.md",
  "VECTORIZED-FOREST-DATA.md"
)
foreach($doc in $docs) {
  if(Test-Path $doc) { Remove-Item $doc -Force }
}
```

### Step 4: Remove Legacy Directories
```bash
# Remove legacy directories
$legacyDirs = @(
  "___archive",
  ".test-hta-param-fix",
  ".test-pacing-data", 
  ".test-unique-goal-data",
  ".snapshots",
  ".vscode",
  ".cursor",
  "modules",
  "utils",
  "test",
  "servers"
)
foreach($dir in $legacyDirs) {
  if(Test-Path $dir) { Remove-Item $dir -Recurse -Force }
}
```

### Step 5: Remove Development Files
```bash
# Remove development scripts
$devFiles = @(
  "context-utils.js",
  "create_ai_project.js",
  "create_project.js",
  "health-check.js",
  "hta-analysis-server.js",
  "migrate-to-sqlite.js",
  "sandbox_live_test.js",
  "sequential-thinking-server.js",
  "setup-sqlite-provider.js",
  "simple-test.js",
  "start-forest-optimized.js",
  "tail-error-logger.js",
  "tail-error-logger.cjs",
  "verify-sqlite-provider.js"
)
foreach($file in $devFiles) {
  if(Test-Path $file) { Remove-Item $file -Force }
}
```

### Step 6: Remove Result Files
```bash
# Remove result files
$resultFiles = @(
  "function-verification-results.json",
  "health-check-results.json",
  "jest-results.json",
  "sqlite-compatibility-results.json"
)
foreach($file in $resultFiles) {
  if(Test-Path $file) { Remove-Item $file -Force }
}
```

### Step 7: Remove Redundant Configs
```bash
# Remove redundant config files
$configs = @(
  "mcp-config-final-working.json",
  "mcp-config-final.json",
  "mcp-config-fixed.json",
  "mcp-config-forest-only.json",
  "mcp-config-simplified.json",
  "mcp-config-working.json"
)
foreach($config in $configs) {
  if(Test-Path $config) { Remove-Item $config -Force }
}
```

### Step 8: Final Validation
```bash
# Validate system still works after cleanup
cd ___stage1
node run_tests.js
```

## 📈 **EXPECTED RESULTS**

### Before Cleanup
- **Files**: ~1,000+ files
- **Size**: ~100MB+
- **Directories**: ~50+ directories
- **Redundancy**: EXTREMELY HIGH

### After Cleanup
- **Files**: ~100-150 files
- **Size**: ~10-20MB
- **Directories**: ~10-15 directories
- **Redundancy**: MINIMAL

### Space Reduction
- **File Count**: ~80-85% reduction
- **Size**: ~80-90% reduction
- **Functionality**: **ZERO IMPACT**

## ⚠️ **SAFETY MEASURES**

1. **Test Before & After**: Run `node ___stage1/run_tests.js` before and after cleanup
2. **Git Tracking**: Use git to track all changes
3. **Incremental Cleanup**: Remove files in phases with testing between
4. **Preserve User Data**: Never touch `.forest-data/` or `forest_vectors.sqlite`
5. **Keep Core Runtime**: All files in `___stage1/` that are actively used

## 🎯 **FINAL STRUCTURE**

```
7-3forest-main/
├── ___stage1/                    # Core runtime system
│   ├── forest-mcp-server.js     # Main entry point
│   ├── core-*.js                # Core infrastructure
│   ├── local-mcp-*.js           # Local MCP implementation
│   ├── modules/                 # Business logic modules
│   │   ├── *.js                 # Core modules
│   │   ├── stubs/               # Stub implementations
│   │   └── vector-providers/    # Vector providers
│   ├── utils/                   # Essential utilities
│   ├── config/                  # Configuration files
│   └── scripts/                 # Essential scripts
├── .forest-data/                # User project data
├── test-data/                   # Test project data
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── .gitignore                   # Git ignore
├── README.md                    # Main documentation
├── README_production.md         # Production docs
├── CODEBASE_ANALYSIS.md         # This analysis
└── forest_vectors.sqlite        # Vector database
```

## 🔒 **VALIDATION COMMAND**

After cleanup, validate with:
```bash
cd ___stage1
node run_tests.js
```

All 7 tests should pass:
- ✅ Module Initialization
- ✅ Core Tool Definitions
- ✅ Data Persistence
- ✅ Project Management
- ✅ HTA Core Functionality
- ✅ Task Strategy Core
- ✅ Memory Sync

## 🏁 **SUCCESS CRITERIA**

✅ **All tests pass after cleanup**
✅ **Server starts successfully**
✅ **File count reduced by 80%+**
✅ **Size reduced by 80%+**
✅ **Zero functionality loss**
✅ **User data preserved**
✅ **Clean, maintainable structure**
