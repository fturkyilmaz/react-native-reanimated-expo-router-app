import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    token: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string, name: string) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });

                try {
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Validation
                    if (email === 'test@test.com' && password === '123456') {
                        const user = {
                            id: '1',
                            email,
                            name: 'Ahmet Yılmaz',
                            token: 'jwt_token_' + Date.now(),
                        };
                        set({ user, isAuthenticated: true, isLoading: false });
                    } else {
                        throw new Error('Geçersiz e-posta veya şifre');
                    }
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                set({ user: null, isAuthenticated: false, error: null });
            },

            register: async (email: string, password: string, name: string) => {
                set({ isLoading: true, error: null });

                try {
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    const user = {
                        id: Date.now().toString(),
                        email,
                        name,
                        token: 'jwt_token_' + Date.now(),
                    };

                    set({ user, isAuthenticated: true, isLoading: false });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);