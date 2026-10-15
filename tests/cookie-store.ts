// In-memory replacement for next/headers cookies(). Shared by setup.ts (vi.mock) and helpers.ts.
const store = new Map<string, string>();

export const cookieStore = {
  get(name: string): { name: string; value: string } | undefined {
    const value = store.get(name);
    return value === undefined ? undefined : { name, value };
  },
  set(name: string, value: string): void {
    store.set(name, value);
  },
  delete(name: string): void {
    store.delete(name);
  },
  clear(): void {
    store.clear();
  },
};

export function cookies() {
  return cookieStore;
}
