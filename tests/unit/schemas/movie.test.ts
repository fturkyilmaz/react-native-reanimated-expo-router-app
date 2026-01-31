import { movieSchema, MovieSchema } from "@/schemas/movie";

describe("Movie Schema", () => {
  const validMovie = {
    id: 1,
    title: "Test Movie",
    overview: "This is a test movie overview",
    poster_path: "/test-poster.jpg",
    backdrop_path: "/test-backdrop.jpg",
    vote_average: 7.5,
    release_date: "2024-01-15",
    genre_ids: [28, 12, 16],
  };

  it("validates correct movie data", () => {
    expect(() => movieSchema.parse(validMovie)).not.toThrow();
  });

  it("validates movie with null poster_path", () => {
    const movieWithNullPoster = {
      ...validMovie,
      poster_path: null,
    };

    expect(() => movieSchema.parse(movieWithNullPoster)).not.toThrow();
  });

  it("validates movie with null backdrop_path", () => {
    const movieWithNullBackdrop = {
      ...validMovie,
      backdrop_path: null,
    };

    expect(() => movieSchema.parse(movieWithNullBackdrop)).not.toThrow();
  });

  it("throws error for missing id", () => {
    const invalidMovie = {
      ...validMovie,
      id: undefined,
    };

    expect(() => movieSchema.parse(invalidMovie)).toThrow();
  });

  it("throws error for non-number id", () => {
    const invalidMovie = {
      ...validMovie,
      id: "not-a-number",
    };

    expect(() => movieSchema.parse(invalidMovie)).toThrow();
  });

  it("throws error for missing title", () => {
    const invalidMovie = {
      ...validMovie,
      title: undefined,
    };

    expect(() => movieSchema.parse(invalidMovie)).toThrow();
  });

  it("throws error for non-string title", () => {
    const invalidMovie = {
      ...validMovie,
      title: 123,
    };

    expect(() => movieSchema.parse(invalidMovie)).toThrow();
  });

  it("throws error for missing overview", () => {
    const invalidMovie = {
      ...validMovie,
      overview: undefined,
    };

    expect(() => movieSchema.parse(invalidMovie)).toThrow();
  });

  it("throws error for vote_average below 0", () => {
    const invalidMovie = {
      ...validMovie,
      vote_average: -1,
    };

    expect(() => movieSchema.parse(invalidMovie)).toThrow();
  });

  it("throws error for vote_average above 10", () => {
    const invalidMovie = {
      ...validMovie,
      vote_average: 11,
    };

    expect(() => movieSchema.parse(invalidMovie)).toThrow();
  });

  it("validates vote_average at minimum (0)", () => {
    const movieWithMinRating = {
      ...validMovie,
      vote_average: 0,
    };

    expect(() => movieSchema.parse(movieWithMinRating)).not.toThrow();
  });

  it("validates vote_average at maximum (10)", () => {
    const movieWithMaxRating = {
      ...validMovie,
      vote_average: 10,
    };

    expect(() => movieSchema.parse(movieWithMaxRating)).not.toThrow();
  });

  it("throws error for non-array genre_ids", () => {
    const invalidMovie = {
      ...validMovie,
      genre_ids: "not-an-array",
    };

    expect(() => movieSchema.parse(invalidMovie)).toThrow();
  });

  it("throws error for genre_ids with non-numbers", () => {
    const invalidMovie = {
      ...validMovie,
      genre_ids: [28, "not-a-number", 16],
    };

    expect(() => movieSchema.parse(invalidMovie)).toThrow();
  });

  it("validates empty genre_ids array", () => {
    const movieWithEmptyGenres = {
      ...validMovie,
      genre_ids: [],
    };

    expect(() => movieSchema.parse(movieWithEmptyGenres)).not.toThrow();
  });

  it("validates missing optional fields with null", () => {
    const movieWithNulls = {
      id: 1,
      title: "Test Movie",
      overview: "Overview",
      poster_path: null,
      backdrop_path: null,
      vote_average: 5.0,
      release_date: "2024-01-01",
      genre_ids: [],
    };

    expect(() => movieSchema.parse(movieWithNulls)).not.toThrow();
  });

  describe("Type inference", () => {
    it("MovieSchema type matches schema", () => {
      const movie: MovieSchema = {
        id: 1,
        title: "Test Movie",
        overview: "Overview",
        poster_path: "/poster.jpg",
        backdrop_path: "/backdrop.jpg",
        vote_average: 7.5,
        release_date: "2024-01-01",
        genre_ids: [1, 2, 3],
      };

      const parsed = movieSchema.parse(movie);
      expect(parsed).toEqual(movie);
    });

    it("MovieSchema type allows null for poster_path and backdrop_path", () => {
      const movie: MovieSchema = {
        id: 1,
        title: "Test Movie",
        overview: "Overview",
        poster_path: null,
        backdrop_path: null,
        vote_average: 7.5,
        release_date: "2024-01-01",
        genre_ids: [1, 2, 3],
      };

      const parsed = movieSchema.parse(movie);
      expect(parsed.poster_path).toBeNull();
      expect(parsed.backdrop_path).toBeNull();
    });
  });
});
