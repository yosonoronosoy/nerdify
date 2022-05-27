import {
  CheckIcon,
  ClockIcon,
  MinusIcon,
  XIcon,
} from "@heroicons/react/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/solid";
import {
  Form,
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import { useLayoutEffect, useRef, useState } from "react";
import {
  setSessionWithNewAccessToken,
  spotifyStrategy,
} from "~/services/auth.server";
import { searchTrack } from "~/services/spotify.server";
import type { ExtendedResponse } from "~/services/youtube.server";
import { queryPlaylistItemFromPageRange } from "~/services/youtube.server";
import {
  getPlaylistResponse,
  queryYoutubeChannel,
} from "~/services/youtube.server";

import { createYoutubeVideo } from "~/models/youtube-video.server";
import type { YoutubeVideo } from "~/models/youtube-video.server";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import {
  createYoutubeChannel,
  getYoutubeChannel,
} from "~/models/youtube-channel.server";
import { Spinner } from "~/icons/spinner";
import Pagination from "~/components/pagination";
import {
  getAlreadyVisitedSession,
  getSpotifySession,
  setAlreadyVisitedSession,
} from "~/services/session.server";
import {
  createYoutubePlaylist,
  getYoutubePlaylistByPlaylistId,
  updateYoutubePlaylistCount,
} from "~/models/youtube-playlist.server";
import invariant from "tiny-invariant";
import { getUserBySpotifyId } from "~/models/user.server";

type LoaderData = ExtendedResponse | null;

const getPageNumber = (searchParams: URLSearchParams) =>
  Number(searchParams.get("page") ?? "1");

export const loader: LoaderFunction = async ({ params, request }) => {
  if (!params.id) {
    return null;
  }

  const pageNumber = getPageNumber(new URL(request.url).searchParams);

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

  let playlistFromDB = await getYoutubePlaylistByPlaylistId(playlistId);

  if (!playlistFromDB) {
    playlistFromDB = await createYoutubePlaylist({
      title: `${channelResponse.items[0].snippet.title} - Uploads`,
      playlistId,
      trackCount: 0,
    });
  }

  const alreadyVisited = await getAlreadyVisitedSession({
    id: params.id,
    request,
    serviceKey: "youtube-channel",
  });

  let headers: {
    headers: {
      [key: string]: string;
    };
  } = {
    headers: {
      "Cache-Control": "public, max-age=120",
    },
  };
  if (!alreadyVisited) {
    const alreadyVisitedHeaders = await setAlreadyVisitedSession({
      id: params.id,
      request,
      serviceKey: "youtube-channel",
    });

    headers = {
      headers: {
        ...alreadyVisitedHeaders.headers,
      },
    };

    const res = await queryPlaylistItemFromPageRange({
      playlistId,
      from: 1,
      to: 5,
      youtubePlaylistIdFromDB: playlistFromDB.id,
    });

    await updateYoutubePlaylistCount({
      id: playlistFromDB.id,
      trackCount: res.pageInfo.totalResults,
    });
  }

  const spotifySession = await getSpotifySession(request);
  invariant(spotifySession?.user, "this should never happen");

  const spotifyUserId = spotifySession.user.id;
  const user = await getUserBySpotifyId(spotifyUserId);
  invariant(user, "this should never happen");
  const userId = user.id;

  const extendedResponse = await getPlaylistResponse({
    userId,
    playlistId,
    trackCountFromDB: playlistFromDB?.trackCount,
    pageNumber,
    youtubePlaylistIdFromDB: playlistFromDB.id,
  });

  return json<ExtendedResponse>(extendedResponse, headers);
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

  function filterNull(item: YoutubeVideo | null): item is YoutubeVideo {
    return item !== null;
  }

  return json<YoutubeVideo[]>(res.filter(filterNull));
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const isServerRender = typeof document === "undefined";
const useSSRLayoutEffect = isServerRender ? () => {} : useLayoutEffect;

export default function Channel() {
  const data = useLoaderData<LoaderData>();
  const tracks = data?.items ?? [];
  const [searchParams] = useSearchParams();

  const transition = useTransition();
  const currentPage = getPageNumber(searchParams);

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
                <div className="absolute top-0 left-12 z-20 flex h-12 items-center space-x-3 bg-gray-50 sm:left-16">
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
                </div>
              )}
              <Form
                className="h-[800px] overflow-y-auto"
                method="post"
                id="bulk-process-form"
                action={`?${searchParams}`}
              >
                <table className="relative min-w-full table-fixed divide-y divide-gray-300 ">
                  <thead className="sticky top-0 z-10 bg-gray-50">
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
                      <Row
                        key={track.id}
                        track={track}
                        isSelected={selectedTracks.includes(track)}
                        onCheckboxChange={(e) =>
                          setSelectedTracks(
                            e.target.checked
                              ? [...selectedTracks, track]
                              : selectedTracks.filter((p) => p !== track)
                          )
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </Form>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <Pagination
            pageSize={50}
            totalCount={data?.totalItems || 0}
            currentPage={currentPage}
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  track,
  isSelected,
  onCheckboxChange,
}: {
  track: ExtendedResponse["items"][number];
  isSelected: boolean;
  onCheckboxChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
  currentPage?: number;
}) {
  const transition = useTransition();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  return (
    <tr className={isSelected ? "bg-gray-50" : undefined}>
      <td className="relative w-12 px-6 sm:w-16 sm:px-8">
        {isSelected && (
          <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
        )}
        <input
          type="checkbox"
          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
          name={track.snippet.resourceId.videoId}
          value={track.snippet.title}
          checked={isSelected}
          onChange={onCheckboxChange}
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
          isSelected ? "text-indigo-600" : "text-gray-900"
        )}
      >
        <Link
          prefetch="intent"
          to={`video-player/${track.snippet.resourceId.videoId}`}
        >
          <div>{track.snippet.title}</div>
          {track.trackRating ? (
            <Rating review={{ rating: track.trackRating.rating }} />
          ) : (
            <div className="h-4" />
          )}
        </Link>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {/* WARNING: check if this works */}
        {track.snippet.channelTitle}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {(transition.state === "submitting" ||
          transition.type === "loaderSubmissionRedirect") &&
        isSelected ? (
          <div>
            <div className="mx-auto">
              <Spinner />
            </div>
          </div>
        ) : (
          <div>
            {track.spotifyAvailability.kind === "UNCHECKED" ? (
              <MinusIcon className="mx-auto block h-4 w-4" />
            ) : track.spotifyAvailability.kind === "PENDING" ? (
              <Link
                to={`confirm-track/${track.snippet.resourceId.videoId}?${searchParams}`}
              >
                <ClockIcon className="mx-auto block h-4 w-4 text-yellow-500" />
              </Link>
            ) : track.spotifyAvailability.kind === "AVAILABLE" ? (
              <CheckIcon className="mx-auto block h-4 w-4 text-green-500" />
            ) : (
              <XIcon className="mx-auto block h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

function Rating({ review }: { review: { rating: number } }) {
  const { rating: rawRating } = review;
  const rating = (rawRating * 5) / 100;
  return (
    <div className="mt-4 flex items-center">
      {[1, 2, 3, 4, 5].map((currentRating) => (
        <StarIconSolid
          key={currentRating}
          className={classNames(
            rating < currentRating ? "text-gray-300" : "text-indigo-300",
            "h-5 w-5 flex-shrink-0"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
