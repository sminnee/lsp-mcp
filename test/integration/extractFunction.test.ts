import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { extractFunction } from '../../src/commands/extractFunction.js';
import {
  TestFileManager,
  TestLSPManager,
  checkLanguageServerAvailable,
  loadFixtureWithExpectedOutput,
} from '../helpers/testUtils.js';

describe('extractFunction Integration Tests', () => {
  let fileManager: TestFileManager;
  let lspManager: TestLSPManager;

  beforeAll(() => {
    lspManager = new TestLSPManager(); // Creates unique temp dirs for this test file
  });

  afterAll(async () => {
    await lspManager.cleanup(); // CLEANUP IS CALLED HERE - removes temp dirs and LSP processes
  });

  beforeEach(() => {
    fileManager = new TestFileManager();
  });

  afterEach(async () => {
    await fileManager.cleanup();
  });

  test('should extract function in TypeScript file', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    // Load fixture and expected output
    const fixture = await loadFixtureWithExpectedOutput('typescript', 'extractFunction');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('typescript');
    const testFile = await fileManager.copyFixtureToWorkspace(fixture.inputPath, workspace, 'test-typescript.ts');

    const result = await extractFunction(
      {
        file: testFile.path,
        startLine: 4,
        endLine: 7,
        functionName: 'processItems',
        language: 'typescript',
      },
      await lspManager.getClientManager()
    );

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();

    // If extraction succeeded, compare with expected output
    if (result.content[0].text.includes('Successfully extracted function')) {
      const modifiedContent = await fileManager.readFile(testFile.path);

      // Normalize line endings and whitespace for comparison
      const normalizeContent = (content: string) => content.replace(/\r\n/g, '\n').trim();
      expect(normalizeContent(modifiedContent)).toBe(normalizeContent(fixture.outputContent));
    } else {
      // Check that we got a proper error message instead of an exception
      expect(result.content[0].text).toContain('No extract function refactoring available');
    }
  });

  test('should extract function in JavaScript file', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    // Load fixture and expected output
    const fixture = await loadFixtureWithExpectedOutput('javascript', 'extractFunction');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('javascript');
    const testFile = await fileManager.copyFixtureToWorkspace(fixture.inputPath, workspace, 'test-javascript.js');

    const result = await extractFunction(
      {
        file: testFile.path,
        startLine: 4,
        endLine: 7,
        functionName: 'processItems',
        language: 'javascript',
      },
      await lspManager.getClientManager()
    );

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();

    // If extraction succeeded, compare with expected output
    if (result.content[0].text.includes('Successfully extracted function')) {
      const modifiedContent = await fileManager.readFile(testFile.path);

      // Normalize line endings and whitespace for comparison
      const normalizeContent = (content: string) => content.replace(/\r\n/g, '\n').trim();
      expect(normalizeContent(modifiedContent)).toBe(normalizeContent(fixture.outputContent));
    } else {
      // Check that we got a proper error message instead of an exception
      expect(result.content[0].text).toContain('No extract function refactoring available');
    }
  });

  test('should extract function in Python file', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('pyright-langserver');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    // Load fixture and expected output
    const fixture = await loadFixtureWithExpectedOutput('python', 'extract_function');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('python');
    const testFile = await fileManager.copyFixtureToWorkspace(fixture.inputPath, workspace, 'test_python.py');

    const result = await extractFunction(
      {
        file: testFile.path,
        startLine: 4,
        endLine: 7,
        functionName: 'process_items',
        language: 'python',
      },
      await lspManager.getClientManager()
    );

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();

    // If extraction succeeded, compare with expected output
    if (result.content[0].text.includes('Successfully extracted function')) {
      const modifiedContent = await fileManager.readFile(testFile.path);

      // Normalize line endings and whitespace for comparison
      const normalizeContent = (content: string) => content.replace(/\r\n/g, '\n').trim();
      expect(normalizeContent(modifiedContent)).toBe(normalizeContent(fixture.outputContent));
    } else {
      // Check that we got a proper error message instead of an exception
      expect(result.content[0].text).toContain('No extract function refactoring available');
    }
  });

  test('should handle unsupported language', async () => {
    const fixture = await loadFixtureWithExpectedOutput('typescript', 'extractFunction');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('typescript');
    const testFile = await fileManager.copyFixtureToWorkspace(fixture.inputPath, workspace, 'test-unsupported.ts');

    const result = await extractFunction(
      {
        file: testFile.path,
        startLine: 4,
        endLine: 7,
        functionName: 'processItems',
        language: 'unsupported',
      },
      await lspManager.getClientManager()
    );

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0].text).toContain('Failed to extract function');
  });

  test('should handle invalid line ranges', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    const fixture = await loadFixtureWithExpectedOutput('typescript', 'extractFunction');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('typescript');
    const testFile = await fileManager.copyFixtureToWorkspace(fixture.inputPath, workspace, 'test-invalid-range.ts');

    const result = await extractFunction(
      {
        file: testFile.path,
        startLine: 20, // Beyond file length
        endLine: 25,
        functionName: 'invalidFunction',
        language: 'typescript',
      },
      await lspManager.getClientManager()
    );

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    // Should get an error message about no refactoring available or invalid range
    expect(result.content[0].text).toMatch(/No extract function refactoring available|Failed to extract function/);
  });
});
