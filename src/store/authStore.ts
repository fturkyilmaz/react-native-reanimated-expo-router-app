import { BiometricType } from '@/hooks/useBiometricAuth';
import { SecureStorage, StorageKey } from '@/security';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Initialize secure storage instance
const secureStorage = SecureStorage.getInstance();

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
    // Biometric fields
    isBiometricEnabled: boolean;
    biometricType: BiometricType;
    lastAuthenticatedAt: number | null;
    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string, name: string) => Promise<void>;
    clearError: () => void;
    completeTransition: () => void;
    setPendingNavigation: (pendingNavigation: boolean) => void;
    // Biometric actions
    enableBiometric: (type: BiometricType) => Promise<void>;
    disableBiometric: () => Promise<void>;
    updateLastAuthenticated: () => void;
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
            // Biometric initial state
            isBiometricEnabled: false,
            biometricType: 'none',
            lastAuthenticatedAt: null,

            completeTransition: () => set({ isTransitioning: false, pendingNavigation: false }),
            setPendingNavigation: (pendingNavigation: boolean) => set({ pendingNavigation }),
            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });

                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    if (email === 'test@test.com' && password === '123456') {
                        set({ isTransitioning: true });
                        const user = {
                            id: '1',
                            email,
                            name: 'Furkan',
                            token: 'jwt_token_' + Date.now(),
                        };
                        await secureStorage.setSecureItem(StorageKey.AUTH_TOKEN, user.token);
                        await secureStorage.setObject(StorageKey.USER_DATA, user, true);
                        set({ user, isAuthenticated: true, isLoading: false });

                    } else {
                        throw new Error('Geçersiz e-posta veya şifre');
                    }
                } catch (error: any) {
                    set({ error: error.message, isLoading: false, isTransitioning: false });
                    throw error;
                }
            },

            logout: () => {
                secureStorage.deleteSecureItem(StorageKey.AUTH_TOKEN);
                secureStorage.deleteSecureItem(StorageKey.USER_DATA);
                set({ user: null, isAuthenticated: false, error: null, isBiometricEnabled: false, biometricType: 'none', lastAuthenticatedAt: null, isTransitioning: false });
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
                    await secureStorage.setSecureItem(StorageKey.AUTH_TOKEN, user.token);
                    await secureStorage.setObject(StorageKey.USER_DATA, user, true);
                    set({ user, isAuthenticated: true, isLoading: false, isTransitioning: true });
                } catch (error: any) {
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            clearError: () => set({ error: null }),

            // Biometric actions
            enableBiometric: async (type: BiometricType) => {
                try {
                    await secureStorage.setSecureItem(StorageKey.BIOMETRIC_ENABLED, 'true');
                    await secureStorage.setItem(StorageKey.SECURITY_SETTINGS, JSON.stringify({ biometricType: type }));
                    set({ isBiometricEnabled: true, biometricType: type });
                } catch (error) {
                    console.error('Error enabling biometric:', error);
                    throw error;
                }
            },

            disableBiometric: async () => {
                try {
                    await secureStorage.deleteSecureItem(StorageKey.BIOMETRIC_ENABLED);
                    await secureStorage.deleteItem(StorageKey.SECURITY_SETTINGS);
                    set({ isBiometricEnabled: false, biometricType: 'none', lastAuthenticatedAt: null });
                } catch (error) {
                    console.error('Error disabling biometric:', error);
                    throw error;
                }
            },

            updateLastAuthenticated: () => {
                set({ lastAuthenticatedAt: Date.now() });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => ({
                getItem: async (name: string): Promise<string | null> => {
                    try {
                        const value = await SecureStore.getItemAsync(name);
                        return value;
                    } catch {
                        console.error(`[AuthStore] Failed to get item: ${name}`);
                        return null;
                    }
                },
                setItem: async (name: string, value: string): Promise<void> => {
                    try {
                        await SecureStore.setItemAsync(name, value, {
                            keychainService: 'com.cinesearch.auth',
                            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                        });
                    } catch {
                        console.error(`[AuthStore] Failed to set item: ${name}`);
                    }
                },
                removeItem: async (name: string): Promise<void> => {
                    try {
                        await SecureStore.deleteItemAsync(name);
                    } catch {
                        console.error(`[AuthStore] Failed to remove item: ${name}`);
                    }
                },
            })),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                isBiometricEnabled: state.isBiometricEnabled,
                biometricType: state.biometricType,
                lastAuthenticatedAt: state.lastAuthenticatedAt,
            }),
        }
    )
);