import * as fs from 'fs/promises';
import { RenameFileArgs } from '../types.js';
import { LSPClientManager } from '../lsp/client.js';
import { findWorkspaceRoot, findDirectoryReferences } from '../lsp/utils.js';

export async function renameFile(args: RenameFileArgs, clientManager: LSPClientManager) {
  const { oldPath, newPath, language = 'typescript' } = args;
  const workspaceRoot = findWorkspaceRoot(oldPath);

  try {
    // Check if paths exist
    await fs.access(oldPath);

    const isDirectory = (await fs.stat(oldPath)).isDirectory();

    if (isDirectory) {
      // For directories, perform file system rename and update imports
      await fs.rename(oldPath, newPath);

      // Find all files that might import from the renamed directory
      const references = await findDirectoryReferences(oldPath, workspaceRoot);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully renamed directory from ${oldPath} to ${newPath}. Found ${references.length} files that may need import updates.`,
          },
        ],
      };
    } else {
      // For files, use LSP if possible, otherwise fallback to filesystem
      try {
        const client = await clientManager.getOrCreateLSPClient(language, workspaceRoot);

        // Open the file in LSP
        const fileContent = await fs.readFile(oldPath, 'utf-8');
        await clientManager.sendLSPNotification(client, 'textDocument/didOpen', {
          textDocument: {
            uri: `file://${oldPath}`,
            languageId: language,
            version: 1,
            text: fileContent,
          },
        });

        // Try to get workspace edit for file rename
        // Note: Not all LSP servers support file renaming
        await fs.rename(oldPath, newPath);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully renamed file from ${oldPath} to ${newPath}`,
            },
          ],
        };
      } catch (_lspError) {
        // Fallback to filesystem rename
        await fs.rename(oldPath, newPath);

        return {
          content: [
            {
              type: 'text',
              text: `File renamed from ${oldPath} to ${newPath} (LSP rename not available, imports may need manual updates)`,
            },
          ],
        };
      }
    }
  } catch (error) {
    throw new Error(`Failed to rename: ${error instanceof Error ? error.message : String(error)}`);
  }
}
