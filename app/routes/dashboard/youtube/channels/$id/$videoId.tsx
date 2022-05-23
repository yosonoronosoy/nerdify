import { Dialog, RadioGroup, Transition } from "@headlessui/react";
import { ClockIcon } from "@heroicons/react/outline";
import { Form, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { Search } from "~/components/search-input";
import {
  getYoutubeVideoByVideoId,
  makeSpotifyTrackAvailableFromYoutubeVideo,
  makeSpotifyTrackUnavailableFromYoutubeVideo,
} from "~/models/youtube-video.server";

type LoaderData = Awaited<ReturnType<typeof getYoutubeVideoByVideoId>>;

export const loader: LoaderFunction = async ({ params }) => {
  const videoId = params.videoId;
  invariant(videoId, "videoId is required");

  const video = await getYoutubeVideoByVideoId({ youtubeVideoId: videoId });

  return json<LoaderData>(video);
};

export const action: ActionFunction = async ({ request, params }) => {
  const id = params.id;
  const youtubeVideoId = params.videoId;

  invariant(id, "id is required");
  invariant(youtubeVideoId, "videoId is required");

  const formData = await request.formData();
  const { _action, ...dataEntries } = Object.fromEntries(formData);

  if (_action === "set-unavailable") {
    await makeSpotifyTrackUnavailableFromYoutubeVideo({
      youtubeVideoId,
    });

    return redirect(`/dashboard/youtube/channels/${id}`, { status: 301 });
  }

  if (_action === "confirm") {
    const spotifyTrackId = dataEntries["_track[trackId]"]?.toString();
    invariant(spotifyTrackId, "trackId is required");

    await makeSpotifyTrackAvailableFromYoutubeVideo({
      spotifyTrackId,
      youtubeVideoId,
    });

    return redirect(`/dashboard/youtube/channels/${id}`);
  }

  return null;
};

function classNames(...args: string[]) {
  return args.filter(Boolean).join(" ");
}

export default function ConfirmTrackModal() {
  const data = useLoaderData<LoaderData>();
  const { id: channelId } = useParams();
  const navigate = useNavigate();

  const [selected, setSelected] = useState();
  console.log("selected", selected);
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

  const cancelButtonRef = useRef(null);

  const [open, setOpen] = useState(true);

  function handleClose() {
    setOpen(false);
    navigate(`/dashboard/youtube/channels/${channelId}`);
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        initialFocus={cancelButtonRef}
        onClose={handleClose}
      >
        <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 sm:align-middle">
              <div className="relative">
                <Search className="absolute right-0 top-24 w-64">
                  <Search.Input
                    placeholder="Filter tracks"
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="rounded-md"
                  />
                </Search>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                  <ClockIcon
                    className="h-6 w-6 text-yellow-600"
                    aria-hidden="true"
                  />
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
                      <Form method="post" id="confirm-track-form">
                        <input
                          hidden
                          name="_action"
                          readOnly
                          value={selected ? "confirm" : "set-unavailable"}
                        />
                        <RadioGroup
                          value={selected}
                          onChange={setSelected}
                          name="_track"
                        >
                          <RadioGroup.Label className="sr-only">
                            Found Spotify Tracks
                          </RadioGroup.Label>
                          <div className="relative -space-y-px rounded-md bg-white">
                            {filteredTracks.map((track, trackIdx) => (
                              <RadioGroup.Option
                                key={track.id}
                                value={track}
                                className={({ checked }) =>
                                  classNames(
                                    trackIdx === 0
                                      ? "rounded-tl-md rounded-tr-md"
                                      : "",
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
                                          checked
                                            ? "text-indigo-900"
                                            : "text-gray-900",
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
                                        checked
                                          ? "text-indigo-700"
                                          : "text-gray-500",
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
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  className={classNames(
                    "inline-flex w-full justify-center rounded-md border border-transparent  px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2  focus:ring-offset-2 sm:col-start-2 sm:text-sm",
                    selected
                      ? "bg-indigo-600 hover:bg-indigo-700  focus:ring-indigo-500"
                      : "bg-red-600 hover:bg-red-700  focus:ring-red-500"
                  )}
                  form="confirm-track-form"
                >
                  {selected ? "Confirm" : "Set Track as Unavailable"}
                </button>
                <button
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                  onClick={handleClose}
                  ref={cancelButtonRef}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
