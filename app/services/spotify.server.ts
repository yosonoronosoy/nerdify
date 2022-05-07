import { spotifySearchTrackResponse } from "~/zod-schemas/SpotifyTrackSearch";
import { spotifyStrategy } from "./auth.server";

const baseUrl = `https://api.spotify.com/v1`;
const tracksUrl = `${baseUrl}/tracks`;
const searchUrl = `${baseUrl}/search`;

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

  return { kind: "success", data: tracks.items[0] } as const;
}
