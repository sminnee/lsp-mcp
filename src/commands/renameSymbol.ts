import * as fs from 'fs/promises';
import { RenameSymbolArgs, LSPWorkspaceEdit } from '../types.js';
import { LSPClientManager } from '../lsp/client.js';
import { findWorkspaceRoot, applyWorkspaceEdit } from '../lsp/utils.js';

export async function renameSymbol(args: RenameSymbolArgs, clientManager: LSPClientManager) {
  const { file, line, character = 0, newName, language = 'typescript' } = args;
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

    const workspaceEdit = await clientManager.sendLSPRequest(client, 'textDocument/rename', {
      textDocument: { uri: `file://${file}` },
      position: { line: line - 1, character },
      newName,
    });

    if (workspaceEdit) {
      const edit = workspaceEdit as LSPWorkspaceEdit;
      await applyWorkspaceEdit(edit);

      const changedFiles = Object.keys(edit.changes || {});
      return {
        content: [
          {
            type: 'text',
            text: `Successfully renamed symbol to '${newName}' across ${changedFiles.length} files`,
          },
        ],
      };
    } else {
      throw new Error('No workspace edit returned from LSP server');
    }
  } catch (error) {
    throw new Error(`Failed to rename symbol: ${error instanceof Error ? error.message : String(error)}`);
  }
}
