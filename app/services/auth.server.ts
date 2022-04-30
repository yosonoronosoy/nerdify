import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { SpotifyStrategy } from "remix-auth-spotify";
import invariant from "tiny-invariant";
import { sessionStorage } from "./session.server";

invariant(process.env.SPOTIFY_CLIENT_ID, "Missing Spotify Client ID");
invariant(process.env.SPOTIFY_CLIENT_SECRET, "Missing Spotify Client Secret");
invariant(process.env.SPOTIFY_CALLBACK_URL, "Missing Spotify Callback URL");

invariant(process.env.GOOGLE_CLIENT_ID, "Missing Google Client ID");
invariant(process.env.GOOGLE_CLIENT_SECRET, "Missing Google Client Secret");
invariant(process.env.GOOGLE_CALLBACK_URL, "Missing Google Callback URL");

const spotifyScopes = [
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

export const spotifyStrategy = new SpotifyStrategy(
  {
    clientID: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    callbackURL: process.env.SPOTIFY_CALLBACK_URL,
    scope: spotifyScopes,
    sessionStorage,
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    return {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + extraParams.expiresIn * 1000,
      tokenType: extraParams.tokenType,
      user: {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        image: profile.__json.images?.[0].url,
      },
    };
  }
);

export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => ({
    accessToken,
    refreshToken,
    extraParams,
    user: {
      id: profile.id,
      name: profile.displayName,
    },
  })
);

export const authenticator = new Authenticator(sessionStorage, {});

authenticator.use(spotifyStrategy, "spotify-auth");
authenticator.use(googleStrategy, "google-auth");
