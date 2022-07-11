import { RadioGroup } from "@headlessui/react";
import {
  Form,
  useLoaderData,
  useLocation,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { useEffect, useMemo, useState } from "react";
import invariant from "tiny-invariant";
import { DialogModal } from "~/components/dialog-modal";
import { Search } from "~/components/search-input";
import { getYoutubeVideoByVideoId } from "~/models/youtube-video.server";

// FIX: LEAVE THIS AS A RESOURCE ROUTE

type LoaderData = Awaited<ReturnType<typeof getYoutubeVideoByVideoId>>;
export const loader: LoaderFunction = async ({ params }) => {
  const videoId = params.videoId;
  invariant(videoId, "videoId is required");

  const video = await getYoutubeVideoByVideoId({ youtubeVideoId: videoId });

  return json<LoaderData>(video);
};

function classNames(...args: string[]) {
  return args.filter(Boolean).join(" ");
}

type State = {
  prevUrl: string;
  resourceId: string;
  resourceType: string;
  scrollTo: number;
};
function isState(state: unknown): state is State {
  if (typeof state === "object" && state !== null) {
    return (
      "prevUrl" in state &&
      "resourceId" in state &&
      "resourceType" in state &&
      "scrollTo" in state
    );
  }

  return false;
}

export default function ConfirmTrackModal() {
  const data = useLoaderData<LoaderData>();
  const params = useParams();
  const videoId = params.videoId ?? "";

  const [selected, setSelected] = useState();
  const [filterQuery, setFilterQuery] = useState("");
  const spotifyTracks = useMemo(
    () => data?.spotifyTracks ?? [],
    [data?.spotifyTracks]
  );
  const [filteredTracks, setFilteredTracks] = useState(spotifyTracks);

  const [{ prevUrl }] = useInputMetadata();
  const isConfirm = Boolean(selected);

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

  return (
    <DialogModal
      prevUrl={prevUrl}
      isConfirm={isConfirm}
      formId="confirm-track-form"
      confirmButtonTitle={isConfirm ? "Confirm" : "Set Track as Unavailable"}
      heading="Confirm Track"
      subHeading={data?.title}
    >
      {/* FIX: not ideal to have a search input here */}
      <Search className="absolute right-0 -top-16 w-56">
        <Search.Input
          placeholder="Filter tracks"
          defaultValue={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="rounded-md"
        />
      </Search>
      <div className="mt-3 text-center sm:mt-5">
        <div className="mt-2">
          {filteredTracks.length > 0 ? (
            <Form
              reloadDocument
              method="post"
              id="confirm-track-form"
              action={`/resources/youtube/confirm-track/${videoId}`}
            >
              <InputMetadata selected={selected} />
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

function InputGroup({
  isConfirm,
  page,
  metadata,
}: {
  isConfirm: boolean | undefined;
  page: number;
  metadata?: Record<string, string | number>;
}) {
  return (
    <>
      {metadata
        ? Object.entries(metadata).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))
        : null}
      <input hidden name="page" value={`${page}`} />
      <input
        hidden
        name="_action"
        readOnly
        value={isConfirm ? "confirm" : "set-unavailable"}
      />
    </>
  );
}

function useInputMetadata() {
  const { state } = useLocation();
  const [searchParams] = useSearchParams();

  // FIX: don't like this approach, move it to session
  const prev = isState(state) ? state.prevUrl : "";
  const resourceId = isState(state) ? state.resourceId : "";
  const resourceType = isState(state) ? state.resourceType : "";
  const scrollTo = isState(state) ? state.scrollTo : "";

  const pageNumber = Number(searchParams.get("page"));
  const page = !isNaN(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  const prevUrl = `${prev}?page=${page}`;

  return [
    {
      prevUrl,
      resourceId,
      resourceType,
      scrollTo,
    },
    page,
  ] as const;
}

function InputMetadata({ selected }: { selected: boolean | undefined }) {
  const [metadata, page] = useInputMetadata();
  console.log("====== CALLED +======");
  console.log({ metadata, page });

  return <InputGroup isConfirm={selected} page={page} metadata={metadata} />;
}
