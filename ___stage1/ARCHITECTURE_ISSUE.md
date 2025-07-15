# Forest MCP Architecture Issue

## The Core Problem

The system is designed to be domain-agnostic by leveraging Claude's intelligence through the MCP (Model Context Protocol) bridge. However, the current implementation has a fundamental disconnect:

### Current Flow:
1. **PureSchemaHTASystem** calls `generateLevelContent` with a schema and prompt
2. **RealLLMInterface** receives the request via `generateContent`
3. Instead of sending to Claude, it falls back to mock responses using `generateDomainSpecificIntelligence`
4. This uses hardcoded patterns or mechanical keyword extraction

### What Should Happen:
1. **PureSchemaHTASystem** prepares a request with schema and intelligent prompts
2. **MCP Bridge** forwards this to Claude with proper formatting
3. **Claude** generates truly intelligent, domain-specific content
4. Response is validated against schema and returned

## The Architectural Challenge

For true domain-agnostic operation, the system needs:

1. **Real Claude Access**: The MCP server must be running and connected to Claude
2. **Proper Request Routing**: Requests must go through the MCP protocol to Claude
3. **No Fallback Patterns**: Remove all hardcoded domain patterns and mock responses

## Current Mock Behavior

When Claude isn't available, the system:
- Extracts keywords from the goal (e.g., "machine", "learning", "scikit")
- Mechanically inserts them into template patterns
- Results in generic-sounding branches like "machine Learning and Comprehension"

## The Solution

To fix this, the system needs to:

1. **Remove all mock response generation** - If Claude isn't available, fail gracefully
2. **Ensure MCP Bridge connection** - Verify the MCP server is running and connected
3. **Use Claude's actual responses** - Let Claude generate the domain-specific content

The system architecture is correct - it just needs to actually connect to Claude rather than using fallback mocks.
