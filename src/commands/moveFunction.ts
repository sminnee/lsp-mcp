import * as fs from 'fs/promises';
import { MoveFunctionArgs } from '../types.js';
import { LSPClientManager } from '../lsp/client.js';
import {
  findWorkspaceRoot,
  extractFunctionFromContent,
  removeFunctionFromContent,
  updateImportsForMovedFunction,
} from '../lsp/utils.js';

export async function moveFunction(args: MoveFunctionArgs, clientManager: LSPClientManager) {
  const { sourceFile, targetFile, functionName, line, character: _character = 0, language = 'typescript' } = args;
  const workspaceRoot = findWorkspaceRoot(sourceFile);

  try {
    const client = await clientManager.getOrCreateLSPClient(language, workspaceRoot);

    // Open both files
    const sourceContent = await fs.readFile(sourceFile, 'utf-8');
    const targetContent = await fs.readFile(targetFile, 'utf-8').catch(() => '');

    await clientManager.sendLSPNotification(client, 'textDocument/didOpen', {
      textDocument: {
        uri: `file://${sourceFile}`,
        languageId: language,
        version: 1,
        text: sourceContent,
      },
    });

    await clientManager.sendLSPNotification(client, 'textDocument/didOpen', {
      textDocument: {
        uri: `file://${targetFile}`,
        languageId: language,
        version: 1,
        text: targetContent,
      },
    });

    // Find the function definition
    const functionText = extractFunctionFromContent(sourceContent, functionName, line);

    if (!functionText) {
      throw new Error(`Function ${functionName} not found at line ${line}`);
    }

    // Remove from source file
    const updatedSourceContent = removeFunctionFromContent(sourceContent, functionName, line);

    // Add to target file
    const updatedTargetContent = targetContent + '\n\n' + functionText;

    // Write the changes
    await fs.writeFile(sourceFile, updatedSourceContent);
    await fs.writeFile(targetFile, updatedTargetContent);

    // Update imports/exports as needed
    await updateImportsForMovedFunction(sourceFile, targetFile, functionName, language);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully moved function '${functionName}' from ${sourceFile} to ${targetFile}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Failed to move function: ${error instanceof Error ? error.message : String(error)}`);
  }
}
