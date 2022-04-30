import { z } from "zod";

const thumnbailSchema = z.object({
  url: z.string(),
  width: z.number().nullish(),
  height: z.number().nullish(),
});

const videoIdSchema = z.object({
  kind: z.literal("youtube#video"),
  videoId: z.string(),
});

const channelIdSchema = z.object({
  kind: z.literal("youtube#channel"),
  channelId: z.string(),
});

const playlistIdSchema = z.object({
  kind: z.literal("youtube#playlist"),
  playlistId: z.string(),
});

const youtubeSearchResultSchema = z.object({
  kind: z.literal("youtube#searchResult"),
  etag: z.string(),
  id: z.union([videoIdSchema, channelIdSchema, playlistIdSchema]),
  snippet: z.object({
    publishedAt: z.string(),
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
    liveBroadcastContent: z.string(),
  }),
});

const youtubeChannelSearchResultSchema = youtubeSearchResultSchema
  .omit({ id: true })
  .extend({ id: channelIdSchema });

export type YoutubeChannelSearchResult = z.infer<
  typeof youtubeChannelSearchResultSchema
>;

const youtubeVideoSearchResultSchema = youtubeSearchResultSchema
  .omit({ id: true })
  .extend({ id: videoIdSchema });

export type YoutueVideoSearchResult = z.infer<
  typeof youtubeVideoSearchResultSchema
>;

const youtubePlaylistSearchResultSchema = youtubeSearchResultSchema
  .omit({ id: true })
  .extend({ id: playlistIdSchema });

export type YoutubePlaylistSearchResult = z.infer<
  typeof youtubePlaylistSearchResultSchema
>;

export const youtubeSearchResponse = z.object({
  kind: z.literal("youtube#searchListResponse"),
  etag: z.string(),
  nextPageToken: z.string(),
  regionCode: z.string(),
  pageInfo: z.object({
    totalResults: z.number(),
    resultsPerPage: z.number(),
  }),
  items: z.array(youtubeSearchResultSchema),
});

export type YoutubeSearchResponse = z.infer<typeof youtubeSearchResponse>;

export const youtubeSearchVideoResponse = youtubeSearchResponse
  .omit({ items: true })
  .extend({ items: z.array(youtubeVideoSearchResultSchema) });

export type YoutubeSearchVideoResponse = z.infer<
  typeof youtubeSearchVideoResponse
>;

export const youtubeSearchChannelResponse = youtubeSearchResponse
  .omit({ items: true })
  .extend({ items: z.array(youtubeChannelSearchResultSchema) });

export type YoutubeSearchChannelResponse = z.infer<
  typeof youtubeSearchChannelResponse
>;

export const youtubeSearchPlaylistResponse = youtubeSearchResponse
  .omit({ items: true })
  .extend({ items: z.array(youtubePlaylistSearchResultSchema) });

export type YoutubeSearchPlaylistResponse = z.infer<
  typeof youtubeSearchPlaylistResponse
>;
