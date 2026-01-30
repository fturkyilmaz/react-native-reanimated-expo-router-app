import { z } from 'zod';

export const movieSchema = z.object({
    id: z.number(),
    title: z.string(),
    overview: z.string(),
    poster_path: z.string().nullable(),
    backdrop_path: z.string().nullable(),
    vote_average: z.number().min(0).max(10),
    release_date: z.string(),
    genre_ids: z.array(z.number()),
});

export type MovieSchema = z.infer<typeof movieSchema>;