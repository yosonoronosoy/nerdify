/* eslint-disable no-loop-func */
import type { LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import {
  getSpotifyPlaylistsFromCache,
  setSpotifyPlaylistsInCache,
} from "~/models/redis.server";
import { getSpotifyPlaylist } from "~/models/spotify-playlist.server";
import {
  commitSession,
  getUserIdFromSession,
  getUserPlaylistInfoFromSession,
} from "~/services/session.server";
import { getSpotifyUserPlaylists } from "~/services/spotify.server";
import type {
  SpotifyPlaylistSchema,
  SpotifyPlaylistsSchema,
} from "~/zod-schemas/spotify-playlists-schema.server";

export type OptionRowItem = {
  id: string;
  name: string;
  image: string;
  url: string;
};

export type SpotifyPlaylistLoaderData =
  | {
      kind: "playlist-found";
      playlist: Omit<OptionRowItem, "owner">;
      totalPlaylists: number;
      offset: number;
    }
  | {
      kind: "playlist-not-found";
      playlists: OptionRowItem[];
      totalPlaylists: number;
      offset: number;
    };

const timer = (timeInMs = 500, frequency = 5, loggingValue?: string) => {
  let seconds = 0;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      console.log({ timePassed: `${++seconds}s` });
    }, timeInMs / frequency);

    setTimeout(() => {
      if (loggingValue) {
        console.log({ loggingValue });
      }

      resolve(null);
      clearInterval(interval);
    }, timeInMs);
  });
};

export const loader = async () => {
  timer(10_000, 10, "loader of spotify-playlist resolved");
  console.log({ DONE: true });

  // await timer(2000)
  return null;
};

