import { json, LoaderFunction } from "@remix-run/server-runtime";
import fs from "fs/promises";
import path from "path";
import { getSpotifyUserPlaylists } from "~/services/spotify.server";
import type { SpotifyPlaylistSchema } from "~/zod-schemas/spotify-playlists-schema.server";

const timer = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const filename = path.join(__dirname, "..", "spotify-playlists.txt");
console.log({ filename });

export type SpotifyPlaylistLoaderData =
  | {
      kind: "playlist-found";
      playlist: SpotifyPlaylistSchema;
      totalPlaylists: number;
      offset: number;
    }
  | {
      kind: "playlist-not-found";
      playlists: SpotifyPlaylistSchema[];
      totalPlaylists: number;
      offset: number;
    };

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const playlistTitle = url.searchParams.get("playlist");
  const offsetParam = Number(url.searchParams.get("offset"));
  const offset = !isNaN(offsetParam) ? offsetParam : 50;

  /*
 //  WARNING: IMPLEMENT CACHING FOR THIS ENDPOINT

  const cachedPlaylists = getSpotifyPlaylistsFromCache(spotifyCacheKey, offset);
  if (cachedPlaylists) {
    const foundInCache = cachedPlaylists.find(
      (playlist) => playlist.name === playlistTitle
    );

    if (foundInCache) {
      return json<SpotifyPlaylistLoaderData>({
        kind: "playlist-found",
        playlist: foundInCache,
        totalPlaylists: cachedPlaylists.total,
        offset,
      });
    }

    return json<SpotifyPlaylistLoaderData>({
      kind: "playlist-not-found",
      playlists: cachedPlaylists,
      totalPlaylists: cachedPlaylists.total,
      offset,
    });
  }
  */

  let userPlaylists = await getSpotifyUserPlaylists(request);
  const items: SpotifyPlaylistSchema[] = userPlaylists.items;

  // this account for 200 requests => 10 (outer loop) * 20 (inner array#map)
  const iterations = 10;
  const step = 20;

  for (let j = 1; j < iterations; j += step) {
    const playlistFound = items.find((item) => item.name === playlistTitle);
    if (playlistFound) {
      return json<SpotifyPlaylistLoaderData>({
        kind: "playlist-found",
        playlist: playlistFound,
        totalPlaylists: userPlaylists.total,
        offset: userPlaylists.offset,
      });
    }

    const promises = Array.from({ length: step }).map((_, i) => {
      return getSpotifyUserPlaylists(request, (i + j) * offset);
    });
    const res = await Promise.all(promises);

    items.push(
      ...res.reduce(
        (acc, r) => [...acc, ...r.items],
        [] as SpotifyPlaylistSchema[]
      )
    );
  }

  const playlistFound = items.find((item) => item.name === playlistTitle);
  if (playlistFound) {
    return json<SpotifyPlaylistLoaderData>({
      kind: "playlist-found",
      playlist: playlistFound,
      totalPlaylists: userPlaylists.total,
      offset: userPlaylists.offset,
    });
  }

  // await fs.writeFile(filename, JSON.stringify(items, null, 2));

  return json<SpotifyPlaylistLoaderData>({
    kind: "playlist-not-found",
    playlists: items,
    totalPlaylists: userPlaylists.total,
    offset: userPlaylists.offset,
  });
};
