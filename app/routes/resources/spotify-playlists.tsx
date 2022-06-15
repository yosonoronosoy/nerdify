/* eslint-disable no-loop-func */
import type { LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import {
  getSpotifyPlaylistsFromCache,
  setSpotifyPlaylistsInCache,
} from "~/models/redis.server";
import { getUserIdFromSession } from "~/services/session.server";
import { getSpotifyUserPlaylists } from "~/services/spotify.server";
import type {
  SpotifyPlaylistSchema,
  SpotifyPlaylistsSchema,
} from "~/zod-schemas/spotify-playlists-schema.server";

const timer = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const userId = await getUserIdFromSession(request);

  const playlistTitle = url.searchParams.get("playlist");
  invariant(
    typeof playlistTitle === "string",
    "playlist title query param must be a string"
  );
  const offsetParam = Number(url.searchParams.get("offset"));
  const offset = !isNaN(offsetParam) ? offsetParam : 50;

  const cachedPlaylists = await getPlaylistsFromCache({
    userId,
    offset,
    playlistTitle,
  });

  if (cachedPlaylists) {
    return json<SpotifyPlaylistLoaderData>(cachedPlaylists);
  }

  let userPlaylists = await getSpotifyUserPlaylists(request);
  setSpotifyPlaylistsInCache({ userId, offset, data: userPlaylists });

  const items: SpotifyPlaylistSchema[] = userPlaylists.items;

  // this is for the last iteration of the for loop to check if the playlist was found
  // it stores the last playlist items response before merging
  let lastPlaylists: SpotifyPlaylistsSchema = userPlaylists;

  // this account for 200 requests => 10 (outer loop) * 20 (inner array#map)
  const iterations = 10;
  const step = 20;

  for (let j = 1; j < iterations; j += step) {
    const playlistsFound = findPlaylist({
      playlists: lastPlaylists,
      playlistTitle,
      offset: lastPlaylists.offset,
    });

    if (playlistsFound.kind === "playlist-found") {
      return json<SpotifyPlaylistLoaderData>(playlistsFound);
    }

    const promises = Array.from({ length: step }).map(async (_, i) => {
      const nextOffset = (i + j) * offset;

      const userPlaylists = await getSpotifyUserPlaylists(request, nextOffset);
      lastPlaylists = userPlaylists;

      setSpotifyPlaylistsInCache({
        userId,
        data: userPlaylists,
        offset: nextOffset,
      });

      return userPlaylists;
    });

    const res = await Promise.all(promises);

    items.push(
      ...res.reduce(
        (acc, r) => [...acc, ...r.items],
        [] as SpotifyPlaylistSchema[]
      )
    );
  }

  const playlistsData = findPlaylist({
    playlists: lastPlaylists,
    offset: lastPlaylists.offset,
    playlistTitle,
    items,
  });

  return json<SpotifyPlaylistLoaderData>(playlistsData);
};

async function getPlaylistsFromCache({
  userId,
  offset,
  playlistTitle,
}: {
  userId: string;
  offset: number;
  playlistTitle: string;
}): Promise<SpotifyPlaylistLoaderData | null> {
  const cachedPlaylists = await getSpotifyPlaylistsFromCache({
    userId,
    offset,
  });

  if (!cachedPlaylists) {
    return null;
  }

  return findPlaylist({
    playlists: cachedPlaylists,
    playlistTitle,
    offset,
  });
}

function findPlaylist({
  playlists,
  playlistTitle,
  offset,
  items = playlists.items,
}: {
  playlists: SpotifyPlaylistsSchema;
  playlistTitle: string;
  offset: number;
  items?: SpotifyPlaylistsSchema["items"];
}): SpotifyPlaylistLoaderData {
  const found = findPlaylistByTitle(playlistTitle, playlists.items);

  if (found) {
    return {
      kind: "playlist-found",
      playlist: found,
      totalPlaylists: playlists.total,
      offset,
    };
  }

  return {
    kind: "playlist-not-found",
    playlists: items,
    totalPlaylists: playlists.total,
    offset,
  };
}

function findPlaylistByTitle(
  title: string,
  items: SpotifyPlaylistsSchema["items"]
) {
  return items.find((playlist) => playlist.name.includes(title));
}
