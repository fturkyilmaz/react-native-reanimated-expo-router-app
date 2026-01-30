import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);