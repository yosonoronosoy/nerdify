import { z } from "zod";

const youtubeVideoPlayerSchema = z.object({
  kind: z.literal("youtube#video"),
  id: z.string(),
  player: z.object({
    embedHtml: z.string(),
  }),
});

export type YoutubeVideoPlayer = z.infer<typeof youtubeVideoPlayerSchema>;

export const youtubeVideoPlayerResponseSchema = z.object({
  kind: z.literal("youtube#videoListResponse"),
  items: youtubeVideoPlayerSchema.array(),
});

export type YoutubeVideoPlayerResponse = z.infer<
  typeof youtubeVideoPlayerResponseSchema
>;
