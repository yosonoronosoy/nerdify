import { z } from "zod";

export const thumbnailSchema = z.object({
  url: z.string(),
  width: z.number().nullish(),
  height: z.number().nullish(),
});
