import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { LSPWorkspaceEdit } from '../types.js';

export function findWorkspaceRoot(filePath: string): string {
  let dir = path.dirname(path.resolve(filePath));

  while (dir !== path.dirname(dir)) {
    const packageJsonPath = path.join(dir, 'package.json');
    const gitPath = path.join(dir, '.git');

    try {
      if (fsSync.existsSync(packageJsonPath) || fsSync.existsSync(gitPath)) {
        return dir;
      }
    } catch {
      // ignore errors
    }

    dir = path.dirname(dir);
  }

  return path.dirname(path.resolve(filePath));
}

export async function findDirectoryReferences(_dirPath: string, _workspaceRoot: string): Promise<string[]> {
  // Simplified implementation - would need to scan for import statements
  // that reference the directory
  return [];
}

export function extractFunctionFromContent(content: string, functionName: string, line: number): string | null {
  const lines = content.split('\n');
  const startIndex = line - 1;

  // Simple function extraction - would need more sophisticated parsing for production
  let braceCount = 0;
  let inFunction = false;
  let functionLines: string[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const currentLine = lines[i];

    if (!inFunction && currentLine.includes(functionName)) {
      inFunction = true;
    }

    if (inFunction) {
      functionLines.push(currentLine);
      braceCount += (currentLine.match(/{/g) || []).length;
      braceCount -= (currentLine.match(/}/g) || []).length;

      if (braceCount === 0 && inFunction) {
        break;
      }
    }
  }

  return functionLines.length > 0 ? functionLines.join('\n') : null;
}

export function removeFunctionFromContent(content: string, functionName: string, line: number): string {
  const lines = content.split('\n');
  const startIndex = line - 1;

  let braceCount = 0;
  let inFunction = false;
  let endIndex = startIndex;

  for (let i = startIndex; i < lines.length; i++) {
    const currentLine = lines[i];

    if (!inFunction && currentLine.includes(functionName)) {
      inFunction = true;
    }

    if (inFunction) {
      braceCount += (currentLine.match(/{/g) || []).length;
      braceCount -= (currentLine.match(/}/g) || []).length;

      if (braceCount === 0 && inFunction) {
        endIndex = i;
        break;
      }
    }
  }

  lines.splice(startIndex, endIndex - startIndex + 1);
  return lines.join('\n');
}

export function createFunctionFromCode(code: string, functionName: string, language: string): string {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return `function ${functionName}() {\n${code}\n}`;
    case 'python':
      return `def ${functionName}():\n    ${code.replace(/\n/g, '\n    ')}`;
    default:
      return `function ${functionName}() {\n${code}\n}`;
  }
}

export function createFunctionCall(functionName: string, _language: string): string {
  return `${functionName}();`;
}

export async function updateImportsForMovedFunction(
  _sourceFile: string,
  _targetFile: string,
  _functionName: string,
  _language: string
): Promise<void> {
  // Implementation would update import/export statements
  // This is a simplified version
}

export async function applyWorkspaceEdit(edit: LSPWorkspaceEdit): Promise<void> {
  if (edit.changes) {
    for (const [uri, changes] of Object.entries(edit.changes)) {
      const filePath = uri.replace('file://', '');
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Apply changes in reverse order to maintain line numbers
      const sortedChanges = changes.sort((a, b) => b.range.start.line - a.range.start.line);

      for (const change of sortedChanges) {
        const startLine = change.range.start.line;
        const endLine = change.range.end.line;
        const newText = change.newText;

        lines.splice(startLine, endLine - startLine + 1, ...newText.split('\n'));
      }

      await fs.writeFile(filePath, lines.join('\n'));
    }
  }
}
