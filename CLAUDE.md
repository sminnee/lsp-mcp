# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an LSP (Language Server Protocol) MCP (Model Context Protocol) server that provides refactoring tools through LSP integration. The server exposes refactoring capabilities as MCP tools that can be used by MCP clients like Claude Code.

## Development Commands

This TypeScript project uses pnpm as the package manager. Common development commands:

- **Install dependencies**: `pnpm install`
- **Build the project**: `pnpm run build` (compiles TypeScript to dist/)
- **Run the server**: `pnpm start` (runs compiled JavaScript)
- **Development mode**: `pnpm run dev` (build and run in one command)
- **Type checking**: `pnpm run type-check` (check types without building)
- **Linting**: `pnpm run lint` (check code with ESLint)
- **Auto-fix linting**: `pnpm run lint:fix`
- **Format code**: `pnpm run format` (format with Prettier)
- **Check formatting**: `pnpm run format:check`
- **Clean build**: `pnpm run clean` (remove dist/ directory)

## Testing Practices

This project follows Test-Driven Development (TDD) principles to ensure robust and reliable code. All contributors must adhere to these testing practices:

### Test-First Development

- **Write tests before implementation**: Always write failing tests first to define the expected behavior
- **Verify test failure**: Run tests to confirm they fail before writing any implementation code
- **Implement minimal code**: Write just enough code to make tests pass, then refactor

### Test Focus Areas

- **Component/Integration tests**: Priority on testing each MCP tool function end-to-end
- **Real LSP backends**: Tests should use actual LSP servers (TypeScript, Python, etc.) not mocks
- **MCP protocol compliance**: Verify all tools return proper MCP response formats
- **Cross-language support**: Test functionality across all supported languages

### Test Structure

- **Fixture-based testing**: Create comprehensive input/output fixture pairs for each test scenario
- **Realistic test data**: Use actual code samples and real-world refactoring scenarios
- **Edge case coverage**: Include tests for error conditions, malformed input, and boundary cases
- **Workspace isolation**: Each test should use isolated workspace directories
- **Complete output assertion**: Tests should generally assert the whole output of the function under test directly using `expect(result).toEqual(...)`, rather than testing individual properties or partial results. This makes it clear what the actual result is when tests fail
- **Test readability**: Tests should be written for readability by code reviewers - it should be obvious what the behavior is by reading the test. Use helper methods to reduce boilerplate but never to hide what the behavior is
- **Handle non-deterministic output**: When output is non-deterministic (e.g. path names or dates), address just the specific non-deterministic elements, such as by interpolating a base path into the output or using a fixed mock date

### Definition of Done

Before declaring any work complete, you MUST:

1. **Run full test suite**: Execute all tests and ensure 100% pass rate
2. **Run linting**: Execute `pnpm run lint` and fix ALL violations
3. **Run type checking**: Execute `pnpm run type-check` and resolve ALL type errors
4. **Fix unrelated failures**: Address any existing test or lint failures discovered during development
5. **Verify integration**: Test the complete MCP tool workflow with real LSP servers

**No work is considered complete until the entire codebase passes all tests and lint checks.**

## Architecture

### Core Components

**LSPRefactorServer Class** (`src/index.ts:75-650+`)

- Main server class that implements the MCP server interface
- Manages multiple LSP client connections (one per language/workspace combination)
- Handles tool requests and delegates to appropriate LSP operations
- Written in TypeScript with proper type annotations for all interfaces

**LSP Client Management** (`src/index.ts:340-420`)

- Creates and manages LSP server processes for different languages
- Supports TypeScript/JavaScript and Python through their respective language servers
- Maintains persistent connections with LSP servers for performance
- Properly typed LSPClient interface with ChildProcess and request handling

**Tool Implementations**

- Each refactoring operation (rename, move, extract, etc.) communicates with LSP servers
- Uses LSP protocol messages (JSON-RPC over stdio) to perform language-aware refactoring
- Handles workspace edits and applies changes through LSP capabilities

### Available Tools

1. **rename_file** - Rename files/folders using LSP rename capabilities
2. **move_function** - Move functions between files using LSP refactoring
3. **extract_function** - Extract code selections into new functions
4. **find_references** - Find all references to symbols
5. **rename_symbol** - Rename symbols across all files

### LSP Server Dependencies

The server requires these language servers to be installed:

- **TypeScript/JavaScript**: `typescript-language-server`
  - Install: `npm install -g typescript-language-server typescript`
- **Python**: `pyright-langserver` (default for type checking and refactoring)
  - Install: `npm install -g pyright`
  - Optional: `ruff` for linting when using `serverType: 'lint'`
  - Install ruff: `pip install ruff`

### Protocol Communication

- **MCP Protocol**: Server communicates with MCP clients using stdio transport
- **LSP Protocol**: Internal communication with language servers using JSON-RPC over stdio
- **Message Format**: LSP messages use `Content-Length` headers followed by JSON payloads

## Important Implementation Details

- LSP clients are cached per language/workspace combination for efficiency
- All operations are asynchronous and return MCP-compatible responses
- Error handling wraps LSP errors in MCP response format
- Server initialization includes setting up LSP capabilities for refactoring operations
- TypeScript provides compile-time type checking for LSP protocol messages
- Source code is in `src/` directory, compiled output goes to `dist/`
- ESLint configured for TypeScript with Node.js environment
- Prettier configured with 120 character line width for consistent formatting
