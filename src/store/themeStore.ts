import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * SecureStore adapter for Zustand persist middleware
 * Uses expo-secure-store for all persisted data
 */
const secureStoreStorage = createJSONStorage(() => ({
    getItem: async (name: string): Promise<string | null> => {
        try {
            const value = await SecureStore.getItemAsync(name);
            return value;
        } catch {
            console.error(`[ThemeStore] Failed to get item: ${name}`);
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(name, value, {
                keychainService: 'com.cinesearch.theme',
                keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });
        } catch {
            console.error(`[ThemeStore] Failed to set item: ${name}`);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(name);
        } catch {
            console.error(`[ThemeStore] Failed to remove item: ${name}`);
        }
    },
}));

interface ThemeState {
    isDarkMode: boolean;
    toggleTheme: () => void;
    setDarkMode: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            isDarkMode: false,
            toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
            setDarkMode: (value) => set({ isDarkMode: value }),
        }),
        {
            name: 'theme-storage',
            storage: secureStoreStorage,
        }
    )
);
