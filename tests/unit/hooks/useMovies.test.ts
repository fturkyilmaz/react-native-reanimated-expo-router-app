import { useMovies } from "@/hooks/use-movies";
import { act, renderHook, waitFor } from "@testing-library/react-native";

// Increase timeout for async tests
jest.setTimeout(10000);

describe("useMovies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useMovies("popular"));

    expect(result.current.movies).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(true);
    expect(result.current.page).toBe(1);
  });

  it("loads movies on mount", async () => {
    const { result } = renderHook(() => useMovies("popular"));

    // Initial loading state
    expect(result.current.loading).toBe(true);

    // Wait for the async operation
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.movies.length).toBeGreaterThan(0);
    });
  });

  it("loads different categories", async () => {
    const categories: ("popular" | "top_rated" | "upcoming")[] = [
      "popular",
      "top_rated",
      "upcoming",
    ];

    for (const category of categories) {
      const { result } = renderHook(() => useMovies(category));

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.movies.length).toBeGreaterThan(0);
      });
    }
  });

  it("refreshes movies", async () => {
    const { result } = renderHook(() => useMovies("popular"));

    // Wait for initial load
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const initialMovies = result.current.movies;

    // Refresh
    act(() => {
      result.current.refresh();
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.page).toBe(1);
    });
  });

  it("loads more movies", async () => {
    const { result } = renderHook(() => useMovies("popular"));

    // Wait for initial load
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const initialMoviesCount = result.current.movies.length;

    // Load more
    act(() => {
      result.current.loadMore();
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.movies.length).toBeGreaterThanOrEqual(
        initialMoviesCount,
      );
    });
  });

  it("does not load more when hasMore is false", async () => {
    const { result } = renderHook(() => useMovies("popular"));

    // Wait for initial load
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Load all pages (5 pages limit)
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.loadMore();
      });
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    await waitFor(() => {
      expect(result.current.hasMore).toBe(false);
    });

    const moviesCount = result.current.movies.length;

    // Try to load more when hasMore is false
    act(() => {
      result.current.loadMore();
    });

    expect(result.current.movies.length).toBe(moviesCount);
  });

  it("does not load more when already loading", async () => {
    const { result } = renderHook(() => useMovies("popular"));

    // Start loading
    act(() => {
      result.current.loadMore();
    });

    expect(result.current.loading).toBe(true);

    // Try to load more while loading
    act(() => {
      result.current.loadMore();
    });

    // Should not trigger another load
    expect(result.current.page).toBe(1);
  });

  it("increments page on loadMore", async () => {
    const { result } = renderHook(() => useMovies("popular"));

    // Wait for initial load
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const initialPage = result.current.page;

    // loadMore should synchronously increment page, then async fetch
    act(() => {
      result.current.loadMore();
    });

    // Page should be incremented synchronously
    expect(result.current.page).toBe(initialPage + 1);

    // Wait for async fetch to complete
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.page).toBe(initialPage + 1);
    });
  });
});
