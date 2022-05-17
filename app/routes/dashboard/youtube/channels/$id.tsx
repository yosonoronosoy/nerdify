import {
  CheckIcon,
  ClockIcon,
  MinusIcon,
  XIcon,
} from "@heroicons/react/outline";
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import { useLayoutEffect, useRef, useState } from "react";
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
import {
  createYoutubeVideo,
  getYoutubeVideoByTitle,
} from "~/models/youtubeVideo.server";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import {
  createYoutubeChannel,
  getYoutubeChannel,
} from "~/models/youtubeChannel.server";
import { Spinner } from "~/icons/Spinner";

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
    }
  | {
      kind: "PENDING";
      pendingSpotifyTracks: SpotifyTrack[];
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

const getNextPageToken = (searchParams: URLSearchParams) => ({
  nextPageToken: searchParams.get("nextPageToken") ?? "",
});

export const loader: LoaderFunction = async ({ params, request }) => {
  console.log('===================== CALLED +==========================')
  if (!params.id) {
    return null;
  }

  const { nextPageToken } = getNextPageToken(
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
        const track = await getYoutubeVideoByTitle({
          title: item.snippet.title,
        });

        let spotifyAvailability: SpotifyAvailability;
        if (!track) {
          spotifyAvailability = { kind: "UNCHECKED" };
        } else {
          spotifyAvailability =
            track.availability === "AVAILABLE"
              ? { kind: "AVAILABLE", trackId: track.id }
              : track.availability === "PENDING"
              ? { kind: "PENDING", pendingSpotifyTracks: track.spotifyTracks }
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
  const { _action, ...dataEntries } = Object.fromEntries(formData);

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

    if (res.kind === "error") {
      return createYoutubeVideo({
        title: searchQuery.toString(),
        channelId: youtubeChannelId,
        youtubeVideoId: videoId,
        availability: "UNAVAILABLE",
      });
    }

    return createYoutubeVideo({
      title: searchQuery.toString(),
      channelId: youtubeChannelId,
      youtubeVideoId: videoId,
      availability: "PENDING",
      spotifyTracks: res.data.map((item) => ({
        name: item.name,
        trackId: item.id,
        searchQuery: searchQuery.toString(),
        trackUrl: item.external_urls.spotify,
        artists: item.artists,
        images: item.album.images,
      })),
    });
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
  const tracks = data?.items ?? [];

  const transition = useTransition();

  const checkbox = useRef<HTMLInputElement | null>(null);
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<typeof tracks>([]);

  useSSRLayoutEffect(() => {
    const isIndeterminate =
      selectedTracks.length > 0 && selectedTracks.length < tracks.length;
    setChecked(selectedTracks.length === tracks.length);
    setIndeterminate(isIndeterminate);

    // WARNING: check this
    if (checkbox.current) {
      checkbox.current.indeterminate = isIndeterminate;
    }
  }, [selectedTracks, tracks.length]);

  function toggleAll() {
    setSelectedTracks(checked || indeterminate ? [] : tracks);
    setChecked(!checked && !indeterminate);
    setIndeterminate(false);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Outlet />
      <Form method="post">
        <button
          className="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
          name="_action"
          value="refreshToken"
          disabled={transition.state === "submitting"}
        >
          Refresh Token
        </button>
      </Form>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="relative overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {selectedTracks.length > 0 && (
                <div className="absolute top-0 left-12 flex h-12 items-center space-x-3 bg-gray-50 sm:left-16">
                  <button
                    className="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                    form="bulk-process-form"
                    disabled={transition.state === "submitting"}
                  >
                    Check Spotify Availability
                  </button>

                  {/* TODO: only show this when the tracks are available in spotify */}
                  <button className="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30">
                    Create spotify playlist
                  </button>
                  <button className="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30">
                    Recheck Unavailable Tracks
                  </button>
                </div>
              )}
              <Form method="post" id="bulk-process-form">
                <table className="min-w-full table-fixed divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="relative w-12 px-6 sm:w-16 sm:px-8"
                      >
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                          ref={checkbox}
                          checked={checked}
                          onChange={toggleAll}
                        />
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Thumbnail
                      </th>
                      <th
                        scope="col"
                        className="min-w-[12rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900"
                      >
                        Title
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Channel
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Available on Spotify
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {tracks.map((track) => (
                      <tr
                        key={track.id}
                        className={
                          selectedTracks.includes(track)
                            ? "bg-gray-50"
                            : undefined
                        }
                      >
                        <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                          {selectedTracks.includes(track) && (
                            <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                          )}
                          <input
                            type="checkbox"
                            className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
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
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <img
                            src={track.snippet.thumbnails.default?.url}
                            alt="youtube-video-thumbnail"
                          />
                        </td>
                        <td
                          className={classNames(
                            "whitespace-nowrap py-4 pr-3 text-sm font-medium",
                            selectedTracks.includes(track)
                              ? "text-indigo-600"
                              : "text-gray-900"
                          )}
                        >
                          {track.snippet.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {track.snippet.channelTitle}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {(transition.state === "submitting" ||
                            transition.type === "loaderSubmissionRedirect") &&
                          selectedTracks.includes(track) ? (
                            <div>
                              <div className="mx-auto">
                                <Spinner />
                              </div>
                            </div>
                          ) : (
                            <div>
                              {track.spotifyAvailability.kind ===
                              "UNCHECKED" ? (
                                <MinusIcon className="mx-auto block h-4 w-4" />
                              ) : track.spotifyAvailability.kind ===
                                "PENDING" ? (
                                <Link to={track.id}>
                                  <ClockIcon className="mx-auto block h-4 w-4 text-yellow-500" />
                                </Link>
                              ) : track.spotifyAvailability.kind ===
                                "AVAILABLE" ? (
                                <CheckIcon className="mx-auto block h-4 w-4 text-green-500" />
                              ) : (
                                <XIcon className="mx-auto block h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
