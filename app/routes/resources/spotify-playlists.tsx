import type { LoaderFunction } from "@remix-run/server-runtime";
import fs from "fs/promises";
import path from "path";
import { getSpotifyUserPlaylists } from "~/services/spotify.server";
import type { SpotifyPlaylistSchema } from "~/zod-schemas/spotify-playlists-schema.server";

const timer = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const filename = path.join(__dirname, "..", "spotify-playlists.txt");
console.log({ filename });

export const loader: LoaderFunction = async ({ request }) => {
  let userPlaylists = await getSpotifyUserPlaylists(request);
  const totalRequests = Math.ceil(userPlaylists.total / userPlaylists.limit);
  console.log({
    totalPlaylists: userPlaylists.total,
    limit: userPlaylists.limit,
  });
  console.log({ totalRequests });
  // const totalRequests = 5;
  // let requestCount = 1;
  //
  // while (requestCount < totalRequests) {
  //   userPlaylists = await getSpotifyUserPlaylists(
  //     request,
  //     userPlaylists.offset
  //   );
  //
  //   const requestProgress = (requestCount / totalRequests) * 100;
  //   emitter.emit("progress-received", `${requestProgress}%`);
  //
  //   console.log({ requestCount });
  //   requestCount++;
  // }

  let requestCount = 1;
  console.time("for-loop");
  const items: SpotifyPlaylistSchema[] = userPlaylists.items;
  for (let j = 1; j < totalRequests; j = j + 20) {
    const promises = Array.from({ length: 20 }).map((_, i) => {
      return getSpotifyUserPlaylists(request, (i + j) * 50);
    });
    const res = await Promise.all(promises);
    items.push(
      ...res.reduce(
        (acc, r) => [...acc, ...r.items],
        [] as SpotifyPlaylistSchema[]
      )
    );
    // await timer(300);
    console.log({ requestCount: requestCount++ });
  }
  console.timeEnd("for-loop");

  // const res = await Promise.all(promises);
  console.log(items.length);
  console.log({ items: items.map((i) => i.name) });
  await fs.writeFile(filename, JSON.stringify(items, null, 2));
  console.log({ requests: requestCount });

  return null;
};
