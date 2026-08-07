import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to sync state with localStorage
 * @param key - The localStorage key
 * @param initialValue - The initial value if key doesn't exist
 * @returns Tuple of [value, setValue] where setValue persists to localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that
    // persists the new value to localStorage.
    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                setStoredValue(prev => {
                    // Allow value to be a function so we have same API as useState
                    const valueToStore = value instanceof Function ? value(prev) : value;

                    // Save to local storage
                    if (typeof window !== 'undefined') {
                        window.localStorage.setItem(key, JSON.stringify(valueToStore));
                    }

                    return valueToStore;
                });
            } catch (error) {
                console.error(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key],
    );

    // Listen for changes from other tabs/windows
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key !== key) return;

            if (e.newValue === null) {
                setStoredValue(initialValue);
                return;
            }

            try {
                setStoredValue(JSON.parse(e.newValue));
            } catch (error) {
                console.error(`Error parsing localStorage value for key "${key}":`, error);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [initialValue, key]);

    return [storedValue, setValue];
}
