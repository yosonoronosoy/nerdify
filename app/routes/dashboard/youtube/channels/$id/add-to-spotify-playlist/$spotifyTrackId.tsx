import { RadioGroup } from "@headlessui/react";
import { useFetcher, useLoaderData, useLocation } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { useEffect, useState } from "react";
import { useMachine } from "@xstate/react";
import {
  CancelButton,
  ConfirmButton,
  DefaultButtonSection,
  DialogModal,
  ModalHeader,
  ModalHeaderSubTitle,
  ModalHeaderTitle,
  useHandleClose,
} from "~/components/dialog-modal";
import type {
  OptionRowItem,
  SpotifyPlaylistLoaderData,
} from "~/routes/resources/spotify-playlists";
import { classNames } from "~/utils";
import { addToSpotifyMachine } from "~/components/machines/add-to-spotify";
import { AlertWithAccentBorder } from "~/components/alert-with-accent-border";
import { SearchBarWithButton } from "~/components/search-bar-with-button";
import { Machine } from "xstate";

const playlistIdRegex = /playlist\/([^?]+)/;

export async function loader({ request }: LoaderArgs) {
  // const userId = await getUserIdFromSession(request);
  // const playlists = await getRecentlyViewedSpotifyPlaylists({ userId });

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

const searchTabs = [
  {
    title: "By Title",
    component: (
      <SearchBarWithButton title="By Title" placeholder="Enter Title..." />
    ),
  },
  {
    title: "By URL",
    component: (
      <SearchBarWithButton title="By URL" placeholder="Enter URL..." />
    ),
  },
] as const;

export default function ConfirmTrackModal() {
  const fetcher = useFetcher<SpotifyPlaylistLoaderData>();
  const data = useLoaderData<typeof loader>();

  const [machineState, send] = useMachine(addToSpotifyMachine, {
    context: {
      playlistsInDB: data.playlistsInDB,
      playlistsInSpotify: data.playlistsInSpotify,
      playlistFound: true,
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
    send("ERASE_TELEPORT_GO_TO_GRABBING_SINGLE_PLAYLIST_SUCCESS");
  }, [send]);


  const [selectedTab, setSelectedTab] = useState<number>(0);

  return (
    <DialogModal
      prevUrl={prevUrl}
      isConfirm={isConfirm}
      formId="confirm-track-form"
      buttonSection={
        machineState.context.hasButtonSection ? (
          <DefaultButtonSection>
            <CancelButton>Cancel</CancelButton>
            <ConfirmButton success>Add</ConfirmButton>
          </DefaultButtonSection>
        ) : null
      }
      header={<Header />}
    >
      <div className="mx-auto mt-8 max-w-xl">
        {machineState.matches("init.firstTimeVisiting") && (
          <div>
            <AlertWithAccentBorder>
              You haven't checked out any playlists yet.
            </AlertWithAccentBorder>

            <div className="mt-8">
              <div className="peer flex gap-0.5">
                {searchTabs.map((tab, idx) => (
                  <button
                    type="button"
                    onClick={() => setSelectedTab(idx)}
                    onFocus={() => setSelectedTab(idx)}
                    key={idx}
                    style={{
                      boxShadow: "rgba(0, 0, 0, 0.06) 0px 2px 4px 0px inset;",
                    }}
                    className={classNames(
                      "relative rounded-t-lg px-4 py-2 text-sm focus:border-x focus:border-t focus:border-indigo-500 focus:outline-none",
                      selectedTab === idx
                        ? "bg-gray-100"
                        : "bg-gray-50 text-gray-600"
                    )}
                  >
                    {tab.title}
                    <span
                      className={classNames(
                        "absolute left-0 -bottom-1 h-2 w-full bg-gray-100",
                        selectedTab === idx ? "inline" : "hidden"
                      )}
                    />
                  </button>
                ))}
              </div>
              <div className="rounded-xl rounded-tl-none bg-gray-100 px-4 py-6 shadow-sm  peer-focus-within:border peer-focus-within:border-indigo-500">
                {searchTabs[selectedTab].component}
              </div>
            </div>
          </div>
        )}

        {machineState.matches("init.partiallyProcessed") &&
          "Please select a track to add to your Spotify playlist."}

        {machineState.matches("init.fullyProcessed") &&
          "All playlists processed"}

        {machineState.matches("searchingPlaylist") && (
          <div>Searching playlist...</div>
        )}

        {machineState.matches("grabSinglePlaylistSuccess") && (
          <div>Playlist found!</div>
        )}
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