// export const loader: LoaderFunction = async ({ request }) => {
//   const url = new URL(request.url);
//   const userId = await getUserIdFromSession(request);
//
//   const playlistTitle = url.searchParams.get("playlist");
//   invariant(
//     typeof playlistTitle === "string",
//     "playlist title query param must be a string"
//   );
//   const offsetParam = Number(url.searchParams.get("offset"));
//   let offset = !isNaN(offsetParam) ? offsetParam : 0;
//
//   // CHECK CACHE
//   const cachedPlaylists = await getPlaylistsFromCache({
//     userId,
//     offset,
//     playlistTitle,
//   });
//
//   if (cachedPlaylists) {
//     return json<SpotifyPlaylistLoaderData>(cachedPlaylists);
//   }
//
//   // CHECK DB
//   const playlistFromDB = await getPlaylistFromDB({
//     userId,
//     playlistTitle,
//   });
//
//   if (playlistFromDB) {
//     return json<SpotifyPlaylistLoaderData>(playlistFromDB);
//   }
//
//   let userPlaylists = await getSpotifyUserPlaylists(request);
//
//   // SET-CACHE
//   setSpotifyPlaylistsInCache({ userId, offset, data: userPlaylists });
//
//   // check: if stored playlist total is less than total from API
//   const { offset: sessionOffset, totalPlaylists: sessionTotalPlaylists } =
//     await getUserPlaylistInfoFromSession(request);
//
//   // if not, start from the offset
//   offset =
//     userPlaylists.total <= sessionTotalPlaylists ? sessionOffset : offset + 50;
//
//   // ACCUMULATOR
//   const items: SpotifyPlaylistSchema[] = userPlaylists.items;
//
//   // this is for the last iteration of the for loop to check if the playlist was found
//   // it stores the last playlist items response before merging
//   let lastPlaylists: SpotifyPlaylistsSchema = userPlaylists;
//
//   // this account for 200 requests => 10 (outer loop) * 20 (inner array#map)
//   const iterations = 10;
//   const step = 20;
//
//   for (let j = 1; j < iterations; j += step) {
//     const playlistsFound = findPlaylist({
//       playlists: lastPlaylists,
//       playlistTitle,
//       offset,
//       userId,
//     });
//
//     if (playlistsFound.kind === "playlist-found") {
//       return json<SpotifyPlaylistLoaderData>(playlistsFound, {
//         headers: await commitSession(null, {
//           request,
//           data: {
//             offset: lastPlaylists.offset.toString(),
//             totalPlaylists: lastPlaylists.total.toString(),
//           },
//         }),
//       });
//     }
//
//     const promises = Array.from({ length: step }).map(async (_, i) => {
//       const nextOffset = (i + j) * offset;
//
//       const userPlaylists = await getSpotifyUserPlaylists(request, nextOffset);
//       lastPlaylists = userPlaylists;
//
//       setSpotifyPlaylistsInCache({
//         userId,
//         data: userPlaylists,
//         offset: nextOffset,
//       });
//
//       return userPlaylists;
//     });
//
//     const res = await Promise.all(promises);
//
//     items.push(
//       ...res.reduce(
//         (acc, r) => [...acc, ...r.items],
//         [] as SpotifyPlaylistSchema[]
//       )
//     );
//   }
//
//   const playlistsData = findPlaylist({
//     playlists: lastPlaylists,
//     offset: lastPlaylists.offset,
//     playlistTitle,
//     items,
//     userId,
//   });
//
//   return json<SpotifyPlaylistLoaderData>(playlistsData, {
//     headers: await commitSession(null, {
//       request,
//       data: {
//         offset: lastPlaylists.offset.toString(),
//         totalPlaylists: lastPlaylists.total.toString(),
//       },
//     }),
//   });
// };
//
// async function getPlaylistsFromCache({
//   userId,
//   offset,
//   playlistTitle,
// }: {
//   userId: string;
//   offset: number;
//   playlistTitle: string;
// }): Promise<SpotifyPlaylistLoaderData | null> {
//   const cachedPlaylists = await getSpotifyPlaylistsFromCache({
//     userId,
//     offset,
//   });
//
//   if (!cachedPlaylists) {
//     return null;
//   }
//
//   return findPlaylist({
//     userId,
//     playlists: cachedPlaylists,
//     playlistTitle,
//     offset,
//   });
// }
//
// async function getPlaylistFromDB({
//   userId,
//   playlistTitle,
// }: {
//   userId: string;
//   playlistTitle: string;
// }): Promise<SpotifyPlaylistLoaderData | null> {
//   const playlistFromDB = await getSpotifyPlaylist({
//     userId,
//     name: playlistTitle,
//   });
//
//   if (playlistFromDB) {
//     return {
//       kind: "playlist-found",
//       offset: playlistFromDB.user.playlistOffset,
//       totalPlaylists: playlistFromDB.user.totalPlaylists,
//       playlist: {
//         name: playlistFromDB.name,
//         id: playlistFromDB.playlistId,
//         image: playlistFromDB.image ?? "",
//         url: playlistFromDB.url,
//       },
//     };
//   }
//
//   return null;
// }
//
// function findPlaylist({
//   playlists,
//   playlistTitle,
//   offset,
//   items = playlists.items,
// }: {
//   userId: string;
//   playlists: SpotifyPlaylistsSchema;
//   playlistTitle: string;
//   offset: number;
//   items?: SpotifyPlaylistsSchema["items"];
// }): SpotifyPlaylistLoaderData {
//   const found = items.find((playlist) => playlist.name.includes(playlistTitle));
//
//   if (found) {
//     return {
//       kind: "playlist-found",
//       playlist: {
//         id: found.id,
//         name: found.name,
//         image: found.images[0].url,
//         url: found.external_urls.spotify,
//       },
//       totalPlaylists: playlists.total,
//       offset,
//     };
//   }
//
//   return {
//     kind: "playlist-not-found",
//     playlists: items.map((item) => ({
//       id: item.id,
//       name: item.name,
//       image: item.images[0].url,
//       url: item.external_urls.spotify,
//     })),
//     totalPlaylists: playlists.total,
//     offset,
//   };
// }
