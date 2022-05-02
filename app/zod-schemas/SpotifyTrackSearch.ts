import { z } from "zod";

export const spotifyTrackResponse = z.object({
  album: z.object({
    album_type: z.string(),
    artists: z.array(
      z.object({
        external_urls: z.object({
          spotify: z.string(),
        }),
        href: z.string(),
        id: z.string(),
        name: z.string(),
        type: z.string(),
        uri: z.string(),
      })
    ),
    available_markets: z.array(z.string()),
    external_urls: z.object({
      spotify: z.string(),
    }),
    href: z.string(),
    id: z.string(),
    images: z.array(
      z.object({
        height: z.number(),
        url: z.string(),
        width: z.number(),
      })
    ),
    name: z.string(),
    type: z.string(),
    uri: z.string(),
  }),
  artists: z.array(
    z.object({
      external_urls: z.object({
        spotify: z.string(),
      }),
      href: z.string(),
      id: z.string(),
      name: z.string(),
      type: z.string(),
      uri: z.string(),
    })
  ),
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
  preview_url: z.string(),
  track_number: z.number(),
  type: z.string(),
  uri: z.string(),
});

export type SpotifyTrackResponse = z.infer<typeof spotifyTrackResponse>;

export const spotifySearchTrackResponse = z.object({
  tracks: z.object({
    href: z.string(),
    items: z.array(spotifyTrackResponse),
    limit: z.number(),
    next: z.string(),
    offset: z.number(),
    previous: z.string(),
    total: z.number(),
  }),
});

export type SpotifySearchTrackResponse = z.infer<
  typeof spotifySearchTrackResponse
>;
