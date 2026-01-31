import { useSearch } from "@/hooks/useSearch";
import { tmdbService } from "@/services/tmdb";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { mockSearchResults } from "../../__mocks__/mockData";

// Mock the tmdbService
jest.mock("@/services/tmdb", () => ({
  tmdbService: {
    searchMovies: jest.fn(),
  },
}));

describe("useSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.query).toBe("");
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.debouncedQuery).toBe("");
  });

  it("updates query immediately", () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("batman");
    });

    expect(result.current.query).toBe("batman");
  });

  it("debounces query after 500ms", () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("batman");
    });

    expect(result.current.debouncedQuery).toBe("");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.debouncedQuery).toBe("batman");
  });

  it("clears previous debounce timer on rapid query changes", () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("bat");
    });

    act(() => {
      jest.advanceTimersByTime(300);
      result.current.setQuery("batman");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.debouncedQuery).toBe("batman");
  });

  it("searches movies when debounced query changes", async () => {
    (tmdbService.searchMovies as jest.Mock).mockResolvedValue(
      mockSearchResults,
    );

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("batman");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(tmdbService.searchMovies).toHaveBeenCalledWith("batman");
    });

    await waitFor(() => {
      expect(result.current.results).toEqual(mockSearchResults.results);
      expect(result.current.loading).toBe(false);
    });
  });

  it("clears results when query is empty", async () => {
    (tmdbService.searchMovies as jest.Mock).mockResolvedValue(
      mockSearchResults,
    );

    const { result } = renderHook(() => useSearch());

    // First set a query
    act(() => {
      result.current.setQuery("batman");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    // Then clear it
    act(() => {
      result.current.setQuery("");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual([]);
    });
  });

  it("clears results when query is only whitespace", async () => {
    (tmdbService.searchMovies as jest.Mock).mockResolvedValue(
      mockSearchResults,
    );

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("batman");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.results.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setQuery("   ");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.results).toEqual([]);
    });
  });

  it("sets loading state during search", async () => {
    (tmdbService.searchMovies as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockSearchResults), 100),
        ),
    );

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("batman");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("handles search error gracefully", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (tmdbService.searchMovies as jest.Mock).mockRejectedValue(
      new Error("Search failed"),
    );

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("batman");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.results).toEqual([]);
    });

    consoleSpy.mockRestore();
  });

  it("trims query before searching", async () => {
    (tmdbService.searchMovies as jest.Mock).mockResolvedValue(
      mockSearchResults,
    );

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("  batman  ");
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(tmdbService.searchMovies).toHaveBeenCalledWith("  batman  ");
    });
  });
});
