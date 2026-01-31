import { Movie, MovieDetails } from "@/config/api";

export const mockMovies: Movie[] = [
  {
    id: 1,
    title: "Joker",
    overview:
      "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society.",
    poster_path: "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
    backdrop_path: "/n6bUvigpRFqSwmPp1m2YFGdbLRP.jpg",
    vote_average: 8.2,
    release_date: "2019-10-04",
    genre_ids: [80, 18, 53],
  },
  {
    id: 2,
    title: "Interstellar",
    overview:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    vote_average: 8.4,
    release_date: "2014-11-07",
    genre_ids: [12, 18, 878],
  },
  {
    id: 3,
    title: "The Godfather",
    overview:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    poster_path: "/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg",
    backdrop_path: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
    vote_average: 9.2,
    release_date: "1972-03-24",
    genre_ids: [18, 80],
  },
];

export const mockMovieDetails: MovieDetails = {
  ...mockMovies[0],
  runtime: 122,
  genres: [
    { id: 80, name: "Crime" },
    { id: 18, name: "Drama" },
    { id: 53, name: "Thriller" },
  ],
  homepage: "https://www.jokermovie.net",
  tagline: "Put on a happy face.",
};

export const mockUser = {
  id: "1",
  email: "test@test.com",
  name: "Furkan",
  token: "mock_jwt_token_12345",
};

export const mockTheme = {
  light: {
    background: "#f8f9fa",
    card: "#ffffff",
    input: "#fafafa",
    text: "#1a1a1a",
    textSecondary: "#666666",
    textMuted: "#999999",
    border: "#e0e0e0",
    divider: "#f0f0f0",
    primary: "#E50914",
    primaryLight: "#FFF3F3",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    shadow: "#000000",
    overlay: "rgba(0,0,0,0.5)",
  },
  dark: {
    background: "#0f0f0f",
    card: "#1a1a1a",
    input: "#2a2a2a",
    text: "#ffffff",
    textSecondary: "#b3b3b3",
    textMuted: "#666666",
    border: "#2a2a2a",
    divider: "#2a2a2a",
    primary: "#E50914",
    primaryLight: "#2a1a1a",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    shadow: "#000000",
    overlay: "rgba(0,0,0,0.8)",
  },
};

export const mockApiResponse = {
  page: 1,
  results: mockMovies,
  total_pages: 10,
  total_results: 200,
};

export const mockSearchResults = {
  page: 1,
  results: [mockMovies[0], mockMovies[1]],
  total_pages: 5,
  total_results: 100,
};
