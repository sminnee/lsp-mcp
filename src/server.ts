import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { LSPClientManager } from './lsp/client.js';
import { renameFile } from './commands/renameFile.js';
import { moveFunction } from './commands/moveFunction.js';
import { extractFunction } from './commands/extractFunction.js';
import { findReferences } from './commands/findReferences.js';
import { renameSymbol } from './commands/renameSymbol.js';
import {
  RenameFileArgs,
  MoveFunctionArgs,
  ExtractFunctionArgs,
  FindReferencesArgs,
  RenameSymbolArgs,
} from './types.js';

export class LSPRefactorServer {
  private clientManager: LSPClientManager;
  private server: Server;

  constructor() {
    this.clientManager = new LSPClientManager();
    this.server = new Server(
      {
        name: 'lsp-refactor-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'rename_file',
            description: 'Rename a file or folder using LSP rename capabilities',
            inputSchema: {
              type: 'object',
              properties: {
                oldPath: {
                  type: 'string',
                  description: 'Current path of the file or folder',
                },
                newPath: {
                  type: 'string',
                  description: 'New path for the file or folder',
                },
                language: {
                  type: 'string',
                  description: 'Programming language (typescript, javascript, python, etc.)',
                  default: 'typescript',
                },
              },
              required: ['oldPath', 'newPath'],
            },
          },
          {
            name: 'move_function',
            description: 'Move a function to a different file using LSP refactoring',
            inputSchema: {
              type: 'object',
              properties: {
                sourceFile: {
                  type: 'string',
                  description: 'Source file containing the function',
                },
                targetFile: {
                  type: 'string',
                  description: 'Target file to move the function to',
                },
                functionName: {
                  type: 'string',
                  description: 'Name of the function to move',
                },
                line: {
                  type: 'number',
                  description: 'Line number where the function is located',
                },
                character: {
                  type: 'number',
                  description: 'Character position where the function starts',
                  default: 0,
                },
                language: {
                  type: 'string',
                  description: 'Programming language',
                  default: 'typescript',
                },
              },
              required: ['sourceFile', 'targetFile', 'functionName', 'line'],
            },
          },
          {
            name: 'extract_function',
            description: 'Extract selected code into a new function',
            inputSchema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  description: 'File containing the code to extract',
                },
                startLine: {
                  type: 'number',
                  description: 'Start line of code to extract',
                },
                startCharacter: {
                  type: 'number',
                  description: 'Start character position',
                  default: 0,
                },
                endLine: {
                  type: 'number',
                  description: 'End line of code to extract',
                },
                endCharacter: {
                  type: 'number',
                  description: 'End character position',
                  default: 0,
                },
                functionName: {
                  type: 'string',
                  description: 'Name for the new function',
                },
                language: {
                  type: 'string',
                  description: 'Programming language',
                  default: 'typescript',
                },
              },
              required: ['file', 'startLine', 'endLine', 'functionName'],
            },
          },
          {
            name: 'find_references',
            description: 'Find all references to a symbol using LSP',
            inputSchema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  description: 'File containing the symbol',
                },
                line: {
                  type: 'number',
                  description: 'Line number of the symbol',
                },
                character: {
                  type: 'number',
                  description: 'Character position of the symbol',
                  default: 0,
                },
                language: {
                  type: 'string',
                  description: 'Programming language',
                  default: 'typescript',
                },
              },
              required: ['file', 'line'],
            },
          },
          {
            name: 'rename_symbol',
            description: 'Rename a symbol (variable, function, class, etc.) across all files',
            inputSchema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  description: 'File containing the symbol',
                },
                line: {
                  type: 'number',
                  description: 'Line number of the symbol',
                },
                character: {
                  type: 'number',
                  description: 'Character position of the symbol',
                  default: 0,
                },
                newName: {
                  type: 'string',
                  description: 'New name for the symbol',
                },
                language: {
                  type: 'string',
                  description: 'Programming language',
                  default: 'typescript',
                },
              },
              required: ['file', 'line', 'newName'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'rename_file':
            return await renameFile(args as unknown as RenameFileArgs, this.clientManager);
          case 'move_function':
            return await moveFunction(args as unknown as MoveFunctionArgs, this.clientManager);
          case 'extract_function':
            return await extractFunction(args as unknown as ExtractFunctionArgs, this.clientManager);
          case 'find_references':
            return await findReferences(args as unknown as FindReferencesArgs, this.clientManager);
          case 'rename_symbol':
            return await renameSymbol(args as unknown as RenameSymbolArgs, this.clientManager);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
