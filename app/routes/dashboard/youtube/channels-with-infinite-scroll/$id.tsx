import { CheckIcon, MinusIcon, XIcon } from "@heroicons/react/outline";
import {
  Form,
  useBeforeUnload,
  useLoaderData,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  createSpotifyTrack,
  getSpotifyTrackBySearchQuery,
} from "~/models/spotify.server";
import {
  setSessionWithNewAccessToken,
  spotifyStrategy,
} from "~/services/auth.server";
import { searchTrack } from "~/services/spotify.server";
import {
  queryPlaylistItems,
  queryYoutubeChannel,
} from "~/services/youtube.server";

import type { YoutubePlaylistItems } from "~/zod-schemas/YoutubePlaylistSchema";
import type { SpotifyTrack } from "~/models/spotify.server";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { useVirtual } from "react-virtual";
import { countItems, getItems } from "~/services/backend-scroll-test.server";

// type SpotifyAvailability =
//   | {
//       kind: "UNCHECKED";
//     }
//   | {
//       kind: "AVAILABLE";
//       trackId: string;
//     }
//   | {
//       kind: "UNAVAILABLE";
//     };
//
// type YoutubeResponseWithSpotifyAvailability = Omit<
//   YoutubePlaylistItems,
//   "items"
// > & {
//   items: (YoutubePlaylistItems["items"][number] & {
//     spotifyAvailability: SpotifyAvailability;
//   })[];
// };
//
// type ExtendedResponse = YoutubeResponseWithSpotifyAvailability & {
//   nextPageToken: string | null;
//   totalItems: number;
// };
//
// type LoaderData = ExtendedResponse | null;

const LIMIT = 200;
const DATA_OVERSCAN = 40;

const getStartLimit = (searchParams: URLSearchParams) => ({
  nextPageToken: searchParams.get("next") ?? "",
  start: Number(searchParams.get("start") ?? "0"),
  limit: Number(searchParams.get("limit") ?? LIMIT.toString()),
});

// export const loader: LoaderFunction = async ({ params, request }) => {
//
//   if (!params.id) {
//     return null;
//   }
//
//   const { start, limit, nextPageToken } = getStartLimit(
//     new URLSearchParams(new URL(request.url).searchParams)
//   );
//
//   console.log({ start, limit, nextPageToken });
//
//   const channelResponse = await queryYoutubeChannel({
//     id: params.id,
//     part: "contentDetails",
//   });
//
//   const playlistId =
//     channelResponse.items[0].contentDetails.relatedPlaylists.uploads;
//
//   const videosResponse = await queryPlaylistItems(playlistId);
//   const extendedResponse: YoutubeResponseWithSpotifyAvailability = {
//     ...videosResponse,
//     items: await Promise.all(
//       videosResponse.items.map(async (item) => {
//         const track = await getSpotifyTrackBySearchQuery(item.snippet.title);
//
//         let spotifyAvailability: SpotifyAvailability;
//         if (!track) {
//           spotifyAvailability = { kind: "UNCHECKED" };
//         } else {
//           spotifyAvailability =
//             track.availability === "AVAILABLE"
//               ? { kind: "AVAILABLE", trackId: track.id }
//               : { kind: "UNAVAILABLE" };
//         }
//
//         return {
//           ...item,
//           spotifyAvailability,
//         };
//       })
//     ),
//   };
//
//   return json<ExtendedResponse>(
//     {
//       ...extendedResponse,
//       nextPageToken: videosResponse.nextPageToken ?? "",
//       totalItems: videosResponse.pageInfo.totalResults,
//     },
//     {
//       headers: {
//         "Cache-Control": "public, max-age=120",
//       },
//     }
//   );
// };
//

type LoaderData = {
  items: Array<{ id: string; value: string }>;
  totalItems: number;
};

export const loader: LoaderFunction = async ({ request }) => {
  const { start, limit } = getStartLimit(new URL(request.url).searchParams);

  const items = await getItems({ start, limit });
  console.log({itemsLength: items.length});
  const totalItems = await countItems();

  const data: LoaderData = {
    items,
    totalItems,
  };
  return json(data, {
    headers: {
      "Cache-Control": "public, max-age=120",
    },
  });
};

