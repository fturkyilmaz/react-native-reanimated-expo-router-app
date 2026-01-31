import { tmdbService } from "@/services/tmdb";
import {
    mockApiResponse,
    mockMovieDetails
} from "../../__mocks__/mockData";

describe("tmdbService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe("getPopularMovies", () => {
    it("fetches popular movies successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await tmdbService.getPopularMovies();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/movie/popular"),
      );
      expect(result.results).toEqual(mockApiResponse.results);
      expect(result.total_pages).toBe(mockApiResponse.total_pages);
    });

    it("fetches popular movies with specific page", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      await tmdbService.getPopularMovies(3);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=3"),
      );
    });

    it("throws error on HTTP error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(tmdbService.getPopularMovies()).rejects.toThrow(
        "HTTP Error: 404",
      );
    });

    it("throws error on network failure", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await expect(tmdbService.getPopularMovies()).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("getTopRated", () => {
    it("fetches top rated movies successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await tmdbService.getTopRated();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/movie/top_rated"),
      );
      expect(result.results).toEqual(mockApiResponse.results);
    });

    it("fetches top rated movies with specific page", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      await tmdbService.getTopRated(2);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2"),
      );
    });
  });

  describe("getUpcoming", () => {
    it("fetches upcoming movies successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await tmdbService.getUpcoming();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/movie/upcoming"),
      );
      expect(result.results).toEqual(mockApiResponse.results);
    });
  });

  describe("getMovieDetails", () => {
    it("fetches movie details successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMovieDetails),
      });

      const result = await tmdbService.getMovieDetails(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/movie/1"),
      );
      expect(result.id).toBe(mockMovieDetails.id);
      expect(result.title).toBe(mockMovieDetails.title);
      expect(result.runtime).toBe(mockMovieDetails.runtime);
      expect(result.genres).toEqual(mockMovieDetails.genres);
    });

    it("throws error for non-existent movie", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(tmdbService.getMovieDetails(99999)).rejects.toThrow(
        "HTTP Error: 404",
      );
    });
  });

  describe("searchMovies", () => {
    it("searches movies successfully", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await tmdbService.searchMovies("batman");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("query=batman"),
      );
      expect(result.results).toEqual(mockApiResponse.results);
    });

    it("encodes special characters in search query", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      await tmdbService.searchMovies("star wars");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("query=star%20wars"),
      );
    });

    it("searches with specific page", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      await tmdbService.searchMovies("batman", 2);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2"),
      );
    });

    it("handles empty search query", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ results: [], total_pages: 0, total_results: 0 }),
      });

      const result = await tmdbService.searchMovies("");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("query="),
      );
    });
  });

  describe("getImageUrl", () => {
    it("returns correct image URL with w500 size", () => {
      const path = "/test-image.jpg";
      const url = tmdbService.getImageUrl(path, "w500");

      expect(url).toBe("https://image.tmdb.org/t/p/w500/test-image.jpg");
    });

    it("returns correct image URL with original size", () => {
      const path = "/test-image.jpg";
      const url = tmdbService.getImageUrl(path, "original");

      expect(url).toBe("https://image.tmdb.org/t/p/original/test-image.jpg");
    });

    it("returns placeholder when path is null", () => {
      const url = tmdbService.getImageUrl(null);

      expect(url).toBe("https://via.placeholder.com/500x750?text=No+Image");
    });

    it("returns placeholder when path is empty string", () => {
      const url = tmdbService.getImageUrl("");

      expect(url).toBe("https://via.placeholder.com/500x750?text=No+Image");
    });

    it("defaults to w500 size when not specified", () => {
      const path = "/test-image.jpg";
      const url = tmdbService.getImageUrl(path);

      expect(url).toBe("https://image.tmdb.org/t/p/w500/test-image.jpg");
    });
  });

  describe("API configuration", () => {
    it("includes API key in all requests", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      await tmdbService.getPopularMovies();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("api_key="),
      );
    });

    it("includes language parameter in all requests", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiResponse),
      });

      await tmdbService.getPopularMovies();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("language=tr-TR"),
      );
    });
  });
});
