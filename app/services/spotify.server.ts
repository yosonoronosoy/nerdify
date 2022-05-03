import { prisma } from "~/db.server";
import { getSpotifyTrackBySearchQuery } from "~/models/spotify.server";
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

export async function searchTrack({
  searchQuery,
  req,
}: {
  searchQuery: `${string} - ${string}`;
  req: Request;
}) {
  const trackFromDB = await getSpotifyTrackBySearchQuery(searchQuery);

  if (trackFromDB) {
    return { kind: "FROM_DB", track: trackFromDB };
  }

  const [track, artist] = searchQuery.split(" – ");

  const querystring = getQuerystring({
    q: `track:${track} artist:${artist}`,
    type: "track",
  });

  const session = await spotifyStrategy.getSession(req);
  const accessToken = session?.accessToken;

  if (!accessToken) {
    throw new Error("No spotify access token provided");
  }

  const response = await fetch(`${searchUrl}/${querystring}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = await response.json();
  const res = spotifySearchTrackResponse.parse(json);

  await prisma.spotifyTrack.create({
    data: {
      searchQuery,
      trackId: res.tracks.items[0].id,
    },
  });

  return { kind: "FROM_API", track: res };
}
