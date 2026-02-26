/**
 * use-profile Hook Unit Tests
 */

import { useChangePassword, useUpdateProfile, useUploadAvatar } from '@/hooks/use-profile';
import { useAuthStore } from '@/store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

// Mock dependencies
jest.mock('@/store/authStore', () => ({
    useAuthStore: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
    logger: {
        auth: {
            info: jest.fn(),
            error: jest.fn(),
        },
    },
    LOG_CATEGORIES: {
        AUTH: 'AUTH',
    },
}));

// Mock @/sentry to prevent expo import issues
jest.mock('@/sentry', () => ({
    init: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setUser: jest.fn(),
    setTag: jest.fn(),
    addBreadcrumb: jest.fn(),
}));

describe('use-profile Hook', () => {
    let queryClient: QueryClient;

    const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '',
        bio: '',
        token: 'test-token',
    };

    const mockSetUser = jest.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        (useAuthStore as unknown as jest.Mock).mockReturnValue({
            user: mockUser,
            setUser: mockSetUser,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient} >
            {children}
        </QueryClientProvider>
    );

    describe('useUpdateProfile', () => {
        it('should return mutation functions', () => {
            const { result } = renderHook(() => useUpdateProfile(), { wrapper });

            expect(result.current.mutate).toBeDefined();
            expect(result.current.mutateAsync).toBeDefined();
            expect(typeof result.current.mutate).toBe('function');
        });

        it('should return loading state', () => {
            const { result } = renderHook(() => useUpdateProfile(), { wrapper });

            expect(result.current.isPending).toBe(false);
            expect(result.current.isSuccess).toBe(false);
            expect(result.current.isError).toBe(false);
        });

        it('should update user on success', async () => {
            const { result } = renderHook(() => useUpdateProfile(), { wrapper });

            result.current.mutate({
                name: 'New Name',
                email: 'new@example.com',
                phone: '1234567890',
                bio: 'New bio',
            });

            await waitFor(() => {
                expect(mockSetUser).toHaveBeenCalledWith(
                    expect.objectContaining({
                        id: '1',
                        name: 'New Name',
                        email: 'new@example.com',
                        phone: '1234567890',
                        bio: 'New bio',
                    })
                );
            });
        });
    });

    describe('useChangePassword', () => {
        it('should return mutation functions', () => {
            const { result } = renderHook(() => useChangePassword(), { wrapper });

            expect(result.current.mutate).toBeDefined();
            expect(typeof result.current.mutate).toBe('function');
        });

        it('should complete password change', async () => {
            const { result } = renderHook(() => useChangePassword(), { wrapper });

            result.current.mutate({
                currentPassword: 'oldpassword',
                newPassword: 'newpassword123',
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });
        });
    });

    describe('useUploadAvatar', () => {
        it('should return mutation functions', () => {
            const { result } = renderHook(() => useUploadAvatar(), { wrapper });

            expect(result.current.mutate).toBeDefined();
            expect(typeof result.current.mutate).toBe('function');
        });

        it('should update user avatar on success', async () => {
            const { result } = renderHook(() => useUploadAvatar(), { wrapper });

            result.current.mutate('file://avatar.jpg');

            await waitFor(() => {
                expect(mockSetUser).toHaveBeenCalledWith(
                    expect.objectContaining({
                        avatar: expect.stringContaining('ui-avatars.com'),
                    })
                );
            });
        });
    });
});
