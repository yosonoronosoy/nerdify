import type { Session } from "@remix-run/server-runtime";
import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import type { Session as SpotifySession } from "remix-auth-spotify";
import { SpotifyStrategy } from "remix-auth-spotify";
import invariant from "tiny-invariant";
import { spotifyRefreshTokenResponse } from "~/zod-schemas/spotify-refresh-token-response.server";
import {
  sessionStorage,
  setNewCookie,
  setSessionByKey,
} from "./session.server";

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

async function getNewSpotifyTokenFromRefreshToken(refreshToken: string) {
  const url = `https://accounts.spotify.com/api/token?${new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  })}`;

  const base64Token = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${base64Token}`,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const json = await response.json();
  const res = spotifyRefreshTokenResponse.safeParse(json);

  if (!res.success) {
    throw res.error;
  }

  return res.data;
}

export async function setSessionWithNewAccessToken({
  spotifySession,
  request,
  path,
}: {
  spotifySession: SpotifySession;
  request: Request;
  path?: string;
}) {
  const res = await getNewSpotifyTokenFromRefreshToken(
    spotifySession.refreshToken ?? ""
  );

  return setNewCookie(spotifyStrategy.sessionKey, {
    request,
    path,
    data: {
      ...spotifySession,
      accessToken: res.access_token,
      expiresAt: Date.now() + res.expires_in * 1000,
      tokenExpired: false,
    },
  });
}

export async function announceSpotifyTokenExpiration({
  request,
}: {
  request: Request;
}) {
  const spotifySession = (await spotifyStrategy.getSession(request)) as
    | (Session & { tokenExpired: boolean })
    | null;

  return setSessionByKey(spotifyStrategy.sessionKey, {
    request,
    data: {
      ...spotifySession,
      tokenExpired: true,
    },
  });
}

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
