import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LSPClientManager } from '../../src/lsp/client.js';

export interface FixtureWithOutput {
  inputPath: string;
  outputPath: string;
  inputContent: string;
  outputContent: string;
}

export interface TestFile {
  path: string;
  originalContent: string;
}

export class TestFileManager {
  private tempFiles: Set<string> = new Set();
  private tempDirs: Set<string> = new Set();

  async copyFixtureToTemp(fixturePath: string, tempFileName: string): Promise<TestFile> {
    const fixtureContent = await fs.readFile(fixturePath, 'utf-8');
    const tempDir = path.join(process.cwd(), 'test', 'fixtures', 'temp');
    const tempPath = path.join(tempDir, tempFileName);

    await fs.writeFile(tempPath, fixtureContent);
    this.tempFiles.add(tempPath);

    return {
      path: tempPath,
      originalContent: fixtureContent,
    };
  }

  async copyFixtureToWorkspace(fixturePath: string, workspaceDir: string, fileName: string): Promise<TestFile> {
    const fixtureContent = await fs.readFile(fixturePath, 'utf-8');

    // Ensure workspace directory exists
    await fs.mkdir(workspaceDir, { recursive: true });

    const filePath = path.join(workspaceDir, fileName);
    await fs.writeFile(filePath, fixtureContent);
    this.tempFiles.add(filePath);

    return {
      path: filePath,
      originalContent: fixtureContent,
    };
  }

  async copyMultiFileFixtureToTemp(
    fixture: MultiFileFixture,
    tempDirName: string
  ): Promise<{ [filename: string]: TestFile }> {
    const tempFiles = await copyMultiFileFixtureToTemp(fixture, tempDirName);

    // Track temp directory for cleanup
    const tempDir = path.join(process.cwd(), 'test', 'fixtures', 'temp', tempDirName);
    this.tempDirs.add(tempDir);

    // Track individual files for cleanup
    Object.values(tempFiles).forEach(file => {
      this.tempFiles.add(file.path);
    });

    return tempFiles;
  }

