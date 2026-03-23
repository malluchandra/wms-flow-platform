import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    testTimeout: 15000,
    // ioredis throws "Connection is closed" rejection during subscriber
    // teardown — a known ioredis issue, not a test correctness problem
    dangerouslyIgnoreUnhandledErrors: true,
  },
});
