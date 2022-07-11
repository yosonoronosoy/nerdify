import type { LoaderFunction } from "@remix-run/node";

import { dispatchProgress, events } from "~/services/events.server";
import { getSpotifyUserPlaylists } from "~/services/spotify.server";
import type { SpotifyPlaylistSchema } from "~/zod-schemas/spotify-playlists-schema.server";

export let loader: LoaderFunction = ({ request }) => {
  if (!request.signal) return new Response(null, { status: 500 });

  return new Response(
    new ReadableStream({
      start(controller) {
        let encoder = new TextEncoder();
        let handleProgressChanged = (progress: number) => {
          console.log({ progress });
          controller.enqueue(encoder.encode("event: message\n"));
          controller.enqueue(encoder.encode(`data: ${progress}\n\n`));
        };

        let closed = false;
        let close = () => {
          if (closed) return;
          closed = true;

          events.removeListener("playlists-changed", handleProgressChanged);
          request.signal.removeEventListener("abort", close);
          controller.close();

          // dispatchProgress("dec");
        };

        events.addListener("playlists-changed", handleProgressChanged);
        request.signal.addEventListener("abort", close);
        if (request.signal.aborted) {
          close();
          return;
        }

        getAllUserPlaylists({ request, dispatchProgress });
      },
    }),
    {
      headers: { "Content-Type": "text/event-stream" },
    }
  );
};

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

async function getAllUserPlaylists({
  request,
  dispatchProgress,
}: {
  request: Request;
  dispatchProgress: (progress: number) => void;
}) {
  const url = new URL(request.url);
  // const userId = await getUserIdFromSession(request);

  // const playlistTitle = url.searchParams.get("playlist");
  // invariant(
  //   typeof playlistTitle === "string",
  //   "playlist title query param must be a string"
  // );
  const offsetParam = Number(url.searchParams.get("offset"));
  let offset = !isNaN(offsetParam) ? offsetParam : 0;

  // CHECK CACHE
  // const cachedPlaylists = await getPlaylistsFromCache({
  //   userId,
  //   offset,
  //   playlistTitle,
  // });

  // if (cachedPlaylists) {
  //   return json<SpotifyPlaylistLoaderData>(cachedPlaylists);
  // }

  // CHECK DB
  // const playlistFromDB = await getPlaylistFromDB({
  //   userId,
  //   playlistTitle,
  // });
  //
  // if (playlistFromDB) {
  //   return json<SpotifyPlaylistLoaderData>(playlistFromDB);
  // }

  let userPlaylists = await getSpotifyUserPlaylists(request);
  dispatchProgress(50);

  // SET-CACHE
  // setSpotifyPlaylistsInCache({ userId, offset, data: userPlaylists });

  // check: if stored playlist total is less than total from API
  // const { offset: sessionOffset, totalPlaylists: sessionTotalPlaylists } =
  //   await getUserPlaylistInfoFromSession(request);

  // if not, start from the offset
  // offset =
  //   userPlaylists.total <= sessionTotalPlaylists ? sessionOffset : offset + 50;

  // ACCUMULATOR
  const items: SpotifyPlaylistSchema[] = userPlaylists.items;

  // this is for the last iteration of the for loop to check if the playlist was found
  // it stores the last playlist items response before merging
  // let lastPlaylists: SpotifyPlaylistsSchema = userPlaylists;

  // this account for 200 requests => 10 (outer loop) * 20 (inner array#map)
  const iterations = 10;
  const step = 20;

  for (let j = 1; j < iterations; j += step) {
    // const playlistsFound = findPlaylist({
    //   playlists: lastPlaylists,
    //   playlistTitle,
    //   offset,
    //   userId,
    // });
    //
    // if (playlistsFound.kind === "playlist-found") {
    //   return playlistsFound;
    // }

    const promises = Array.from({ length: step }).map(async (_, i) => {
      const nextOffset = (i + j) * offset;

      const userPlaylists = await getSpotifyUserPlaylists(request, nextOffset);
      // lastPlaylists = userPlaylists;

      // setSpotifyPlaylistsInCache({
      //   userId,
      //   data: userPlaylists,
      //   offset: nextOffset,
      // });

      dispatchProgress(50);
      console.log({ nextOffset });
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

  // const playlistsData = findPlaylist({
  //   playlists: lastPlaylists,
  //   offset: lastPlaylists.offset,
  //   playlistTitle,
  //   items,
  //   userId,
  // });

  return userPlaylists;
}

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