  async copyMultiFileFixtureToWorkspace(
    fixture: MultiFileFixture,
    workspaceDir: string
  ): Promise<{ [filename: string]: TestFile }> {
    // Ensure workspace directory exists
    await fs.mkdir(workspaceDir, { recursive: true });

    const tempFiles: { [filename: string]: TestFile } = {};

    for (const [filename, fileInfo] of Object.entries(fixture.files)) {
      const filePath = path.join(workspaceDir, filename);
      await fs.writeFile(filePath, fileInfo.content);

      tempFiles[filename] = {
        path: filePath,
        originalContent: fileInfo.content,
      };

      this.tempFiles.add(filePath);
    }

    return tempFiles;
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async cleanup(): Promise<void> {
    // Clean up individual files
    const filePromises = Array.from(this.tempFiles).map(async filePath => {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    await Promise.all(filePromises);
    this.tempFiles.clear();

    // Clean up directories
    const dirPromises = Array.from(this.tempDirs).map(async dirPath => {
      try {
        await fs.rmdir(dirPath, { recursive: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    await Promise.all(dirPromises);
    this.tempDirs.clear();
  }
}

export class TestLSPManager {
  private clientManager: LSPClientManager;
  private tempWorkspaces: Map<string, string> = new Map();
  private tempDirs: Set<string> = new Set();

  constructor() {
    this.clientManager = new LSPClientManager();
  }

  async getClientManager(): Promise<LSPClientManager> {
    return this.clientManager;
  }

  getWorkspace(language: string): string {
    if (!this.tempWorkspaces.has(language)) {
      // Create unique temp directory for this language in this test manager instance
      const tempDir = fsSync.mkdtempSync(path.join(os.tmpdir(), `lsp-test-${language}-`));
      this.tempWorkspaces.set(language, tempDir);
      this.tempDirs.add(tempDir);
    }
    return this.tempWorkspaces.get(language)!;
  }

  async cleanup(): Promise<void> {
    // Clean up LSP client processes first
    try {
      await this.clientManager.cleanup();
    } catch (error) {
      // Ignore LSP cleanup errors
      console.warn('LSP cleanup error:', error);
    }

    // Clean up all temp directories created by this manager
    const cleanupPromises = Array.from(this.tempDirs).map(async dir => {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors (directory might already be gone)
      }
    });

    await Promise.all(cleanupPromises);
    this.tempDirs.clear();
    this.tempWorkspaces.clear();
  }
}

export function verifyFunctionExtraction(
  modifiedContent: string,
  functionName: string,
  language: string
): { hasNewFunction: boolean; hasCallReplacement: boolean } {
  const lines = modifiedContent.split('\n');

  // Check for new function
  let hasNewFunction = false;
  let hasCallReplacement = false;

  switch (language) {
    case 'typescript':
    case 'javascript':
      hasNewFunction = lines.some(
        line => line.includes(`function ${functionName}(`) || line.includes(`const ${functionName} = `)
      );
      hasCallReplacement = lines.some(line => line.includes(`${functionName}()`));
      break;

    case 'python':
      hasNewFunction = lines.some(line => line.includes(`def ${functionName}(`));
      hasCallReplacement = lines.some(line => line.includes(`${functionName}()`));
      break;
  }

  return { hasNewFunction, hasCallReplacement };
}

export async function checkLanguageServerAvailable(command: string): Promise<boolean> {
  try {
    const { spawn } = await import('child_process');

    // Special handling for pyright-langserver which doesn't support --version
    if (command === 'pyright-langserver') {
      // Just check if the binary exists and can be spawned
      const child = spawn(command, ['--help'], { stdio: 'pipe' });

      return new Promise(resolve => {
        let resolved = false;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            child.kill();
            // If it starts but doesn't exit quickly, it's probably working
            resolve(true);
          }
        }, 500);

        child.on('close', code => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            // Exit code 1 is expected for pyright-langserver without proper connection
            resolve(code === 1 || code === 0);
          }
        });

        child.on('error', () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(false);
          }
        });
      });
    }

    // Standard version check for other language servers
    const child = spawn(command, ['--version'], { stdio: 'pipe' });

    return new Promise(resolve => {
      child.on('close', code => {
        resolve(code === 0);
      });
      child.on('error', () => {
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

export async function loadFixtureWithExpectedOutput(category: string, baseName: string): Promise<FixtureWithOutput> {
  const fixturesDir = path.join(process.cwd(), 'test', 'fixtures', category);

  // Determine file extension based on category
  const extensions: { [key: string]: string } = {
    typescript: '.ts',
    javascript: '.js',
    python: '.py',
  };

  const ext = extensions[category] || '.ts';
  const inputPath = path.join(fixturesDir, `${baseName}${ext}`);
  const outputPath = path.join(fixturesDir, `${baseName}.output${ext}`);

  const [inputContent, outputContent] = await Promise.all([
    fs.readFile(inputPath, 'utf-8'),
    fs.readFile(outputPath, 'utf-8'),
  ]);

  return {
    inputPath,
    outputPath,
    inputContent,
    outputContent,
  };
}

export interface MultiFileFixture {
  files: { [filename: string]: { path: string; content: string } };
  tempDir: string;
}

export async function loadMultiFileFixture(category: string, fixtureName: string): Promise<MultiFileFixture> {
  const fixturesDir = path.join(process.cwd(), 'test', 'fixtures', category, fixtureName);
  const files: { [filename: string]: { path: string; content: string } } = {};

  // Determine file extension based on category
  const extensions: { [key: string]: string } = {
    typescript: '.ts',
    javascript: '.js',
    python: '.py',
  };

  const ext = extensions[category] || '.ts';

  // Common file names for findReferences fixtures
  const expectedFiles = ['main', 'utils', 'consumer'];

  for (const filename of expectedFiles) {
    const filePath = path.join(fixturesDir, `${filename}${ext}`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      files[`${filename}${ext}`] = { path: filePath, content };
    } catch (error) {
      // File might not exist, which is okay for some fixtures
    }
  }

  // For Python, also include __init__.py if it exists
  if (category === 'python') {
    try {
      const initPath = path.join(fixturesDir, '__init__.py');
      const initContent = await fs.readFile(initPath, 'utf-8');
      files['__init__.py'] = { path: initPath, content: initContent };
    } catch (error) {
      // __init__.py might not exist, which is okay
    }
  }

  return {
    files,
    tempDir: fixturesDir,
  };
}

export async function copyMultiFileFixtureToTemp(
  fixture: MultiFileFixture,
  tempDirName: string
): Promise<{ [filename: string]: TestFile }> {
  const tempBaseDir = path.join(process.cwd(), 'test', 'fixtures', 'temp');
  const tempDir = path.join(tempBaseDir, tempDirName);

  // Ensure temp directory exists
  await fs.mkdir(tempDir, { recursive: true });

  const tempFiles: { [filename: string]: TestFile } = {};

  for (const [filename, fileInfo] of Object.entries(fixture.files)) {
    const tempPath = path.join(tempDir, filename);
    await fs.writeFile(tempPath, fileInfo.content);

    tempFiles[filename] = {
      path: tempPath,
      originalContent: fileInfo.content,
    };
  }

  return tempFiles;
}
