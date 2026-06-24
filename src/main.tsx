// Safe fallback for standard storage if accessed in sandboxed security environments
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

let storageAccessible = false;
try {
  const testKey = '__storage_test_key__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
  storageAccessible = true;
} catch (e) {
  storageAccessible = false;
}

if (!storageAccessible) {
  console.warn("Local storage is restricted or disabled. Injecting multi-layered in-memory fallback.");
  const mockStorageLeft = createMockStorage();
  const mockStorageSession = createMockStorage();

  // 1. Try deleting native properties to make them writable
  try {
    delete (window as any).localStorage;
  } catch (e) {}
  try {
    delete (window as any).sessionStorage;
  } catch (e) {}

  // 2. Try direct assignment
  try {
    (window as any).localStorage = mockStorageLeft;
  } catch (e) {}
  try {
    (window as any).sessionStorage = mockStorageSession;
  } catch (e) {}

  // 3. Try Object.defineProperty on window
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorageLeft,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (err) {}
  try {
    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorageSession,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (err) {}

  // 4. Try Object.defineProperty on Window.prototype (very effective in modern browsers)
  try {
    const proto = Window.prototype;
    Object.defineProperty(proto, 'localStorage', {
      get() { return mockStorageLeft; },
      configurable: true,
      enumerable: true
    });
  } catch (err) {}
  try {
    const proto = Window.prototype;
    Object.defineProperty(proto, 'sessionStorage', {
      get() { return mockStorageSession; },
      configurable: true,
      enumerable: true
    });
  } catch (err) {}

  // 5. Try defining on window constructor prototype as well
  try {
    const proto = (window as any).constructor?.prototype;
    if (proto && proto !== Window.prototype) {
      Object.defineProperty(proto, 'localStorage', {
        get() { return mockStorageLeft; },
        configurable: true,
        enumerable: true
      });
      Object.defineProperty(proto, 'sessionStorage', {
        get() { return mockStorageSession; },
        configurable: true,
        enumerable: true
      });
    }
  } catch (err) {}
}

import React, {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
