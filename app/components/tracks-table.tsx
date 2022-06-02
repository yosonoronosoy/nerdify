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
  useLocation,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Spinner } from "~/icons/spinner";
import type { ExtendedResponse } from "~/services/youtube.server";
import { classNames } from "~/utils";
import Pagination from "./pagination";

const isServerRender = typeof document === "undefined";
const useSSRLayoutEffect = isServerRender ? () => {} : useLayoutEffect;

const getPageNumber = (searchParams: URLSearchParams) =>
  Number(searchParams.get("page") ?? "1");

// FIX: fix tracks types
// FIX: consider leaving Row as a children prop
type Resource = { resourceId: string; resourceType: string };
export default function TracksTable({
  tracks,
  totalItems,
  playlistId,
  resource,
}: {
  tracks: ExtendedResponse["items"];
  totalItems?: number;
  playlistId?: string;
  resource: Resource;
}) {
  const [searchParams] = useSearchParams();

  const transition = useTransition();
  const currentPage = getPageNumber(searchParams);

  const checkbox = useRef<HTMLInputElement | null>(null);
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<any[]>([]);

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
        {/* FIX: refresh token should be done automatically */}
        <button
          className="inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
          name="_action"
          value="refreshToken"
          disabled={transition.state === "submitting"}
        >
          Refresh Token
        </button>
      </Form>
      <div className="isolate mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="relative overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <Form
                className="h-[800px] overflow-y-auto"
                method="post"
                id="bulk-process-form"
                action={`?${searchParams}`}
              >
                <input type="hidden" name="playlistId" value={playlistId} />
                <table className="relative min-w-full table-fixed divide-y divide-gray-300 ">
                  <thead className="sticky top-0 z-10  bg-gray-50">
                    {selectedTracks.length > 0 && (
                      <div className="absolute top-0 z-20 flex h-[98%] items-center space-x-3 bg-gray-50 sm:left-16">
                        <button
                          className="mx-2 inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                          disabled={transition.state === "submitting"}
                        >
                          Check Spotify Availability
                        </button>
                      </div>
                    )}
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
                        resource={resource}
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
            totalCount={totalItems || 0}
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
  // WARNING: is this prop drilling?
  resource,
}: {
  track: ExtendedResponse["items"][number];
  isSelected: boolean;
  onCheckboxChange: React.ChangeEventHandler<HTMLInputElement> | undefined;
  currentPage?: number;
  resource: Resource;
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
        {track.snippet.channelTitle}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {(transition.state === "submitting" ||
          transition.type === "loaderSubmissionRedirect") &&
        isSelected ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div>
            {track.spotifyAvailability.kind === "UNCHECKED" ? (
              <MinusIcon className="mx-auto block h-4 w-4" />
            ) : track.spotifyAvailability.kind === "PENDING" ? (
              <Link
                state={{
                  prevUrl: location.pathname,
                  resourceId: resource.resourceId,
                  resourceType: resource.resourceType,
                }}
                to={`/dashboard/youtube/confirm-track/${track.snippet.resourceId.videoId}?${searchParams}`}
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
