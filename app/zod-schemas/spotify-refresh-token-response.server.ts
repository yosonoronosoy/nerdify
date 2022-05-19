import { z } from "zod";

export const spotifyRefreshTokenResponse = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  scope: z.string(),
  token_type: z.string(),
});

export type SpotifyRefreshTokenResponse = z.infer<
  typeof spotifyRefreshTokenResponse
>;
