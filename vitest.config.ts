import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Longer timeout for LSP operations
    testTimeout: 30000,
    hookTimeout: 30000,

    // Run tests serially to avoid LSP server conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Include test files
    include: ['test/**/*.test.ts'],

    // Environment setup
    globals: true,
    environment: 'node',
  },

  resolve: {
    // Ensure proper ESM resolution
    conditions: ['node', 'default'],
  },
});