export const action: ActionFunction = async ({ request }) => {
  const spotifySession = await spotifyStrategy.getSession(request);
  // const formData = await request.formData()

  if (!spotifySession) {
    return null;
  }

  const formData = await request.formData();
  const dataEntries = Object.fromEntries(formData);
  const _action = formData.get("_action");

  if (_action === "refreshToken") {
    return setSessionWithNewAccessToken({ request, spotifySession });
  }

  const promiseCallback = async ([videoId, searchQuery]: [
    string,
    FormDataEntryValue
  ]) => {
    const res = await searchTrack({
      request: request,
      searchQuery: searchQuery.toString(),
    });

    if (res.kind === "parsingError") {
      // WARNING: check this
      return null;
    }

    if (res.kind === "expiredToken") {
      // WARNING: not sure if this a good option
      // implement this as a cron job or with setInterval
      return setSessionWithNewAccessToken({ request, spotifySession });
    }

    let track: SpotifyTrack;

    if (res.kind === "error") {
      track = await createSpotifyTrack({
        youtubeVideoId: videoId,
        searchQuery: searchQuery.toString(),
        availability: "UNAVAILABLE",
      });
    } else {
      track = await createSpotifyTrack({
        searchQuery: searchQuery.toString(),
        trackId: res.data.id,
        availability: "AVAILABLE",
        youtubeVideoId: videoId,
      });
    }

    return track;
  };

  const spotifyTracks = Object.entries(dataEntries).map(promiseCallback);

  const res = await Promise.all(spotifyTracks);
  return res;
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const isServerRender = typeof document === "undefined";
const useSSRLayoutEffect = isServerRender ? () => {} : useLayoutEffect;

function useIsHydrating(queryString: string) {
  const [isHydrating] = useState(
    () => !isServerRender && Boolean(document.querySelector(queryString))
  );

  return isHydrating;
}

export default function Channel() {
  const data = useLoaderData<LoaderData>();
  const tracks = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  // const nextPageToken = data?.nextPageToken ?? "";

  const transition = useTransition();
  const hydrating = useIsHydrating("[data-hydrating-signal]");
  const [searchParams, setSearchParams] = useSearchParams();
  const { start, limit } = getStartLimit(searchParams);
  const [initialStart] = useState(() => start);

  const isMountedRef = useRef(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    size: totalItems,
    parentRef,
    estimateSize: useCallback(() => 35, []),
    initialRect: { width: 0, height: 800 },
  });

  useBeforeUnload(
    useCallback(() => {
      if (!parentRef.current) return;
      sessionStorage.setItem(
        "infiniteScrollTop",
        parentRef.current.scrollTop.toString()
      );
    }, [])
  );

  useSSRLayoutEffect(() => {
    if (!hydrating) return;
    if (!parentRef.current) return;

    const inifiniteScrollTop = sessionStorage.getItem("infiniteScrollTop");
    if (!inifiniteScrollTop) return;

    parentRef.current.scrollTop = Number(inifiniteScrollTop);

    return () => {
      sessionStorage.removeItem("infiniteScrollTop");
    };
  }, [initialStart, hydrating]);

  const lowerBoundary = start + DATA_OVERSCAN;
  const upperBoundary = start + limit - DATA_OVERSCAN;
  const middleCount = Math.ceil(limit / 2);

  const [firstVirtualItem] = rowVirtualizer.virtualItems;
  const [lastVirtualItem] = [...rowVirtualizer.virtualItems].reverse();
  if (!firstVirtualItem || !lastVirtualItem) {
    throw new Error("this should never happen");
  }

  let neededStart = start;

  if (firstVirtualItem.index < lowerBoundary) {
    // user is scrolling up. Move the window up
    neededStart =
      Math.floor((firstVirtualItem.index - middleCount) / DATA_OVERSCAN) *
      DATA_OVERSCAN;
  } else if (lastVirtualItem.index > upperBoundary) {
    // user is scrolling down. Move the window down
    neededStart =
      Math.ceil((lastVirtualItem.index - middleCount) / DATA_OVERSCAN) *
      DATA_OVERSCAN;
  }

  // can't go below 0
  if (neededStart < 0) {
    neededStart = 0;
  }

  // can't go above our data
  if (neededStart + limit > totalItems) {
    neededStart = totalItems - limit;
  }

  useEffect(() => {
    if (!isMountedRef.current) {
      return;
    }
    if (neededStart !== start) {
      setSearchParams({
        start: String(neededStart),
        limit: LIMIT.toString(),
      });
    }
  }, [start, neededStart, setSearchParams]);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  return (
    <main>
      <h1>Advanced Infinite Scrolling (offset={start})</h1>

      <div
        ref={parentRef}
        data-hydrating-signal
        className="List"
        style={{
          height: `800px`,
          width: `100%`,
          overflow: "auto",
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.totalSize}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.virtualItems.map((virtualRow) => {
            const index = isMountedRef.current
              ? Math.abs(start - virtualRow.index)
              : virtualRow.index;
            const track = tracks[index];

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className={classNames(
                    "flex gap-2",
                    virtualRow.index % 2 === 0 ? "bg-teal-100" : "bg-yellow-200"
                  )}
                >
                  <span>{virtualRow.index}</span>
                  <span>
                    {track
                      ? track.value
                      : transition.state === "loading"
                      ? "Loading more..."
                      : "Nothing to see here..."}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
