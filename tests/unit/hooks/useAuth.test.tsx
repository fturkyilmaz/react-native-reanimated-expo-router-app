import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import React from 'react';

// Mock modules
jest.mock('expo-secure-store');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');

    consoleSpy.mockRestore();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('checks auth on mount with no stored token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it('loads user from storage on mount', async () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      name: 'Test User',
      token: 'mock_token',
    };

    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce('mock_token')
      .mockResolvedValueOnce(JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('logs in successfully with correct credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@test.com', '123456');
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe('test@test.com');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', expect.any(String));
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userData', expect.any(String));
  });

  it('fails login with incorrect credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(
      result.current.login('wrong@email.com', 'wrongpassword')
    ).rejects.toThrow('Geçersiz e-posta veya şifre');

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Geçersiz e-posta veya şifre');
  });

  it('logs out successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // First login
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@test.com', '123456');
    });

    expect(result.current.user).not.toBeNull();

    // Then logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userData');
  });

  it('registers successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.register('new@user.com', 'password123', 'New User');
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe('new@user.com');
    expect(result.current.user?.name).toBe('New User');
  });

  it('clears error', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Trigger an error
    try {
      await result.current.login('wrong@email.com', 'wrongpassword');
    } catch (e) {
      // Expected
    }

    expect(result.current.error).not.toBeNull();

    // Error will be cleared on next login attempt
    await act(async () => {
      try {
        await result.current.login('test@test.com', '123456');
      } catch (e) {
        // Ignore
      }
    });

    // After successful login, error should be cleared
    expect(result.current.error).toBeNull();
  });

  it('completes transition', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@test.com', '123456');
    });

    expect(result.current.isTransitioning).toBe(true);

    act(() => {
      result.current.completeTransition();
    });

    expect(result.current.isTransitioning).toBe(false);
  });

  it('sets loading state during login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const loginPromise = act(async () => {
      await result.current.login('test@test.com', '123456');
    });

    expect(result.current.isLoading).toBe(true);

    await loginPromise;

    expect(result.current.isLoading).toBe(false);
  });
});
