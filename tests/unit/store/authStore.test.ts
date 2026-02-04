import { StorageKey } from "@/security";
import { useAuthStore } from "@/store/authStore";
import { act } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";

jest.mock("@/services/local-db.service", () => ({
  UserService: {
    upsert: jest.fn(),
    delete: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

jest.mock("@/services/supabase-auth", () => ({
  supabaseAuth: {
    isConfigured: jest.fn(() => false),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
}));

describe("authStore", () => {
  const initialState = useAuthStore.getState();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState(initialState, true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with correct default state", () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.isTransitioning).toBe(false);
    expect(state.error).toBeNull();
    expect(state.pendingNavigation).toBe(false);
  });

  it("logs in successfully with correct credentials", async () => {
    await act(async () => {
      await useAuthStore.getState().login("test@test.com", "123456");
    });

    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user?.email).toBe("test@test.com");
    expect(state.user?.name).toBe("Furkan");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.isTransitioning).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      StorageKey.AUTH_TOKEN,
      expect.any(String),
      expect.objectContaining({ keychainService: "com.cinesearch.secure" }),
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      StorageKey.USER_DATA,
      expect.any(String),
      expect.objectContaining({ keychainService: "com.cinesearch.secure" }),
    );
  });

  it("fails login with incorrect credentials", async () => {
    let thrown: Error | null = null;
    await act(async () => {
      try {
        await useAuthStore.getState().login("wrong@email.com", "wrongpassword");
      } catch (err) {
        thrown = err as Error;
      }
    });

    expect(thrown?.message).toBe("Geçersiz e-posta veya şifre");

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe("Geçersiz e-posta veya şifre");
    expect(state.isLoading).toBe(false);
  });

  it("logs out successfully", async () => {
    // First login
    await act(async () => {
      await useAuthStore.getState().login("test@test.com", "123456");
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Then logout
    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(StorageKey.AUTH_TOKEN);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(StorageKey.USER_DATA);
  });

  it("registers successfully", async () => {
    jest.useFakeTimers();
    await act(async () => {
      const registerPromise = useAuthStore.getState().register(
        "new@user.com",
        "password123",
        "New User",
      );
      jest.advanceTimersByTime(1500);
      await registerPromise;
    });

    const state = useAuthStore.getState();
    expect(state.user).not.toBeNull();
    expect(state.user?.email).toBe("new@user.com");
    expect(state.user?.name).toBe("New User");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.isTransitioning).toBe(true);
    jest.useRealTimers();
  });

  it("clears error", async () => {
    // Trigger an error
    try {
      await act(async () => {
        await useAuthStore.getState().login("wrong@email.com", "wrongpassword");
      });
    } catch (e) {
      // Expected
    }

    expect(useAuthStore.getState().error).not.toBeNull();

    act(() => {
      useAuthStore.getState().clearError();
    });

    expect(useAuthStore.getState().error).toBeNull();
  });

  it("completes transition", async () => {
    await act(async () => {
      await useAuthStore.getState().login("test@test.com", "123456");
    });

    const stateBefore = useAuthStore.getState();
    expect(stateBefore.isTransitioning).toBe(true);
    expect(stateBefore.pendingNavigation).toBe(false);

    act(() => {
      useAuthStore.getState().completeTransition();
    });

    const stateAfter = useAuthStore.getState();
    expect(stateAfter.isTransitioning).toBe(false);
    expect(stateAfter.pendingNavigation).toBe(false);
  });

  it("sets pending navigation", () => {
    act(() => {
      useAuthStore.getState().setPendingNavigation(true);
    });

    expect(useAuthStore.getState().pendingNavigation).toBe(true);

    act(() => {
      useAuthStore.getState().setPendingNavigation(false);
    });

    expect(useAuthStore.getState().pendingNavigation).toBe(false);
  });

  it("sets loading state during login", async () => {
    jest.useFakeTimers();
    expect(useAuthStore.getState().isLoading).toBe(false);

    const loginPromise = useAuthStore.getState().login("test@test.com", "123456");
    expect(useAuthStore.getState().isLoading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await loginPromise;
    });

    expect(useAuthStore.getState().isLoading).toBe(false);
    jest.useRealTimers();
  });

  it("sets loading state during register", async () => {
    jest.useFakeTimers();
    expect(useAuthStore.getState().isLoading).toBe(false);

    const registerPromise = useAuthStore.getState().register(
      "new@user.com",
      "password123",
      "New User",
    );
    expect(useAuthStore.getState().isLoading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(1500);
      await registerPromise;
    });

    expect(useAuthStore.getState().isLoading).toBe(false);
    jest.useRealTimers();
  });

  it("generates unique tokens for each login", async () => {
    jest.useFakeTimers();
    await act(async () => {
      const loginPromise = useAuthStore.getState().login("test@test.com", "123456");
      jest.advanceTimersByTime(1000);
      await loginPromise;
    });

    const firstToken = useAuthStore.getState().user?.token;

    // Logout and login again
    await act(async () => {
      await useAuthStore.getState().logout();
    });

    // Small delay to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    await act(async () => {
      const loginPromise = useAuthStore.getState().login("test@test.com", "123456");
      jest.advanceTimersByTime(1000);
      await loginPromise;
    });

    const secondToken = useAuthStore.getState().user?.token;

    expect(firstToken).not.toBe(secondToken);
    jest.useRealTimers();
  });

  it("generates unique IDs for each registration", async () => {
    jest.useFakeTimers();
    await act(async () => {
      const registerPromise = useAuthStore.getState().register(
        "user1@test.com",
        "password123",
        "User 1",
      );
      jest.advanceTimersByTime(1500);
      await registerPromise;
    });

    const firstId = useAuthStore.getState().user?.id;

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await act(async () => {
      const registerPromise = useAuthStore.getState().register(
        "user2@test.com",
        "password123",
        "User 2",
      );
      jest.advanceTimersByTime(1500);
      await registerPromise;
    });

    const secondId = useAuthStore.getState().user?.id;

    expect(firstId).not.toBe(secondId);
    jest.useRealTimers();
  });
});
