import { z } from "zod";

const thumnbailSchema = z.object({
  url: z.string(),
  width: z.number().nullish(),
  height: z.number().nullish(),
});

export const youtubePlaylistItemSchema = z.object({
  // kind: z.literal("youtube#playlistItem"),
  // etag: z.string(),
  id: z.string(),
  snippet: z.object({
    // publishedAt: z.string(),
    videoOwnerChannelTitle: z.string().optional(),
    channelId: z.string(),
    title: z.string(),
    description: z.string(),
    thumbnails: z
      .object({
        default: thumnbailSchema,
        medium: thumnbailSchema,
        high: thumnbailSchema,
        standard: thumnbailSchema,
        maxres: thumnbailSchema,
      })
      .partial(),
    channelTitle: z.string(),
    playlistId: z.string(),
    // position: z.number(),
    resourceId: z.object({
      kind: z.string(),
      videoId: z.string(),
    }),
    // videoOwnerChannelId: z.string(),
  }),
});

export const youtubePlaylistItemsSchema = z.object({
  // kind: z.literal("youtube#playlistItemListResponse"),
  // etag: z.string(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number(),
    resultsPerPage: z.number(),
  }),
  items: youtubePlaylistItemSchema.array(),
});

export type YoutubePlaylistItems = z.infer<typeof youtubePlaylistItemsSchema>;

export const youtubePlaylistResponseSchema = z.object({
  items: z.array(
    z.object({
      snippet: z.object({
        title: z.string(),
        thumbnails: z
          .object({
            default: thumnbailSchema,
            medium: thumnbailSchema,
            high: thumnbailSchema,
            standard: thumnbailSchema,
            maxres: thumnbailSchema,
          })
          .partial(),
      }),
    })
  ),
});

export type YoutubePlaylistResponse = z.infer<
  typeof youtubePlaylistResponseSchema
>;
