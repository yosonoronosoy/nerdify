import { Dialog, RadioGroup } from "@headlessui/react";
import { ClockIcon } from "@heroicons/react/outline";
import {
  Form,
  useLoaderData,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { useEffect, useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { DialogModal } from "~/components/dialog-modal";
import { Search } from "~/components/search-input";
import {
  getYoutubeVideoByVideoId,
  makeSpotifyTrackAvailableFromYoutubeVideo,
  makeSpotifyTrackUnavailableFromYoutubeVideo,
} from "~/models/youtube-video.server";

type LoaderData = Awaited<ReturnType<typeof getYoutubeVideoByVideoId>>;

export const loader: LoaderFunction = async ({ params, request }) => {
  const videoId = params.videoId;
  invariant(videoId, "videoId is required");
  console.log({videoId})

  const video = await getYoutubeVideoByVideoId({ youtubeVideoId: videoId });
  console.log({video})

  return json<LoaderData>(video);
};

export const action: ActionFunction = async ({ request, params }) => {
  const id = params.id;
  const youtubeVideoId = params.videoId;

  invariant(id, "id is required");
  invariant(youtubeVideoId, "videoId is required");

  const formData = await request.formData();
  const {
    _action,
    page: pageText,
    ...dataEntries
  } = Object.fromEntries(formData);
  const page = Number(pageText);
  console.log({ page });

  invariant(!Number.isNaN(page), "page must be a number");

  if (_action === "set-unavailable") {
    await makeSpotifyTrackUnavailableFromYoutubeVideo({
      youtubeVideoId,
    });

    return redirect(`/dashboard/youtube/channels/${id}?page=${page}`, {
      status: 301,
    });
  }

  if (_action === "confirm") {
    const spotifyTrackId = dataEntries["_track[trackId]"]?.toString();
    invariant(spotifyTrackId, "trackId is required");

    await makeSpotifyTrackAvailableFromYoutubeVideo({
      spotifyTrackId,
      youtubeVideoId,
    });

    return redirect(`/dashboard/youtube/channels/${id}?page=${page}`);
  }

  return null;
};

function classNames(...args: string[]) {
  return args.filter(Boolean).join(" ");
}

export default function ConfirmTrackModal() {
  const data = useLoaderData<LoaderData>();
  const { id: channelId } = useParams();
  const [searchParams] = useSearchParams();

  const [selected, setSelected] = useState();
  const [filterQuery, setFilterQuery] = useState("");
  const spotifyTracks = useMemo(
    () => data?.spotifyTracks ?? [],
    [data?.spotifyTracks]
  );
  const [filteredTracks, setFilteredTracks] = useState(spotifyTracks);

  useEffect(() => {
    const filtered = spotifyTracks.filter((track) => {
      return (
        track.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        track.artists.some((artist) =>
          artist.name.toLowerCase().includes(filterQuery.toLowerCase())
        )
      );
    });

    setFilteredTracks(filtered);
  }, [filterQuery, spotifyTracks]);

  const prevUrl = `/dashboard/youtube/channels/${channelId}?${searchParams}`;
  const isConfirm = Boolean(selected);

  return (
    <DialogModal
      prevUrl={prevUrl}
      isConfirm={isConfirm}
      formId="confirm-track-form"
      confirmButtonTitle={isConfirm ? "Confirm" : "Set Track as Unavailable"}
    >
      <Search className="absolute right-0 top-24 w-56">
        <Search.Input
          placeholder="Filter tracks"
          onChange={(e) => setFilterQuery(e.target.value)}
          className="rounded-md"
        />
      </Search>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
        <ClockIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
      </div>
      <div className="mt-3 text-center sm:mt-5">
        <Dialog.Title
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900"
        >
          Confirm Track
        </Dialog.Title>
        <Dialog.Title
          as="h4"
          className="my-4 text-base font-medium leading-6 text-gray-500"
        >
          {data?.title}
        </Dialog.Title>
        <div className="mt-2">
          {filteredTracks.length > 0 ? (
            <Form reloadDocument method="post" id="confirm-track-form">
              <input
                hidden
                name="_action"
                readOnly
                value={selected ? "confirm" : "set-unavailable"}
              />
              <input
                hidden
                name="page"
                value={searchParams.get("page") ?? "1"}
              />
              <RadioGroup value={selected} onChange={setSelected} name="_track">
                <RadioGroup.Label className="sr-only">
                  Found Spotify Tracks
                </RadioGroup.Label>
                <div className="relative h-[450px] -space-y-px overflow-y-auto rounded-md bg-white">
                  {filteredTracks.map((track, trackIdx) => (
                    <RadioGroup.Option
                      key={track.id}
                      value={track}
                      className={({ checked }) =>
                        classNames(
                          trackIdx === 0 ? "rounded-tl-md rounded-tr-md" : "",
                          trackIdx === spotifyTracks.length - 1
                            ? "rounded-bl-md rounded-br-md"
                            : "",
                          checked
                            ? "z-10 border-indigo-200 bg-indigo-50"
                            : "border-gray-200",
                          "relative flex cursor-pointer flex-col border p-4 focus:outline-none md:grid md:grid-cols-9 md:gap-2 md:pl-4 md:pr-6"
                        )
                      }
                    >
                      {({ active, checked }) => (
                        <>
                          <div className="col-span-1 flex items-center text-sm">
                            <span
                              className={classNames(
                                checked
                                  ? "border-transparent bg-indigo-600"
                                  : "border-gray-300 bg-white",
                                active
                                  ? "ring-2 ring-indigo-500 ring-offset-2"
                                  : "",
                                "flex h-4 w-4 items-center justify-center rounded-full border"
                              )}
                              aria-hidden="true"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            </span>
                            <RadioGroup.Label
                              as="span"
                              className={classNames(
                                checked ? "text-indigo-900" : "text-gray-900",
                                "ml-3 font-medium"
                              )}
                            >
                              <img
                                className="aspect-auto h-12 rounded-full"
                                src={track.images[0]?.url}
                                alt=""
                              />
                            </RadioGroup.Label>
                          </div>
                          <div className="col-span-6 gap-2 self-center pl-1 text-sm md:ml-0 md:pl-0 md:text-center">
                            <div className="absolute inset-0 grid place-items-center">
                              <div>
                                <span
                                  className={classNames(
                                    checked
                                      ? "text-indigo-900"
                                      : "text-gray-900",
                                    " font-medium"
                                  )}
                                >
                                  {track.artists
                                    .map((artist) => artist.name)
                                    .join(", ")}
                                </span>
                                <span className="mx-2">-</span>
                                <span
                                  className={classNames(
                                    "",
                                    checked
                                      ? "text-indigo-700"
                                      : "text-gray-500"
                                  )}
                                >
                                  {track.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={classNames(
                              checked ? "text-indigo-700" : "text-gray-500",
                              "relative col-span-2 ml-6 self-center pl-1 text-sm text-green-500 hover:text-green-400 md:ml-0 md:pl-0 md:text-right"
                            )}
                          >
                            <a
                              target="_blank"
                              rel="noreferrer"
                              href={track.trackUrl ?? ""}
                            >
                              Check on Spotify
                            </a>
                          </div>
                        </>
                      )}
                    </RadioGroup.Option>
                  ))}
                </div>
              </RadioGroup>
            </Form>
          ) : null}
        </div>
      </div>
    </DialogModal>
  );
}
