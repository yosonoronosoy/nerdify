import { RadioGroup } from "@headlessui/react";
import { useFetcher, useLoaderData, useLocation } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { useEffect, useState } from "react";
import { useMachine } from "@xstate/react";
import {
  DialogModal,
  ModalHeader,
  ModalHeaderSubTitle,
  ModalHeaderTitle,
  useHandleClose,
} from "~/components/dialog-modal";
import { getRecentlyViewedSpotifyPlaylists } from "~/models/spotify-playlist.server";
import { getUserIdFromSession } from "~/services/session.server";
import type {
  OptionRowItem,
  SpotifyPlaylistLoaderData,
} from "~/routes/resources/spotify-playlists";
import { classNames } from "~/utils";
import { addToSpotifyMachine } from "~/components/machines/add-to-spotify";
import { AlertWithAccentBorder } from "~/components/alert-with-accent-border";
import { SearchBarWithButton } from "~/components/search-bar-with-button";

export async function loader({ request }: LoaderArgs) {
  // const userId = await getUserIdFromSession(request);
  // const playlists = await getRecentlyViewedSpotifyPlaylists({ userId });
  //
  // if (playlists.length === 0) {
  //   return json({
  //     kind: "no-playlists",
  //     message: "You haven't checked out any playlists yet.",
  //     totalItems: 0,
  //   });
  // }

  // return json({ kind: "playlists", playlists });
  return json({ playlistsInSpotify: 0, playlistsInDB: 0 });
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
  const data = useLoaderData<typeof loader>();

  const [machineState, send] = useMachine(addToSpotifyMachine, {
    context: {
      playlistsInDB: data.playlistsInDB,
      playlistsInSpotify: data.playlistsInSpotify,
    },
  });

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

  useEffect(() => {
    send({
      type: "DATA_CHANGE",
      payload: {
        playlistsInDB: 4,
        playlistsInSpotify: 10,
      },
    });
  }, [send]);

  console.log({ context: machineState.context });
  console.log({ value: machineState.value });
  // console.log({ transitions: machineState.transitions });

  return (
    <DialogModal
      prevUrl={prevUrl}
      isConfirm={isConfirm}
      formId="confirm-track-form"
      buttonSection={null}
      header={<Header />}
    >
      <div className="mx-auto mt-8 max-w-xl">
        {machineState.matches("init.firstTimeVisiting") && (
          <div>
            <AlertWithAccentBorder>
              You haven't checked out any playlists yet.
            </AlertWithAccentBorder>
            <div className="mt-8 rounded-xl bg-gray-100 px-4 py-6">
              <SearchBarWithButton
                title="Search spotify playlist"
                placeholder="Enter playlist name..."
              />
            </div>
          </div>
        )}
        {machineState.matches("init.partiallyProcessed") &&
          "Please select a track to add to your Spotify playlist."}
        {machineState.matches("init.fullyProcessed") &&
          "Please select a track to add to your Spotify playlist."}
      </div>
    </DialogModal>
  );
}

function Header() {
  return (
    <ModalHeader>
      <CloseButton />
      <ModalHeaderTitle>Spotify Playlists</ModalHeaderTitle>
      <ModalHeaderSubTitle>
        Find the playlist you want to add the selected tracks to
      </ModalHeaderSubTitle>
    </ModalHeader>
  );
}

function CloseButton() {
  const handleClose = useHandleClose();

  return (
    <button
      type="button"
      onClick={handleClose}
      className="absolute right-0 -top-2"
    >
      <span className="text-gray-500">
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </span>
    </button>
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
