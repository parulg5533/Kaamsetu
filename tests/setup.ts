import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { cookieStore } from './cookie-store';
import { clearDb } from './helpers';

// Route handlers read the session cookie through next/headers; redirect it to an in-memory store.
vi.mock('next/headers', async () => {
  const { cookies } = await import('./cookie-store');
  return { cookies };
});

const ROOT = path.resolve(__dirname, '..');

beforeAll(() => {
  // The SQLite path is relative to prisma/schema.prisma, so this creates prisma/test.db.
  const prismaCli = path.join(ROOT, 'node_modules', 'prisma', 'build', 'index.js');
  execFileSync(process.execPath, [prismaCli, 'db', 'push', '--force-reset', '--skip-generate'], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'pipe',
  });
}, 120_000);

beforeEach(async () => {
  cookieStore.clear();
  await clearDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
