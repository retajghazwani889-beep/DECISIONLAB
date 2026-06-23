const memoryStore: Record<string, string> = {};

const memoryStorage: Storage = {
  length: 0,
  getItem: (key) => memoryStore[key] ?? null,
  setItem: (key, value) => {
    memoryStore[key] = String(value);
    memoryStorage.length = Object.keys(memoryStore).length;
  },
  removeItem: (key) => {
    delete memoryStore[key];
    memoryStorage.length = Object.keys(memoryStore).length;
  },
  clear: () => {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
    memoryStorage.length = 0;
  },
  key: (index) => Object.keys(memoryStore)[index] ?? null,
};

function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

if (!isStorageAvailable('localStorage')) {
  Object.defineProperty(window, 'localStorage', { value: memoryStorage });
}

if (!isStorageAvailable('sessionStorage')) {
  Object.defineProperty(window, 'sessionStorage', { value: memoryStorage });
}
