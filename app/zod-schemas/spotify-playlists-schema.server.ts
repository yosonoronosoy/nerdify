import { z } from "zod";

export const spotifyPlaylistSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  external_urls: z.object({
    spotify: z.string(),
  }),
  id: z.string(),
  owner: z.object({
    id: z.string(),
    display_name: z.string().nullable(),
  }),
  tracks: z.object({
    total: z.number(),
  }),
  images: z.array(
    z.object({
      height: z.number().nullable(),
      url: z.string(),
      width: z.number().nullable(),
    })
  ),
});

export type SpotifyPlaylistSchema = z.infer<typeof spotifyPlaylistSchema>;

export const spotifyPlaylistsSchema = z.object({
  items: z.array(spotifyPlaylistSchema),
  limit: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  total: z.number(),
  offset: z.number(),
});

export type SpotifyPlaylistsSchema = z.infer<typeof spotifyPlaylistsSchema>;
