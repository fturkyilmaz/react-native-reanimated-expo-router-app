// @ts-nocheck
import { BiometricType } from '@/hooks/useBiometricAuth';
import { SecureStorage, StorageKey } from '@/security';
import { UserService } from '@/services/local-db.service';
import { supabaseAuth } from '@/services/supabase-auth';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    phone?: string;
    bio?: string;
    token: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isHydrated: boolean;
    isTransitioning: boolean;
    error: string | null;
    pendingNavigation: boolean;
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
    setUser: (user: Partial<User>) => void;
    enableBiometric: (type: BiometricType) => Promise<void>;
    disableBiometric: () => Promise<void>;
    updateLastAuthenticated: () => void;
    setHydrated: (hydrated: boolean) => void;
}

const secureStorage = SecureStorage.getInstance();

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isHydrated: false,
            pendingNavigation: false,
            isTransitioning: false,
            error: null,
            isBiometricEnabled: false,
            biometricType: 'none',
            lastAuthenticatedAt: null,

            completeTransition: () => set({ isTransitioning: false, pendingNavigation: false }),
            setPendingNavigation: (pendingNavigation) => set({ pendingNavigation }),

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });

                try {
                    if (supabaseAuth.isConfigured()) {
                        const result = await supabaseAuth.signIn(email, password);
                        if (result.error) {
                            throw new Error(result.error);
                        }

                        console.log('[DEBUG-AuthStore] Login success, user:', result.user);
                        if (result.user) {

                            // Save to SQLite
                            await UserService.upsert({
                                id: result.user.id,
                                email: result.user.email,
                                name: result.user.name,
                                avatar: result.user.avatar,
                                token: result.user.token,
                            });

                            console.log('[DEBUG-AuthStore] Result success, user:', result);

                            set({
                                user: result.user,
                                isAuthenticated: true,
                                isLoading: false,
                                isTransitioning: true
                            });
                        }
                    } else {
                        // Fallback to mock login
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        if (email === 'test@test.com' && password === '123456') {
                            const mockUser: User = {
                                id: '1',
                                email,
                                name: 'Furkan',
                                token: 'jwt_token_' + Date.now(),
                            };

                            // Save to SQLite
                            await UserService.upsert({
                                id: mockUser.id,
                                email: mockUser.email,
                                name: mockUser.name,
                                token: mockUser.token,
                            });

                            await secureStorage.setSecureItem(StorageKey.AUTH_TOKEN, mockUser.token);
                            await secureStorage.setObject(StorageKey.USER_DATA, mockUser, true);

                            set({ user: mockUser, isAuthenticated: true, isLoading: false, isTransitioning: true });
                        } else {
                            throw new Error('Geçersiz e-posta veya şifre');
                        }
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu';
                    set({ error: errorMessage, isLoading: false, isTransitioning: false });
                    throw error;
                }
            },

            logout: async () => {
                // Clear Supabase session if configured
                try {
                    const { supabaseAuth } = await import('@/services/supabase-auth');
                    if (supabaseAuth.isConfigured()) {
                        await supabaseAuth.signOut();
                    }
                } catch {
                    // Ignore Supabase logout errors
                }

                // Clear SQLite
                try {
                    const currentUser = get().user;
                    if (currentUser?.id) {
                        await UserService.delete(currentUser.id);
                    } else {
                        const sqliteUser = await UserService.getCurrentUser();
                        if (sqliteUser?.id) {
                            await UserService.delete(sqliteUser.id);
                        }
                    }
                } catch {
                    // Ignore SQLite delete errors
                }

                // Clear secure storage
                secureStorage.deleteSecureItem(StorageKey.AUTH_TOKEN);
                secureStorage.deleteSecureItem(StorageKey.USER_DATA);

                set({
                    user: null,
                    isAuthenticated: false,
                    error: null,
                    isBiometricEnabled: false,
                    biometricType: 'none',
                    lastAuthenticatedAt: null,
                    isTransitioning: false
                });
            },

            register: async (email: string, password: string, name: string) => {
                set({ isLoading: true, error: null });

                try {
                    if (supabaseAuth.isConfigured()) {
                        const result = await supabaseAuth.signUp(email, password, name);
                        if (result.error) {
                            throw new Error(result.error);
                        }
                        if (result.user) {
                            // Save to SQLite
                            await UserService.upsert({
                                id: result.user.id,
                                email: result.user.email,
                                name: result.user.name,
                                avatar: result.user.avatar,
                                token: result.user.token,
                            });

                            set({
                                user: result.user,
                                isAuthenticated: true,
                                isLoading: false,
                                isTransitioning: true
                            });
                        }
                    } else {
                        // Mock registration
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        const mockUser: User = {
                            id: Date.now().toString(),
                            email,
                            name,
                            token: 'jwt_token_' + Date.now(),
                        };

                        await UserService.upsert({
                            id: mockUser.id,
                            email: mockUser.email,
                            name: mockUser.name,
                            token: mockUser.token,
                        });

                        await secureStorage.setSecureItem(StorageKey.AUTH_TOKEN, mockUser.token);
                        await secureStorage.setObject(StorageKey.USER_DATA, mockUser, true);

                        set({ user: mockUser, isAuthenticated: true, isLoading: false, isTransitioning: true });
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Kayıt olurken bir hata oluştu';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            clearError: () => set({ error: null }),

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

            setHydrated: (hydrated) => set({ isHydrated: hydrated }),

            setUser: async (updates) => {
                const currentUser = get().user;
                if (currentUser) {
                    const updatedUser = { ...currentUser, ...updates };
                    set({ user: updatedUser });

                    // Persist to SQLite
                    await UserService.upsert(updatedUser);

                    // Also persist to secure storage
                    await secureStorage.setObject(StorageKey.USER_DATA, updatedUser, true);
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => ({
                getItem: async (name) => {
                    try {
                        const value = await SecureStore.getItemAsync(name);
                        return value;
                    } catch {
                        return null;
                    }
                },
                setItem: async (name, value) => {
                    try {
                        await SecureStore.setItemAsync(name, value, {
                            keychainService: 'com.cinesearch.auth',
                            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
                        });
                    } catch {
                        console.error(`[AuthStore] Failed to set item: ${name}`);
                    }
                },
                removeItem: async (name) => {
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
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Also restore user from SQLite
                    const restoreUser = async () => {
                        try {
                            const sqliteUser = await UserService.getCurrentUser();
                            if (sqliteUser && !state.user) {
                                state.setUser({
                                    id: sqliteUser.id,
                                    email: sqliteUser.email,
                                    name: sqliteUser.name || '',
                                    avatar: sqliteUser.avatar || undefined,
                                    token: sqliteUser.token || '',
                                });
                            }
                        } catch {
                            // Ignore SQLite errors during restore
                        }
                    };
                    restoreUser();
                    state.setHydrated(true);
                }
            },
        }
    )
);
