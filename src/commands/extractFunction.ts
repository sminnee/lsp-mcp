import * as fs from 'fs/promises';
import { ExtractFunctionArgs } from '../types.js';
import { LSPClientManager } from '../lsp/client.js';
import { findWorkspaceRoot } from '../lsp/utils.js';

export async function extractFunction(args: ExtractFunctionArgs, clientManager: LSPClientManager) {
  const {
    file,
    startLine,
    startCharacter = 0,
    endLine,
    endCharacter = 0,
    functionName: _functionName,
    language = 'typescript',
  } = args;
  const workspaceRoot = findWorkspaceRoot(file);

  try {
    const client = await clientManager.getOrCreateLSPClient(language, workspaceRoot);

    // Open the file
    const content = await fs.readFile(file, 'utf-8');
    await clientManager.sendLSPNotification(client, 'textDocument/didOpen', {
      textDocument: {
        uri: `file://${file}`,
        languageId: language,
        version: 1,
        text: content,
      },
    });

    // Request LSP code actions for extract function
    const codeActions = await clientManager.sendLSPRequest(client, 'textDocument/codeAction', {
      textDocument: { uri: `file://${file}` },
      range: {
        start: { line: startLine - 1, character: startCharacter },
        end: { line: endLine - 1, character: endCharacter },
      },
      context: {
        diagnostics: [],
        only: ['refactor.extract.function'],
      },
    });

    const actions = Array.isArray(codeActions) ? codeActions : [];
    if (actions.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No extract function refactoring available for the selected range in ${file}. This could be because the range does not contain extractable code or the language server doesn't support this refactoring.`,
          },
        ],
      };
    }

    // Apply the first extract function action
    const action = actions[0];
    if (!action.edit) {
      return {
        content: [
          {
            type: 'text',
            text: `Extract function code action does not contain workspace edit. The language server may not be configured properly for refactoring operations.`,
          },
        ],
      };
    }

    const { applyWorkspaceEdit } = await import('../lsp/utils.js');
    await applyWorkspaceEdit(action.edit);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully extracted function from lines ${startLine}-${endLine} in ${file}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to extract function: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}
