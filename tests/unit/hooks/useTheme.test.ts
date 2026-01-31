import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useThemeStore } from "@/store/themeStore";
import { act, renderHook } from "@testing-library/react-native";

// Mock the store
jest.mock("@/store/themeStore", () => ({
  useThemeStore: jest.fn(),
}));

describe("useTheme", () => {
  const mockToggleTheme = jest.fn();
  const mockSetDarkMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns light theme when isDarkMode is false", () => {
    (useThemeStore as unknown as jest.Mock).mockReturnValue({
      isDarkMode: false,
      toggleTheme: mockToggleTheme,
      setDarkMode: mockSetDarkMode,
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.isDarkMode).toBe(false);
    expect(result.current.theme).toEqual(Colors.light);
    expect(result.current.colors).toEqual(Colors.light);
  });

  it("returns dark theme when isDarkMode is true", () => {
    (useThemeStore as unknown as jest.Mock).mockReturnValue({
      isDarkMode: true,
      toggleTheme: mockToggleTheme,
      setDarkMode: mockSetDarkMode,
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.isDarkMode).toBe(true);
    expect(result.current.theme).toEqual(Colors.dark);
    expect(result.current.colors).toEqual(Colors.dark);
  });

  it("exposes toggleTheme function", () => {
    (useThemeStore as unknown as jest.Mock).mockReturnValue({
      isDarkMode: false,
      toggleTheme: mockToggleTheme,
      setDarkMode: mockSetDarkMode,
    });

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it("exposes setDarkMode function", () => {
    (useThemeStore as unknown as jest.Mock).mockReturnValue({
      isDarkMode: false,
      toggleTheme: mockToggleTheme,
      setDarkMode: mockSetDarkMode,
    });

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setDarkMode(true);
    });

    expect(mockSetDarkMode).toHaveBeenCalledWith(true);
  });

  it("theme colors are correct for light mode", () => {
    (useThemeStore as unknown as jest.Mock).mockReturnValue({
      isDarkMode: false,
      toggleTheme: mockToggleTheme,
      setDarkMode: mockSetDarkMode,
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme.background).toBe("#f8f9fa");
    expect(result.current.theme.card).toBe("#ffffff");
    expect(result.current.theme.text).toBe("#1a1a1a");
    expect(result.current.theme.primary).toBe("#E50914");
  });

  it("theme colors are correct for dark mode", () => {
    (useThemeStore as unknown as jest.Mock).mockReturnValue({
      isDarkMode: true,
      toggleTheme: mockToggleTheme,
      setDarkMode: mockSetDarkMode,
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme.background).toBe("#0f0f0f");
    expect(result.current.theme.card).toBe("#1a1a1a");
    expect(result.current.theme.text).toBe("#ffffff");
    expect(result.current.theme.primary).toBe("#E50914");
  });
});
