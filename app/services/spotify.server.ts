import invariant from "tiny-invariant";
import { spotifyPlaylistsSchema } from "~/zod-schemas/spotify-playlists-schema.server";
import { spotifySearchTrackResponse } from "~/zod-schemas/spotify-track-search.server";
import { spotifyStrategy } from "./auth.server";
import { getUserIdFromSpotifySession } from "./session.server";

const baseUrl = `https://api.spotify.com/v1`;
const tracksUrl = `${baseUrl}/tracks`;
const searchUrl = `${baseUrl}/search`;
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
    type: "track",
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

export async function getSpotifyUserPlaylists(request: Request) {
  const sessionFromSpotifyStrategy = await spotifyStrategy.getSession(request);
  const spotifyUserId = await getUserIdFromSpotifySession(request);
  const accessToken = sessionFromSpotifyStrategy?.accessToken;

  invariant(
    typeof accessToken === "string",
    "No spotify access token provided"
  );
  invariant(typeof spotifyUserId === "string", "No spotify user id provided");

  const rawRes = await fetch(userPlaylistsUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }).then((res) => res.json());

  // console.dir(
  //   { ...rawRes },
  //   { depth: Number.MAX_SAFE_INTEGER }
  // );

  const res = spotifyPlaylistsSchema.parse(rawRes);

  return {
    ...res,
    items: res.items.filter((item) => item.owner.id === spotifyUserId),
  };
}
