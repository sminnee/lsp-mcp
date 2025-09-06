import * as fs from 'fs/promises';
import { FindReferencesArgs, LSPLocation } from '../types.js';
import { LSPClientManager } from '../lsp/client.js';
import { findWorkspaceRoot } from '../lsp/utils.js';

export async function findReferences(args: FindReferencesArgs, clientManager: LSPClientManager) {
  const { file, line, character = 0, language = 'typescript' } = args;
  const workspaceRoot = findWorkspaceRoot(file);

  try {
    const client = await clientManager.getOrCreateLSPClient(language, workspaceRoot);

    // Open all files in the workspace to enable cross-file reference finding
    const { glob } = await import('glob');

    // Determine file extension based on language
    const extensions = {
      typescript: '**/*.{ts,tsx}',
      javascript: '**/*.{js,jsx}',
      python: '**/*.py',
    };

    const pattern = extensions[language as keyof typeof extensions] || '**/*.ts';
    const workspaceFiles = await glob(pattern, {
      cwd: workspaceRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    });

    // Open all files in the workspace
    for (const filePath of workspaceFiles) {
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        await clientManager.sendLSPNotification(client, 'textDocument/didOpen', {
          textDocument: {
            uri: `file://${filePath}`,
            languageId: language,
            version: 1,
            text: fileContent,
          },
        });
      } catch (_error) {
        // Skip files that can't be read
        continue;
      }
    }

    const referencesResponse = await clientManager.sendLSPRequest(client, 'textDocument/references', {
      textDocument: { uri: `file://${file}` },
      position: { line: line - 1, character },
      context: { includeDeclaration: true },
    });

    const references = Array.isArray(referencesResponse) ? (referencesResponse as LSPLocation[]) : [];

    const formattedReferences = references.map((ref: LSPLocation) => ({
      file: ref.uri.replace('file://', ''),
      line: ref.range.start.line + 1,
      character: ref.range.start.character,
    }));

    return {
      references: formattedReferences,
      count: formattedReferences.length,
      content: [
        {
          type: 'text',
          text: `Found ${formattedReferences.length} references:\n${formattedReferences
            .map((ref: { file: string; line: number; character: number }) => `${ref.file}:${ref.line}:${ref.character}`)
            .join('\n')}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to find references: ${error instanceof Error ? error.message : String(error)}`);
  }
}
