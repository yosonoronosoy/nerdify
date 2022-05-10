import { CheckIcon, MinusIcon, XIcon } from "@heroicons/react/outline";
import {
  Form,
  useLoaderData,
  useParams,
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

type SpotifyAvailability =
  | {
      kind: "UNCHECKED";
    }
  | {
      kind: "AVAILABLE";
      trackId: string;
    }
  | {
      kind: "UNAVAILABLE";
    };

type YoutubeResponseWithSpotifyAvailability = Omit<
  YoutubePlaylistItems,
  "items"
> & {
  items: (YoutubePlaylistItems["items"][number] & {
    spotifyAvailability: SpotifyAvailability;
  })[];
};

type ExtendedResponse = YoutubeResponseWithSpotifyAvailability & {
  nextPageToken: string | null;
  totalItems: number;
};

type LoaderData = ExtendedResponse | null;

const LIMIT = 50;
const DATA_OVERSCAN = 0;

const getStartLimit = (searchParams: URLSearchParams) => ({
  nextPageToken: searchParams.get("nextPageToken") ?? "",
  start: Number(searchParams.get("start") ?? "0"),
  limit: Number(searchParams.get("limit") ?? LIMIT.toString()),
});

export const loader: LoaderFunction = async ({ params, request }) => {
  if (!params.id) {
    return null;
  }

  const { start, limit, nextPageToken } = getStartLimit(
    new URLSearchParams(new URL(request.url).searchParams)
  );

  console.log({ start, limit, nextPageToken });

  const channelResponse = await queryYoutubeChannel({
    id: params.id,
    part: "contentDetails",
  });

  const playlistId =
    channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

  const videosResponse = await queryPlaylistItems(playlistId, nextPageToken);
  const extendedResponse: YoutubeResponseWithSpotifyAvailability = {
    ...videosResponse,
    items: await Promise.all(
      videosResponse.items.map(async (item) => {
        const track = await getSpotifyTrackBySearchQuery(item.snippet.title);

        let spotifyAvailability: SpotifyAvailability;
        if (!track) {
          spotifyAvailability = { kind: "UNCHECKED" };
        } else {
          spotifyAvailability =
            track.availability === "AVAILABLE"
              ? { kind: "AVAILABLE", trackId: track.id }
              : { kind: "UNAVAILABLE" };
        }

        return {
          ...item,
          spotifyAvailability,
        };
      })
    ),
  };

  return json<ExtendedResponse>(
    {
      ...extendedResponse,
      nextPageToken: videosResponse.nextPageToken ?? "",
      totalItems: videosResponse.pageInfo.totalResults,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=120",
      },
    }
  );
};

export const action: ActionFunction = async ({ request }) => {
  const spotifySession = await spotifyStrategy.getSession(request);

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

export default function Channel() {
  const data = useLoaderData<LoaderData>();
  const totalItems = data?.totalItems ?? 0;
  const nextPageToken = data?.nextPageToken ?? "";

  const checkbox = useRef<HTMLInputElement | null>(null);
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<
    YoutubeResponseWithSpotifyAvailability["items"]
  >([]);

  function toggleAll() {
    setSelectedTracks(checked || indeterminate ? [] : data?.items ?? []);
    setChecked(!checked && !indeterminate);
    setIndeterminate(false);
  }

  const prevData = useRef<LoaderData>(null);

  const [, setSearchParams] = useSearchParams();

  const [items, setItems] = useState(data?.items ?? []);
  const params = useParams();
  const pageId = params.id;

  const transition = useTransition();

  const startRef = useRef(0);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtual({
    size: totalItems,
    parentRef,
    estimateSize: useCallback(() => 90 + 16 * 2, []),
    initialRect: { width: 0, height: 800 },
  });

  const [lastVirtualItem] = [...rowVirtualizer.virtualItems].reverse();
  if (!lastVirtualItem) {
    throw new Error("this should never happen");
  }

  let newStart = startRef.current;
  const upperBoundary = startRef.current + LIMIT - DATA_OVERSCAN;

  if (lastVirtualItem.index > upperBoundary) {
    // user is scrolling down. Move the window down
    newStart = startRef.current + LIMIT;
  }

  useSSRLayoutEffect(() => {
    const tracks = data?.items ?? [];

    const isIndeterminate =
      selectedTracks.length > 0 && selectedTracks.length < tracks.length;

    setChecked(selectedTracks.length === tracks.length);
    setIndeterminate(isIndeterminate);
  }, [data?.items, selectedTracks.length]);

  useEffect(() => {
    if (newStart === startRef.current) return;

    setSearchParams({
      start: String(newStart),
      limit: String(LIMIT),
      nextPageToken: nextPageToken,
    });

    startRef.current = newStart;
  }, [newStart, pageId, nextPageToken, setSearchParams]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const dataItems = data.items;
    const newItems = [...(prevData.current?.items ?? []), ...dataItems];
    setItems(newItems);
    prevData.current = { ...data, items: newItems };
  }, [data]);

  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <div className="min-w-full border border-gray-200">
        <div className="grid grid-cols-12 border-b border-gray-300 bg-gray-50 py-4">
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
              ref={checkbox}
              checked={checked}
              onChange={toggleAll}
            />
          </div>
          <span className="col-span-2 flex items-center justify-center text-sm font-semibold">
            Thumbnail
          </span>
          <span className="col-span-5 flex items-center justify-start pl-12 text-sm font-semibold">
            Title
          </span>
          <span className="col-span-4 flex items-center justify-center text-sm font-semibold">
            Available on Spotify
          </span>
        </div>

        <div
          ref={parentRef}
          className="List"
          style={{
            height: `800px`,
            width: `100%`,
            overflow: "auto",
          }}
        >
          <Form
            method="post"
            className="relative w-full divide-y divide-gray-200"
            style={{
              height: `${rowVirtualizer.totalSize}px`,
            }}
          >
            {rowVirtualizer.virtualItems.map((virtualRow) => {
              const track = items[virtualRow.index];

              if (!track) {
                return null;
              }

              return (
                <div
                  key={virtualRow.key}
                  className={classNames(
                    "absolute grid w-full grid-cols-12 py-4",
                    selectedTracks.includes(track) ? "bg-gray-50" : ""
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    {selectedTracks.includes(track) && (
                      <div className="absolute inset-y-[-16px]  left-0 w-0.5 bg-indigo-600" />
                    )}
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      name={track.id}
                      value={track.snippet.title}
                      checked={selectedTracks.includes(track)}
                      onChange={(e) =>
                        setSelectedTracks(
                          e.target.checked
                            ? [...selectedTracks, track]
                            : selectedTracks.filter((p) => p !== track)
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-center whitespace-nowrap text-sm text-gray-500">
                    <img
                      src={track.snippet.thumbnails.default?.url}
                      alt="youtube-video-thumbnail"
                    />
                  </div>
                  <div
                    className={classNames(
                      "col-span-5 flex items-center justify-start whitespace-nowrap pl-12 text-sm font-medium",
                      selectedTracks.includes(track)
                        ? "text-indigo-600"
                        : "text-gray-900"
                    )}
                  >
                    {track.snippet.title}
                  </div>
                  <div className="col-span-4 flex  items-center justify-center whitespace-nowrap text-sm text-gray-500">
                    {track.spotifyAvailability.kind === "UNCHECKED" ? (
                      <MinusIcon className="h-6 w-6" />
                    ) : track.spotifyAvailability.kind === "AVAILABLE" ? (
                      <CheckIcon className="h-6 w-6 text-green-500" />
                    ) : (
                      <XIcon className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </Form>
        </div>
      </div>
    </main>
  );
}
