import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
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
    isTransitioning: boolean;
    error: string | null;
    pendingNavigation: boolean;
    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string, name: string) => Promise<void>;
    clearError: () => void;
    completeTransition: () => void;
    setPendingNavigation: (pendingNavigation: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            pendingNavigation: false,
            isTransitioning: false,
            error: null,

            completeTransition: () => set({ isTransitioning: false, pendingNavigation: false }),
            setPendingNavigation: (pendingNavigation: boolean) => set({ pendingNavigation }),
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
                            name: 'Furkan',
                            token: 'jwt_token_' + Date.now(),
                        };
                        await SecureStore.setItemAsync('userToken', user.token);
                        await SecureStore.setItemAsync('userData', JSON.stringify(user));
                        set({ user, isAuthenticated: true, isLoading: false, isTransitioning: true });

                    } else {
                        throw new Error('Geçersiz e-posta veya şifre');
                    }
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                SecureStore.deleteItemAsync('userToken');
                SecureStore.deleteItemAsync('userData');
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
                    await SecureStore.setItemAsync('userToken', user.token);
                    await SecureStore.setItemAsync('userData', JSON.stringify(user));
                    set({ user, isAuthenticated: true, isLoading: false, isTransitioning: true });
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