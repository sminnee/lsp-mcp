import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { findReferences } from '../../src/commands/findReferences.js';
import {
  TestFileManager,
  TestLSPManager,
  checkLanguageServerAvailable,
  loadMultiFileFixture,
} from '../helpers/testUtils.js';

describe('findReferences Integration Tests', () => {
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

  test('should find references to calculateSum function in TypeScript files', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    // Load multi-file fixture
    const fixture = await loadMultiFileFixture('typescript', 'findReferences');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('typescript');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace);

    // Find references to calculateSum function (line 4, column 17 in main.ts)
    const result = await findReferences(
      {
        file: tempFiles['main.ts'].path,
        line: 4, // calculateSum function declaration
        character: 17,
        language: 'typescript',
      },
      await lspManager.getClientManager()
    );

    // Compare entire result
    expect(result).toEqual({
      count: 6,
      references: [
        { file: expect.stringContaining('main.ts'), line: 5, character: 16 },
        { file: expect.stringContaining('main.ts'), line: 10, character: 17 },
        { file: expect.stringContaining('utils.ts'), line: 2, character: 9 },
        { file: expect.stringContaining('utils.ts'), line: 5, character: 9 },
        { file: expect.stringContaining('consumer.ts'), line: 2, character: 9 },
        { file: expect.stringContaining('consumer.ts'), line: 7, character: 11 },
      ],
      content: [
        {
          type: 'text',
          text: expect.stringMatching(/Found 6 references:/),
        },
      ],
    });
  });

  test('should find references to UserData interface in TypeScript files', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    const fixture = await loadMultiFileFixture('typescript', 'findReferences');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('typescript');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace);

    // Find references to UserData interface (line 17, column 17 in main.ts)
    const result = await findReferences(
      {
        file: tempFiles['main.ts'].path,
        line: 17, // UserData interface declaration
        character: 17,
        language: 'typescript',
      },
      await lspManager.getClientManager()
    );

    expect(result).toBeDefined();
    expect(result.count).toBeGreaterThanOrEqual(2);
    expect(result.references).toHaveLength(result.count);

    const fileNames = result.references.map(ref => ref.file.split('/').pop());
    expect(fileNames).toContain('main.ts');
  });

  test('should find references to LOCAL_CONSTANT in TypeScript files', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    const fixture = await loadMultiFileFixture('typescript', 'findReferences');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('typescript');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace);

    // Find references to LOCAL_CONSTANT (line 22, column 13 in utils.ts)
    const result = await findReferences(
      {
        file: tempFiles['utils.ts'].path,
        line: 22, // LOCAL_CONSTANT declaration
        character: 13,
        language: 'typescript',
      },
      await lspManager.getClientManager()
    );

    expect(result).toBeDefined();
    expect(result.count).toBeGreaterThanOrEqual(2);
    expect(result.references).toHaveLength(result.count);

    const fileNames = result.references.map(ref => ref.file.split('/').pop());
    expect(fileNames).toContain('utils.ts');
  });

  test('should handle no references found in TypeScript', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    const fixture = await loadMultiFileFixture('typescript', 'findReferences');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('typescript');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace); // ts-noReferences');

    // Find references to unusedFunction (line 21, column 16 in consumer.ts)
    const result = await findReferences(
      {
        file: tempFiles['consumer.ts'].path,
        line: 21, // unusedFunction declaration
        character: 16,
        language: 'typescript',
      },
      await lspManager.getClientManager()
    );

    expect(result).toBeDefined();
    expect(result.count).toBeGreaterThanOrEqual(1); // At least the declaration itself
    expect(result.references).toHaveLength(result.count);
  });

  test('should find references to calculateSum function in JavaScript files', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    const fixture = await loadMultiFileFixture('javascript', 'findReferences');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('javascript');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace); // js-calculateSum');

    // Find references to calculateSum function (line 4, column 9 in main.js)
    const result = await findReferences(
      {
        file: tempFiles['main.js'].path,
        line: 4, // calculateSum function declaration
        character: 9,
        language: 'javascript',
      },
      await lspManager.getClientManager()
    );

    expect(result).toEqual({
      count: 3,
      references: [
        { file: expect.stringContaining('main.js'), line: 5, character: 9 },
        { file: expect.stringContaining('main.js'), line: 10, character: 17 },
        { file: expect.stringContaining('main.js'), line: 35, character: 19 },
      ],
      content: [
        {
          type: 'text',
          text: expect.stringMatching(/Found 3 references:/),
        },
      ],
    });
  });

  test('should find references to createUser function in JavaScript files', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    const fixture = await loadMultiFileFixture('javascript', 'findReferences');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('javascript');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace); // js-createUser');

    // Find references to createUser function (line 16, column 9 in main.js)
    const result = await findReferences(
      {
        file: tempFiles['main.js'].path,
        line: 16, // createUser function declaration
        character: 9,
        language: 'javascript',
      },
      await lspManager.getClientManager()
    );

    expect(result).toEqual({
      count: 3,
      references: [
        { file: expect.stringContaining('main.js'), line: 17, character: 9 },
        { file: expect.stringContaining('main.js'), line: 24, character: 13 },
        { file: expect.stringContaining('main.js'), line: 35, character: 33 },
      ],
      content: [
        {
          type: 'text',
          text: expect.stringMatching(/Found 3 references:/),
        },
      ],
    });
  });

  test('should find references to calculate_sum function in Python files', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('pyright-langserver');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    const fixture = await loadMultiFileFixture('python', 'find_references');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('python');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace); // py-calculate_sum');

    // Find references to calculate_sum function (line 4, column 4 in main.py)
    const result = await findReferences(
      {
        file: tempFiles['main.py'].path,
        line: 4, // calculate_sum function declaration
        character: 4,
        language: 'python',
      },
      await lspManager.getClientManager()
    );

    expect(result).toEqual({
      count: 0,
      references: [],
      content: [
        {
          type: 'text',
          text: expect.stringMatching(/Found 0 references:/),
        },
      ],
    });
  });

  test('should find references to UserData class in Python files', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('pyright-langserver');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    const fixture = await loadMultiFileFixture('python', 'find_references');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('python');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace); // py-UserData');

    // Find references to UserData class (line 16, column 6 in main.py)
    const result = await findReferences(
      {
        file: tempFiles['main.py'].path,
        line: 16, // UserData class declaration
        character: 6,
        language: 'python',
      },
      await lspManager.getClientManager()
    );

    expect(result).toEqual({
      count: 0,
      references: [],
      content: [
        {
          type: 'text',
          text: expect.stringMatching(/Found 0 references:/),
        },
      ],
    });
  });

  test('should handle unsupported language', async () => {
    const fixture = await loadMultiFileFixture('typescript', 'findReferences');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('typescript');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace); // unsupported-lang

    await expect(
      findReferences(
        {
          file: tempFiles['main.ts'].path,
          line: 4,
          character: 17,
          language: 'unsupported',
        },
        await lspManager.getClientManager()
      )
    ).rejects.toThrow('Failed to find references');
  });

  test('should handle invalid line position', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    const fixture = await loadMultiFileFixture('typescript', 'findReferences');

    // Copy to isolated temp workspace for this test file
    const workspace = lspManager.getWorkspace('typescript');
    const tempFiles = await fileManager.copyMultiFileFixtureToWorkspace(fixture, workspace); // ts-invalid-line');

    await expect(
      findReferences(
        {
          file: tempFiles['main.ts'].path,
          line: 999, // Beyond file length
          character: 0,
          language: 'typescript',
        },
        await lspManager.getClientManager()
      )
    ).rejects.toThrow('Failed to find references');
  });

  test('should handle invalid file path', async ctx => {
    const isAvailable = await checkLanguageServerAvailable('typescript-language-server');
    if (!isAvailable) {
      ctx.skip();
      return;
    }

    await expect(
      findReferences(
        {
          file: '/nonexistent/file.ts',
          line: 1,
          character: 0,
          language: 'typescript',
        },
        await lspManager.getClientManager()
      )
    ).rejects.toThrow('Failed to find references');
  });
});
