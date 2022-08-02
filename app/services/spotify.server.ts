import invariant from "tiny-invariant";
import { upsertManySpotifyPlaylists } from "~/models/spotify-playlist.server";
import {
  spotifyPlaylistSchema,
  spotifyPlaylistsSchema,
} from "~/zod-schemas/spotify-playlists-schema.server";
import { spotifySearchTrackResponse } from "~/zod-schemas/spotify-track-search.server";
import { spotifyStrategy } from "./auth.server";
import {
  getUserIdFromSession,
  getUserIdFromSpotifySession,
} from "./session.server";

const baseUrl = `https://api.spotify.com/v1`;
const tracksUrl = `${baseUrl}/tracks`;
const searchUrl = `${baseUrl}/search`;
const playlistsUrl = `${baseUrl}/playlists`;
const userPlaylistsUrl = `${baseUrl}/me/playlists`;

type SearchParams = Record<string, string>;

function getQuerystring(searchParams: SearchParams) {
  return new URLSearchParams({
    ...searchParams,
  });
}

function cleanString(string: string) {
  return string
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\(|\)/g, "")
    .trim();
}

export async function searchTrack({
  searchQuery,
  request,
}: {
  searchQuery: string;
  request: Request;
}) {
  const [rawArtist, rawTrack] = searchQuery.split(" - ");
  const artist = cleanString(rawArtist);
  const track = cleanString(rawTrack);

  console.log({ artist, track });

  const querystring = getQuerystring({
    q: `track:${track} artist:${artist}`,
    // q: `${artist} ${track}`,
    type: "track",
    limit: "50",
  });
  const spotifyApiUrl = `${searchUrl}?${querystring}`;

  const sessionFromSpotifyStrategy = await spotifyStrategy.getSession(request);
  const accessToken = sessionFromSpotifyStrategy?.accessToken;

  if (!accessToken) {
    throw new Error("No spotify access token provided");
  }

  const response = await fetch(spotifyApiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await response.json();

  const parsedResponse = spotifySearchTrackResponse.safeParse(json);

  if (!parsedResponse.success) {
    return {
      kind: "parsingError",
      error: parsedResponse.error.toString(),
    } as const;
  }

  if (!parsedResponse.data) {
    return {
      kind: "noData",
      error: "no data found",
    } as const;
  }

  if ("error" in parsedResponse.data) {
    return {
      kind: "expiredToken",
      error: parsedResponse.data.error.message,
    } as const;
  }

  const tracks = parsedResponse.data.tracks;

  if (tracks.items.length === 0) {
    return { kind: "error", error: "No tracks found" } as const;
  }

  return { kind: "success", data: tracks.items } as const;
}

export async function fetchSpotifyUserPlaylists({
  request,
  offset = 0,
  limit = 1,
}: {
  request: Request;
  limit?: number;
  offset?: number;
}) {
  const sessionFromSpotifyStrategy = await spotifyStrategy.getSession(request);
  const accessToken = sessionFromSpotifyStrategy?.accessToken;
  const spotifyUserId = await getUserIdFromSpotifySession(request);

  invariant(
    typeof accessToken === "string",
    "No spotify access token provided"
  );
  invariant(typeof spotifyUserId === "string", "No spotify user id provided");

  const querystring = getQuerystring({
    offset: `${offset}`,
    limit: `${limit}`,
  });
  const spotifyApiUrl = `${userPlaylistsUrl}?${querystring}`;

  const rawRes = await fetch(spotifyApiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((res) => res.json());

  if ("error" in rawRes) {
    console.log(rawRes);
  }

  const { items, ...res } = spotifyPlaylistsSchema.parse(rawRes);

  return {
    ...res,
    items: items.filter((item) => item.owner.id === spotifyUserId),
  };
}

export async function getUserTotalPlaylists({ request }: { request: Request }) {
  const { total } = await fetchSpotifyUserPlaylists({ request });

  return total;
}

export async function getSpotifyUserPlaylists(
  request: Request,
  offset?: number
) {
  const userId = await getUserIdFromSession(request);

  const { items, ...res } = await fetchSpotifyUserPlaylists({
    request,
    limit: 50,
    offset,
  });

  upsertManySpotifyPlaylists({
    data: items.map((item) => ({
      url: item.external_urls.spotify,
      name: item.name,
      image: item.images[0].url,
      userId,
      playlistId: item.id,
    })),
  });

  return {
    ...res,
    items,
  };
}

export async function getSpotifyPlaylistById({
  request,
  playlistId,
}: {
  request: Request;
  playlistId: string;
}) {
  const spotifyApiUrl = `${playlistsUrl}/${playlistId}`;
  const sessionFromSpotifyStrategy = await spotifyStrategy.getSession(request);
  const accessToken = sessionFromSpotifyStrategy?.accessToken;

  const rawRes = await fetch(spotifyApiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((res) => res.json());

  const res = spotifyPlaylistSchema.parse(rawRes);

  return res;
}
