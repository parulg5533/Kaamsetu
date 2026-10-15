import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    setupFiles: ['tests/setup.ts'],
    env: {
      DATABASE_URL: 'file:./test.db',
      OTP_DEV_MODE: 'true',
      AUTH_SECRET: 'test-secret-test-secret-test-secret-123',
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
