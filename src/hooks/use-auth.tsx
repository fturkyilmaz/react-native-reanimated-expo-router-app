import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isTransitioning: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    completeTransition: () => void;
}

interface User {
    id: string;
    email: string;
    name: string;
    token: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false); // Animasyon state'i
    const [error, setError] = useState<string | null>(null);
    const [pendingNavigation, setPendingNavigation] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    // Transition bittiğinde navigation yap
    useEffect(() => {
        if (!isTransitioning && pendingNavigation && user) {
            router.replace('/(tabs)');
            setPendingNavigation(false);
        }
    }, [isTransitioning, pendingNavigation, user]);

    const checkAuth = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                const userData = await SecureStore.getItemAsync('userData');
                if (userData) {
                    setUser(JSON.parse(userData));
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            if (email === 'test@test.com' && password === '123456') {
                const mockUser = {
                    id: '1',
                    email,
                    name: 'Furkan',
                    token: 'mock_jwt_token_' + Date.now(),
                };

                await SecureStore.setItemAsync('userToken', mockUser.token);
                await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));

                setUser(mockUser);
                setIsTransitioning(true);
            } else {
                throw new Error('Geçersiz e-posta veya şifre');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Giriş yapılırken bir hata oluştu';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, password: string, name: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockUser = {
                id: Date.now().toString(),
                email,
                name,
                token: 'mock_jwt_token_' + Date.now(),
            };

            await SecureStore.setItemAsync('userToken', mockUser.token);
            await SecureStore.setItemAsync('userData', JSON.stringify(mockUser));

            setUser(mockUser);
            setIsTransitioning(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Kayıt olurken bir hata oluştu';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const completeTransition = () => {
        setIsTransitioning(false);
        setPendingNavigation(true);
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
        setUser(null);
        router.replace('/(auth)/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isTransitioning,
            error,
            login,
            logout,
            register,
            completeTransition
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};