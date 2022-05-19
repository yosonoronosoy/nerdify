import { z } from "zod";

export const spotifyImageResponse = z.object({
  height: z.number(),
  url: z.string(),
  width: z.number(),
});
export type SpotifyImageResponse = z.infer<typeof spotifyImageResponse>;

export const spotifyImagesResponse = z.array(spotifyImageResponse);
export type SpotifyImagesResponse = z.infer<typeof spotifyImagesResponse>;

export const spotifyArtistResponse = z.object({
  external_urls: z.object({
    spotify: z.string(),
  }),
  href: z.string(),
  id: z.string(),
  name: z.string(),
  type: z.literal("artist"),
  uri: z.string(),
});
export type SpotifyArtistResponse = z.infer<typeof spotifyArtistResponse>;

export const spotifyArtistsResponse = z.array(spotifyArtistResponse);
export type SpotifyArtistsResponse = z.infer<typeof spotifyArtistsResponse>;

export const spotifySearchItemResponse = z.object({
  album: z.object({
    album_type: z.string(),
    artists: z.array(spotifyArtistResponse),
    available_markets: z.array(z.string()),
    external_urls: z.object({
      spotify: z.string(),
    }),
    href: z.string(),
    id: z.string(),
    images: z.array(spotifyImageResponse),
    name: z.string(),
    type: z.literal("album"),
    uri: z.string(),
  }),
  artists: z.array(spotifyArtistResponse),
  available_markets: z.array(z.string()),
  disc_number: z.number(),
  duration_ms: z.number(),
  explicit: z.boolean(),
  external_ids: z.object({
    isrc: z.string(),
  }),
  external_urls: z.object({
    spotify: z.string(),
  }),
  href: z.string(),
  id: z.string(),
  is_local: z.boolean(),
  name: z.string(),
  popularity: z.number(),
  preview_url: z.string().nullable(),
  track_number: z.number(),
  type: z.union([
    z.literal("album"),
    z.literal("artist"),
    z.literal("playlist"),
    z.literal("track"),
    z.literal("show"),
    z.literal("episode"),
  ]),
  uri: z.string(),
});

export type SpotifySearchItemResponse = z.infer<
  typeof spotifySearchItemResponse
>;

export const spotifySearchTrackResponse = z.union([
  z.object({
    tracks: z.object({
      href: z.string(),
      items: z.array(spotifySearchItemResponse),
      limit: z.number(),
      next: z.string().nullish(),
      offset: z.number(),
      previous: z.string().nullish(),
      total: z.number(),
    }),
  }),
  z
    .object({
      error: z.object({ status: z.literal(401), message: z.string() }),
    })
    .nullable(),
]);

export type SpotifySearchTrackResponse = z.infer<
  typeof spotifySearchTrackResponse
>;
