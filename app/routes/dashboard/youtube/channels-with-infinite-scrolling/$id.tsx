import {
  CheckIcon,
  MinusIcon,
  RefreshIcon,
  XIcon,
} from "@heroicons/react/outline";
import {
  Form,
  useActionData,
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
  createSpotifyTrackFromYoutubeChannel,
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
import { BigSpinner } from "~/icons/BigSpinner";
import {
  createYoutubeChannel,
  getYoutubeChannel,
} from "~/models/youtubeChannel.server";

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

  const { nextPageToken } = getStartLimit(
    new URLSearchParams(new URL(request.url).searchParams)
  );

  const channelResponse = await queryYoutubeChannel({
    id: params.id,
    part: "contentDetails,snippet",
  });

  const channelId = channelResponse.items[0].id;
  const youtubeChannelFromDB = await getYoutubeChannel({ channelId });
  if (!youtubeChannelFromDB) {
    await createYoutubeChannel({
      title: channelResponse.items[0].snippet.title,
      channelId,
    });
  }

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

export const action: ActionFunction = async ({ request, params }) => {
  const spotifySession = await spotifyStrategy.getSession(request);

  const youtubeChannelId = params.id;

  if (!youtubeChannelId) {
    return null;
  }

  if (!spotifySession) {
    return null;
  }

  const formData = await request.formData();
  const dataEntries = Object.fromEntries(formData);
  console.log({ dataEntries });

  // if (_action === "refreshToken") {
  //   return setSessionWithNewAccessToken({ request, spotifySession });
  // }

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

      console.log("============= PARSING ERROR ======================");
      console.log(res.error);
      return null;
    }

    if (res.kind === "expiredToken") {
      // WARNING: not sure if this a good option
      // WARNING: maybe implement this as a cron job or with setInterval
      console.log("============= EXPIRED TOKEN ======================");
      return null;
    }

    if (res.kind === "noData") {
      console.log("=========== NO DATA =====================");
      console.log(res.error);
      return null;
    }

    let track: SpotifyTrack;

    console.log({ searchQuery: searchQuery.toString() });

    if (res.kind === "error") {
      track = await createSpotifyTrackFromYoutubeChannel({
        youtubeVideoId: videoId,
        searchQuery: searchQuery.toString(),
        availability: "UNAVAILABLE",
        youtubeChannelId,
      });
    } else {
      track = await createSpotifyTrackFromYoutubeChannel({
        searchQuery: searchQuery.toString(),
        trackId: res.data.id,
        availability: "AVAILABLE",
        youtubeVideoId: videoId,
        youtubeChannelId,
      });
    }

    return track;
  };

  const spotifyTracks = Object.entries(dataEntries).map(promiseCallback);

  const res = await Promise.all(spotifyTracks);
  return json(res.filter((item) => item !== null));
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const isServerRender = typeof document === "undefined";
const useSSRLayoutEffect = isServerRender ? () => {} : useLayoutEffect;

