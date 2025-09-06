# LSP MCP Server

An LSP (Language Server Protocol) MCP (Model Context Protocol) server that provides refactoring tools through LSP integration. This server exposes refactoring capabilities as MCP tools that can be used by MCP clients like Claude Code.

## Installation

### From npm (when published)

```bash
npm install -g lsp-mcp-server
```

### Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd lsp-mcp-server
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Build the project:**

   ```bash
   pnpm run build
   ```

4. **Link for global use:**

   ```bash
   npm link
   ```

   After linking, you can use the `mcp-lsp` command globally.

5. **Alternative: Use without linking:**

   ```bash
   # Run directly
   pnpm start

   # Or build and run
   pnpm run dev
   ```

## Prerequisites

The server requires these language servers to be installed for full functionality:

### TypeScript/JavaScript

```bash
npm install -g typescript-language-server typescript
```

### Python

```bash
# Default LSP server for type checking and refactoring
npm install -g pyright

# Optional: For linting (when using serverType: 'lint')
pip install ruff
```

## Usage

### With Claude Code

#### Quick Setup (Recommended)

If you have the server installed globally:

```bash
/mcp add lsp-mcp
```

### Using the Tools in Claude Code

Once connected, you can ask Claude Code to use the refactoring tools:

- _"Rename the `calculateTotal` function to `computeSum` in src/utils.ts on line 45"_
- _"Find all references to the `UserService` class in src/services/user.ts line 12"_
- _"Extract lines 20-35 from src/components/Header.tsx into a new function called `renderNavigation`"_
- _"Move the `validateEmail` function from src/utils/validation.ts line 8 to src/utils/email.ts"_
- _"Rename the file src/old-name.ts to src/new-name.ts"_

Claude Code will automatically use the appropriate LSP refactoring tools based on your requests.

### Manual MCP Server Usage

The server can also be used directly by other MCP clients via stdio:

```bash
mcp-lsp
```

### Available Tools

1. **rename_file** - Rename files/folders using LSP rename capabilities
2. **move_function** - Move functions between files using LSP refactoring
3. **extract_function** - Extract code selections into new functions
4. **find_references** - Find all references to symbols
5. **rename_symbol** - Rename symbols across all files

### Example Tool Usage

Each tool accepts parameters specific to the refactoring operation:

- **rename_symbol**: Requires `file`, `line`, `newName`, and optionally `character` and `language`
- **find_references**: Requires `file`, `line`, and optionally `character` and `language`
- **extract_function**: Requires `file`, `startLine`, `endLine`, `functionName`, and optionally character positions and `language`

## Supported Languages

- TypeScript/JavaScript
- Python

## Development

### Commands

- `pnpm install` - Install dependencies
- `pnpm run build` - Compile TypeScript to dist/
- `pnpm start` - Run the compiled server
- `pnpm run dev` - Build and run in one command
- `pnpm run type-check` - Check types without building
- `pnpm run lint` - Check code with ESLint
- `pnpm run lint:fix` - Auto-fix linting issues
- `pnpm run format` - Format code with Prettier
- `pnpm run clean` - Remove dist/ directory

### Architecture

The server consists of:

- **LSPRefactorServer**: Main server class implementing MCP interface
- **LSP Client Management**: Manages connections to language servers
- **Tool Implementations**: Each refactoring operation communicates with LSP servers

## Protocol Communication

- **MCP Protocol**: Server ↔ MCP clients via stdio
- **LSP Protocol**: Server ↔ Language servers via JSON-RPC over stdio
