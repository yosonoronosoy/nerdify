import { Dialog, RadioGroup } from "@headlessui/react";
import { ClockIcon } from "@heroicons/react/outline";
import {
  Form,
  useFetcher,
  useLoaderData,
  useLocation,
  useParams,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import type { LoaderArgs, LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { useEffect, useState } from "react";
import { DialogModal } from "~/components/dialog-modal";
import type { SpotifyPlaylist } from "~/models/spotify-playlist.server";
import { getRecentlyViewedSpotifyPlaylists } from "~/models/spotify-playlist.server";
import { SearchBarWithButton } from "~/components/search-bar-with-button";
import { getUserIdFromSession } from "~/services/session.server";
import {
  OptionRowItem,
  SpotifyPlaylistLoaderData,
} from "~/routes/resources/spotify-playlists";
import { classNames } from "~/utils";

// type LoaderData =
//   | {
//       kind: "no-playlists";
//       message: string;
//       totalItems: number;
//     }
//   | {
//       kind: "playlists";
//       playlists: SpotifyPlaylist[];
//     };

export async function loader({ request }: LoaderArgs) {
  const userId = await getUserIdFromSession(request);
  const playlists = await getRecentlyViewedSpotifyPlaylists({ userId });

  if (playlists.length === 0) {
    return json({
      kind: "no-playlists",
      message: "You haven't checked out any playlists yet.",
      totalItems: 0,
    });
  }

  return json({ kind: "playlists", playlists });
}

type State = { prevUrl: string; resourceId: string; resourceType: string };

function isState(state: unknown): state is State {
  if (typeof state === "object" && state !== null) {
    return (
      "prevUrl" in state && "resourceId" in state && "resourceType" in state
    );
  }

  return false;
}

export default function ConfirmTrackModal() {
  const fetcher = useFetcher<SpotifyPlaylistLoaderData>();

  const { state } = useLocation();

  const prevUrl = isState(state) ? state.prevUrl : "";
  const [selected, setSelected] = useState();

  const items =
    fetcher.data?.kind === "playlist-found"
      ? [fetcher.data.playlist]
      : fetcher.data?.kind === "playlist-not-found"
      ? fetcher.data.playlists
      : testItems;

  // const prevUrl = `${prev}?page=${page}`;
  const isConfirm = Boolean(selected);

  return (
    <DialogModal
      prevUrl={prevUrl}
      isConfirm={isConfirm}
      formId="confirm-track-form"
      confirmButtonTitle={isConfirm ? "Confirm" : "Set Track as Unavailable"}
    >
      {/* <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100"> */}
      {/*   <ClockIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" /> */}
      {/* </div> */}
      {/* <div className="mt-3 text-center sm:mt-5"> */}
      {/*   <h1 className="text-lg font-bold">progress so far {progress} </h1> */}
      {/* </div> */}
    </DialogModal>
  );
}

/**
 * description
        <Dialog.Title
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900"
        >
          Confirm Track
        </Dialog.Title>
        <div className="mx-auto mt-12 max-w-xl">
          <SearchBarWithButton
            title="Search playlists"
            placeholder="Enter playlist name or playlist id"
          />

          <div className="mt-8 space-y-2">
            <h2 className="text-left text-gray-800">
              Recently viewed playlists
            </h2>
            <button
              className="rounded-lg bg-indigo-700 px-6 py-2 text-sm text-indigo-50 hover:bg-indigo-600 active:bg-indigo-700"
              type="button"
              onClick={() => {
                console.log("clicked");
                fetcher.load("/resources/spotify-playlists");
              }}
            >
              {fetcher.state === "loading"
                ? "Loading..."
                : "Test playlist endpoint"}
            </button>
            <Form
              reloadDocument
              method="post"
              id="confirm-track-form"
              // action={`/resources/youtube/confirm-track/${videoId}`}
            >
              <OptionGroup label="Found Spotify Tracks">
                {items.map((item, trackIdx) => (
                  <OptionRow key={item.id} item={item} index={trackIdx} />
                ))}
              </OptionGroup>
            </Form>
          </div>
        </div>
 *
 */

const testItems = [
  {
    id: "1",
    name: "Playlist 1",
    image: "https://via.placeholder.com/151",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
  {
    id: "2",
    name: "Playlist 2",
    image: "https://via.placeholder.com/152",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
  {
    id: "3",
    name: "Playlist 3",
    image: "https://via.placeholder.com/153",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
  {
    id: "4",
    name: "Playlist 4",
    image: "https://via.placeholder.com/154",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
  {
    id: "5",
    name: "Playlist 5",
    image: "https://via.placeholder.com/155",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
  {
    id: "6",
    name: "Playlist 6",
    image: "https://via.placeholder.com/156",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
  {
    id: "7",
    name: "Playlist 7",
    image: "https://via.placeholder.com/157",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
  {
    id: "8",
    name: "Playlist 8",
    image: "https://via.placeholder.com/158",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
  {
    id: "9",
    name: "Playlist 9",
    image: "https://via.placeholder.com/159",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
  {
    id: "10",
    name: "Playlist 10",
    image: "https://via.placeholder.com/160",
    url: "https://open.spotify.com/playlist/6QjxjYVaQZN1GftAKmK1U3?si=EyI6IntWQTugjJ_7eV0tBQ",
  },
];

function OptionGroup({
  children,
  label,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<OptionRowItem>();

  return testItems.length > 0 ? (
    <RadioGroup value={selected} onChange={setSelected} name="_track">
      <RadioGroup.Label className="sr-only">{label}</RadioGroup.Label>
      <div className="relative h-[492px] -space-y-px overflow-y-auto rounded-md bg-white">
        {children}
      </div>
    </RadioGroup>
  ) : null;
}

function OptionRow({ item, index }: { item: OptionRowItem; index: number }) {
  return (
    <RadioGroup.Option
      key={item.id}
      value={item}
      className={({ checked }) =>
        classNames(
          index === 0 ? "rounded-tl-md rounded-tr-md" : "",
          index === testItems.length - 1 ? "rounded-bl-md rounded-br-md" : "",
          checked ? "z-10 border-indigo-200 bg-indigo-50" : "border-gray-200",
          "relative flex cursor-pointer flex-col border p-4 focus:outline-none md:grid md:grid-cols-9 md:gap-2 md:pl-4 md:pr-6"
        )
      }
    >
      {({ active, checked }) => (
        <>
          <div className="col-span-2 flex items-center text-sm">
            <span
              className={classNames(
                checked
                  ? "border-transparent bg-indigo-600"
                  : "border-gray-300 bg-white",
                active ? "ring-2 ring-indigo-500 ring-offset-2" : "",
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
                src={item.image}
                alt=""
              />
            </RadioGroup.Label>
          </div>
          <div className="gap-2 self-center pl-1 text-sm md:ml-0 md:pl-0 md:text-center">
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <span
                  className={classNames(
                    "",
                    checked ? "text-indigo-700" : "text-gray-500"
                  )}
                >
                  {item.name}
                </span>
              </div>
            </div>
          </div>
          <div
            className={classNames(
              checked ? "text-indigo-700" : "text-gray-500",
              "relative col-span-3 col-start-7 ml-6 self-center pl-1 text-sm text-green-500 hover:text-green-400 md:ml-0 md:pl-0 md:text-right"
            )}
          >
            <a target="_blank" rel="noreferrer" href={item.url ?? ""}>
              Check on Spotify
            </a>
          </div>
        </>
      )}
    </RadioGroup.Option>
  );
}