export default function Channel() {
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<SpotifyTrack[]>();
  const totalItems = data?.totalItems ?? 0;
  const nextPageToken = data?.nextPageToken ?? "";

  const checkbox = useRef<HTMLInputElement | null>(null);
  const [allChecked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<
    YoutubeResponseWithSpotifyAvailability["items"]
  >([]);

  function toggleAll() {
    setSelectedTracks(allChecked || indeterminate ? [] : data?.items ?? []);
    setChecked(!allChecked && !indeterminate);
    setIndeterminate(false);
  }

  const [, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<
    YoutubeResponseWithSpotifyAvailability["items"]
  >([]);

  const [currentEditingTrack, setCurrentEditingTrack] = useState<string | null>(
    null
  );

  const [editingTrackTitle, setEditingTrackTitle] = useState<
    string | undefined
  >(undefined);

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

    // FIX: need to correct for user getting back to the page
    // FIX: sometimes it will load the same data again
    // const dataItems = data.items;
    // const newItems = [...(prevData.current?.items ?? []), ...dataItems];
    // setItems(newItems);
    // prevData.current = { ...data, items: newItems };
      setItems((prevItems) => [...prevItems, ...data.items]);
  }, [actionData, data]);

  useEffect(() => {
    if (!currentEditingTrack || !items) return;

    setEditingTrackTitle(
      items.find((item) => item.id === currentEditingTrack)?.snippet.title
    );
  }, [currentEditingTrack, items]);

  useSSRLayoutEffect(() => {
    const tracks = data?.items ?? [];

    const isIndeterminate =
      selectedTracks.length > 0 && selectedTracks.length < tracks.length;

    setChecked(selectedTracks.length === tracks.length);
    setIndeterminate(isIndeterminate);
  }, [data?.items, selectedTracks.length]);

  //TODO: add tooltips explaining edit and recheck functionality
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      <div className="min-w-full border border-gray-200">
        <div className="relative grid grid-cols-12 border-b border-gray-300 bg-gray-50 py-4">
          {selectedTracks.length > 0 && (
            <div className="absolute top-0 left-12 flex w-36 items-center justify-center space-x-3 bg-gray-50 py-2.5 sm:left-24">
              <button
                form="bulk-process-form"
                className="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Bulk process
              </button>
            </div>
          )}
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
              ref={checkbox}
              checked={allChecked}
              onChange={toggleAll}
            />
          </div>
          <span className="col-span-2 flex items-center justify-center text-sm font-semibold">
            Thumbnail
          </span>
          <span className="col-span-4 flex items-center justify-start pl-8 text-sm font-semibold">
            Title
          </span>
          <span className="col-span-3 flex items-center justify-center text-sm font-semibold">
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
            id="bulk-process-form"
            className="relative w-full divide-y divide-gray-200"
            style={{
              height: `${rowVirtualizer.totalSize}px`,
            }}
          >
            {rowVirtualizer.virtualItems.map((virtualRow) => {
              const track = items[virtualRow.index];

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
                  {track ? (
                    <>
                      <div className="relative flex items-center justify-center">
                        {selectedTracks.includes(track) && (
                          <div className="absolute inset-y-[-16px]  left-0 w-0.5 bg-indigo-600" />
                        )}
                        <input
                          type="checkbox"
                          className={classNames(
                            "h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6",
                            currentEditingTrack === track.id
                              ? "bg-gray-200 opacity-60"
                              : ""
                          )}
                          name={track.id}
                          value={track.snippet.title}
                          checked={selectedTracks.includes(track)}
                          disabled={currentEditingTrack === track.id}
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
                          "col-span-4 flex items-center justify-start whitespace-nowrap text-sm font-medium",
                          selectedTracks.includes(track)
                            ? "text-indigo-600"
                            : "text-gray-900",
                          currentEditingTrack !== track.id ? "pl-8" : ""
                        )}
                      >
                        {currentEditingTrack === track.id ? (
                          <div className="flex w-full gap-2">
                            <label htmlFor={track.id} className="sr-only">
                              Track
                            </label>
                            <input
                              type="text"
                              name={track.id}
                              id={track.id}
                              className="block flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              value={editingTrackTitle}
                              onChange={(e) =>
                                setEditingTrackTitle(e.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="inline-flex items-center rounded border border-transparent bg-indigo-100 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              onClick={() => {
                                setItems(
                                  items.map((p) =>
                                    p.id === track.id
                                      ? {
                                          ...p,
                                          snippet: {
                                            ...p.snippet,
                                            title:
                                              !editingTrackTitle ||
                                              editingTrackTitle === ""
                                                ? track.snippet.title
                                                : editingTrackTitle.trim(),
                                          },
                                        }
                                      : p
                                  )
                                );
                                setCurrentEditingTrack(null);
                              }}
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          track.snippet.title
                        )}
                      </div>
                      <div className="col-span-3 flex  items-center justify-center whitespace-nowrap text-sm text-gray-500">
                        {track.spotifyAvailability.kind === "UNCHECKED" ? (
                          <MinusIcon className="h-5 w-5" />
                        ) : track.spotifyAvailability.kind === "AVAILABLE" ? (
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="flex gap-4">
                            <XIcon className="h-5 w-5 text-red-500" />
                            <button
                              name="_action"
                              value={`recheck:${track.id}:${track.snippet.title}`}
                            >
                              <RefreshIcon className="h-5 w-5 text-gray-400 transition-colors hover:text-gray-300" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-start text-sm">
                        {currentEditingTrack !== track.id &&
                        track.spotifyAvailability.kind !== "AVAILABLE" ? (
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => setCurrentEditingTrack(track.id)}
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </>
                  ) : transition.state === "loading" ? (
                    <div
                      key={virtualRow.key}
                      className="grid-span-2 col-start-7 self-center"
                    >
                      <BigSpinner />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </Form>
        </div>
      </div>
    </main>
  );
}
