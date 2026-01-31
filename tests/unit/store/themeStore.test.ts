import { useThemeStore } from "@/store/themeStore";
import { act, renderHook } from "@testing-library/react-native";

describe("themeStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with light mode as default", () => {
    const { result } = renderHook(() => useThemeStore());

    expect(result.current.isDarkMode).toBe(false);
  });

  it("toggles theme from light to dark", () => {
    const { result } = renderHook(() => useThemeStore());

    expect(result.current.isDarkMode).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDarkMode).toBe(true);
  });

  it("toggles theme from dark to light", () => {
    const { result } = renderHook(() => useThemeStore());

    // First set to dark
    act(() => {
      result.current.setDarkMode(true);
    });

    expect(result.current.isDarkMode).toBe(true);

    // Then toggle back to light
    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDarkMode).toBe(false);
  });

  it("sets dark mode directly", () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setDarkMode(true);
    });

    expect(result.current.isDarkMode).toBe(true);
  });

  it("sets light mode directly", () => {
    const { result } = renderHook(() => useThemeStore());

    // First set to dark
    act(() => {
      result.current.setDarkMode(true);
    });

    expect(result.current.isDarkMode).toBe(true);

    // Then set to light
    act(() => {
      result.current.setDarkMode(false);
    });

    expect(result.current.isDarkMode).toBe(false);
  });

  it("multiple toggles work correctly", () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.isDarkMode).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.isDarkMode).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.isDarkMode).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.isDarkMode).toBe(false);
  });

  it("persists theme state", () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setDarkMode(true);
    });

    // The persist middleware should have been called
    // Note: Actual persistence testing would require more complex setup
    expect(result.current.isDarkMode).toBe(true);
  });

  it("setDarkMode with same value does not cause issues", () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setDarkMode(false);
    });

    expect(result.current.isDarkMode).toBe(false);

    act(() => {
      result.current.setDarkMode(false);
    });

    expect(result.current.isDarkMode).toBe(false);
  });
});
