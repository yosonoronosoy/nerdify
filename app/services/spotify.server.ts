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
  artist,
  track,
  req,
}: {
  artist: string;
  track: string;
  req: Request;
}) {
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
  return json;
}
