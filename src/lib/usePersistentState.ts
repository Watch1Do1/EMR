import { useState, useEffect, useCallback } from 'react';

/**
 * A robust custom state hook that persists values in localStorage and syncs across different instances / tabs.
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Read value from localStorage, or use initialValue
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(`Error reading persistent key "${key}":`, e);
    }
    return initialValue;
  });

  // Keep state updated when localStorage changes inside other tabs/components
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          setState(parsed);
        } else {
          setState(initialValue);
        }
      } catch (e) {
        console.error(`Sync error for persistent key "${key}":`, e);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  // Set value function that updates state and localStorage and fires storage events
  const setPersistedValue = useCallback((value: T | ((prev: T) => T)) => {
    setState((prev) => {
      const nextValue = value instanceof Function ? value(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(nextValue));
        // Fire custom event to notify other listeners on the same page/thread
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error(`Error writing persistent key "${key}":`, e);
      }
      return nextValue;
    });
  }, [key]);

  return [state, setPersistedValue];
}
