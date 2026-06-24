// Safe localStorage fallback for sandboxed environments where standard localStorage is blocked
const createMockStorage = (): Storage => {
  const memoryStore = new Map<string, string>();
  return {
    get length() { return memoryStore.size; },
    clear() { memoryStore.clear(); },
    getItem(key: string) { return memoryStore.get(key) || null; },
    key(index: number) { return Array.from(memoryStore.keys())[index] || null; },
    removeItem(key: string) { memoryStore.delete(key); },
    setItem(key: string, value: string) { memoryStore.set(key, String(value)); }
  };
};

let storage: Storage;
try {
  const testKey = '__storage_test_key__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
  storage = window.localStorage;
} catch (e) {
  console.warn("Standard localStorage is blocked or restricted. Activating resilient in-memory safeLocalStorage fallback.");
  storage = createMockStorage();
}

export const safeLocalStorage = storage;
