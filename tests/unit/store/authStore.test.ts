import { useAuthStore } from "@/store/authStore";
import { act, renderHook } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

// Mock SecureStore
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe("authStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pendingNavigation).toBe(false);
  });

  it("logs in successfully with correct credentials", async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login("test@test.com", "123456");
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe("test@test.com");
    expect(result.current.user?.name).toBe("Furkan");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isTransitioning).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "userToken",
      expect.any(String),
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "userData",
      expect.any(String),
    );
  });

  it("fails login with incorrect credentials", async () => {
    const { result } = renderHook(() => useAuthStore());

    await expect(
      act(async () => {
        await result.current.login("wrong@email.com", "wrongpassword");
      }),
    ).rejects.toThrow("Geçersiz e-posta veya şifre");

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe("Geçersiz e-posta veya şifre");
    expect(result.current.isLoading).toBe(false);
  });

  it("logs out successfully", async () => {
    const { result } = renderHook(() => useAuthStore());

    // First login
    await act(async () => {
      await result.current.login("test@test.com", "123456");
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("userToken");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("userData");
  });

  it("registers successfully", async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.register("new@user.com", "password123", "New User");
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.email).toBe("new@user.com");
    expect(result.current.user?.name).toBe("New User");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isTransitioning).toBe(true);
  });

  it("clears error", async () => {
    const { result } = renderHook(() => useAuthStore());

    // Trigger an error
    try {
      await act(async () => {
        await result.current.login("wrong@email.com", "wrongpassword");
      });
    } catch (e) {
      // Expected
    }

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("completes transition", async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login("test@test.com", "123456");
    });

    expect(result.current.isTransitioning).toBe(true);
    expect(result.current.pendingNavigation).toBe(false);

    act(() => {
      result.current.completeTransition();
    });

    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.pendingNavigation).toBe(false);
  });

  it("sets pending navigation", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setPendingNavigation(true);
    });

    expect(result.current.pendingNavigation).toBe(true);

    act(() => {
      result.current.setPendingNavigation(false);
    });

    expect(result.current.pendingNavigation).toBe(false);
  });

  it("sets loading state during login", async () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.isLoading).toBe(false);

    const loginPromise = act(async () => {
      await result.current.login("test@test.com", "123456");
    });

    // During login, loading should be true
    expect(result.current.isLoading).toBe(true);

    await loginPromise;

    expect(result.current.isLoading).toBe(false);
  });

  it("sets loading state during register", async () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.isLoading).toBe(false);

    const registerPromise = act(async () => {
      await result.current.register("new@user.com", "password123", "New User");
    });

    expect(result.current.isLoading).toBe(true);

    await registerPromise;

    expect(result.current.isLoading).toBe(false);
  });

  it("generates unique tokens for each login", async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login("test@test.com", "123456");
    });

    const firstToken = result.current.user?.token;

    // Logout and login again
    act(() => {
      result.current.logout();
    });

    // Small delay to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    await act(async () => {
      await result.current.login("test@test.com", "123456");
    });

    const secondToken = result.current.user?.token;

    expect(firstToken).not.toBe(secondToken);
  });

  it("generates unique IDs for each registration", async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.register("user1@test.com", "password123", "User 1");
    });

    const firstId = result.current.user?.id;

    act(() => {
      result.current.logout();
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await act(async () => {
      await result.current.register("user2@test.com", "password123", "User 2");
    });

    const secondId = result.current.user?.id;

    expect(firstId).not.toBe(secondId);
  });
});
