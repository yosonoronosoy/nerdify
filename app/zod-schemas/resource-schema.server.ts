import { z } from "zod";

const resourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string().nullable(),
  status: z.union([
    z.literal("PROCESSED"),
    z.literal("PROCESSING"),
    z.literal("OUTDATED"),
    z.literal("UNPROCESSED"),
  ]),
  lastViewedAt: z.union([z.null(), z.date()]),
  totalVideos: z.number(),
  _count: z.object({ spotifyTracks: z.number() }),
  resourceId: z.string(),
});

export const resourcesSchema = resourceSchema.array();
export type Resource = z.infer<typeof resourceSchema>;
