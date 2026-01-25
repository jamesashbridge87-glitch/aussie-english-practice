/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM simulation
    environment: 'jsdom',

    // Setup files to run before each test
    setupFiles: ['./src/test/setup.ts'],

    // Global test configuration
    globals: true,

    // Include patterns for test files
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', 'backend', 'backend-python'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
      thresholds: {
        // Minimum coverage thresholds (start low, increase over time)
        statements: 20,
        branches: 20,
        functions: 20,
        lines: 20,
      },
    },

    // Reporter configuration
    reporters: ['verbose'],

    // Timeout for tests
    testTimeout: 10000,

    // Watch mode exclusions
    watchExclude: ['node_modules', 'dist'],
  },
});
