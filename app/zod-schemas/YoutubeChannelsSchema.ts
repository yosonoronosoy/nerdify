import { z } from "zod";

export const youtubeChannelWithContentDetailsSchema = z.object({
  kind: z.literal("youtube#channel"),
  etag: z.string(),
  id: z.string(),
  contentDetails: z.object({
    relatedPlaylists: z.object({
      likes: z.string(),
      favorites: z.string().optional(),
      uploads: z.string(),
    }),
  }),
});

export const youtubeChannelListSchema = z.object({
  kind: z.literal("youtube#channelListResponse"),
  etag: z.string(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number(),
    resultsPerPage: z.number(),
  }),
  items: z.array(youtubeChannelWithContentDetailsSchema),
});
