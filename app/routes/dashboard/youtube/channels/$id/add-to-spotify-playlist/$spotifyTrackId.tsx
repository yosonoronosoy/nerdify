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
import type { LoaderFunction } from "@remix-run/server-runtime";
import { useRef, useState } from "react";
import { DialogModal } from "~/components/dialog-modal";
import { Search } from "~/components/search-input";
import { useVirtual } from "react-virtual";
import type { SpotifyPlaylist } from "~/models/spotify-playlist.server";
import { SearchBarWithButton } from "~/components/search-bar-with-button";

// FIX: LEAVE THIS AS A RESOURCE ROUTE

type LoaderData =
  | {
      kind: "no-playlists";
      message: string;
      totalItems: number;
    }
  | {
      kind: "playlists";
      playlists: SpotifyPlaylist[];
    };

const loader: LoaderFunction = async ({ request }) => {
  // get spotify playlists from DB
  // > default to last viewed
  return null;
};

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
  const fetcher = useFetcher();
  const transition = useTransition();

  const { state } = useLocation();
  const prevUrl = isState(state) ? state.prevUrl : "";
  const resourceId = isState(state) ? state.resourceId : "";
  const resourceType = isState(state) ? state.resourceType : "";

  // const [searchParams] = useSearchParams();
  // const page = searchParams.get("page") ?? "1";

  const [selected, setSelected] = useState();
  const [filterQuery, setFilterQuery] = useState("");

  // const prevUrl = `${prev}?page=${page}`;
  const isConfirm = Boolean(selected);

  // const spotifyTracks = useMemo(
  //   () => data?.spotifyTracks ?? [],
  //   [data?.spotifyTracks]
  // );
  // const [filteredTracks, setFilteredTracks] = useState(spotifyTracks);
  //
  // useEffect(() => {
  //   const filtered = spotifyTracks.filter((track) => {
  //     return (
  //       track.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
  //       track.artists.some((artist) =>
  //         artist.name.toLowerCase().includes(filterQuery.toLowerCase())
  //       )
  //     );
  //   });
  //
  //   setFilteredTracks(filtered);
  // }, [filterQuery, spotifyTracks]);

  return (
    <DialogModal
      prevUrl={prevUrl}
      isConfirm={isConfirm}
      formId="confirm-track-form"
      confirmButtonTitle={isConfirm ? "Confirm" : "Set Track as Unavailable"}
    >
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
        <div className="mx-auto mt-12 max-w-md">
          <SearchBarWithButton
            title="Search playlists"
            placeholder="Enter playlist name or playlist id"
          />
          {/* {filteredTracks.length > 0 ? ( */}
          {/*   <Form */}
          {/*     reloadDocument */}
          {/*     method="post" */}
          {/*     id="confirm-track-form" */}
          {/*     action={`/resources/youtube/confirm-track/${videoId}`} */}
          {/*   > */}
          {/*     <input name="prevUrl" type="hidden" value={prevUrl} /> */}
          {/*     <input name="resourceId" type="hidden" value={resourceId} /> */}
          {/*     <input name="resourceType" type="hidden" value={resourceType} /> */}
          {/*     <input */}
          {/*       hidden */}
          {/*       name="_action" */}
          {/*       readOnly */}
          {/*       value={selected ? "confirm" : "set-unavailable"} */}
          {/*     /> */}
          {/*     <input */}
          {/*       hidden */}
          {/*       name="page" */}
          {/*       value={searchParams.get("page") ?? "1"} */}
          {/*     /> */}
          {/*     <RadioGroup value={selected} onChange={setSelected} name="_track"> */}
          {/*       <RadioGroup.Label className="sr-only"> */}
          {/*         Found Spotify Tracks */}
          {/*       </RadioGroup.Label> */}
          {/*       <div className="relative h-[450px] -space-y-px overflow-y-auto rounded-md bg-white"> */}
          {/*         {filteredTracks.map((track, trackIdx) => ( */}
          {/*           <RadioGroup.Option */}
          {/*             key={track.id} */}
          {/*             value={track} */}
          {/*             className={({ checked }) => */}
          {/*               classNames( */}
          {/*                 trackIdx === 0 ? "rounded-tl-md rounded-tr-md" : "", */}
          {/*                 trackIdx === spotifyTracks.length - 1 */}
          {/*                   ? "rounded-bl-md rounded-br-md" */}
          {/*                   : "", */}
          {/*                 checked */}
          {/*                   ? "z-10 border-indigo-200 bg-indigo-50" */}
          {/*                   : "border-gray-200", */}
          {/*                 "relative flex cursor-pointer flex-col border p-4 focus:outline-none md:grid md:grid-cols-9 md:gap-2 md:pl-4 md:pr-6" */}
          {/*               ) */}
          {/*             } */}
          {/*           > */}
          {/*             {({ active, checked }) => ( */}
          {/*               <> */}
          {/*                 <div className="col-span-1 flex items-center text-sm"> */}
          {/*                   <span */}
          {/*                     className={classNames( */}
          {/*                       checked */}
          {/*                         ? "border-transparent bg-indigo-600" */}
          {/*                         : "border-gray-300 bg-white", */}
          {/*                       active */}
          {/*                         ? "ring-2 ring-indigo-500 ring-offset-2" */}
          {/*                         : "", */}
          {/*                       "flex h-4 w-4 items-center justify-center rounded-full border" */}
          {/*                     )} */}
          {/*                     aria-hidden="true" */}
          {/*                   > */}
          {/*                     <span className="h-1.5 w-1.5 rounded-full bg-white" /> */}
          {/*                   </span> */}
          {/*                   <RadioGroup.Label */}
          {/*                     as="span" */}
          {/*                     className={classNames( */}
          {/*                       checked ? "text-indigo-900" : "text-gray-900", */}
          {/*                       "ml-3 font-medium" */}
          {/*                     )} */}
          {/*                   > */}
          {/*                     <img */}
          {/*                       className="aspect-auto h-12 rounded-full" */}
          {/*                       src={track.images[0]?.url} */}
          {/*                       alt="" */}
          {/*                     /> */}
          {/*                   </RadioGroup.Label> */}
          {/*                 </div> */}
          {/*                 <div className="col-span-6 gap-2 self-center pl-1 text-sm md:ml-0 md:pl-0 md:text-center"> */}
          {/*                   <div className="absolute inset-0 grid place-items-center"> */}
          {/*                     <div> */}
          {/*                       <span */}
          {/*                         className={classNames( */}
          {/*                           checked */}
          {/*                             ? "text-indigo-900" */}
          {/*                             : "text-gray-900", */}
          {/*                           " font-medium" */}
          {/*                         )} */}
          {/*                       > */}
          {/*                         {track.artists */}
          {/*                           .map((artist) => artist.name) */}
          {/*                           .join(", ")} */}
          {/*                       </span> */}
          {/*                       <span className="mx-2">-</span> */}
          {/*                       <span */}
          {/*                         className={classNames( */}
          {/*                           "", */}
          {/*                           checked */}
          {/*                             ? "text-indigo-700" */}
          {/*                             : "text-gray-500" */}
          {/*                         )} */}
          {/*                       > */}
          {/*                         {track.name} */}
          {/*                       </span> */}
          {/*                     </div> */}
          {/*                   </div> */}
          {/*                 </div> */}
          {/*                 <div */}
          {/*                   className={classNames( */}
          {/*                     checked ? "text-indigo-700" : "text-gray-500", */}
          {/*                     "relative col-span-2 ml-6 self-center pl-1 text-sm text-green-500 hover:text-green-400 md:ml-0 md:pl-0 md:text-right" */}
          {/*                   )} */}
          {/*                 > */}
          {/*                   <a */}
          {/*                     target="_blank" */}
          {/*                     rel="noreferrer" */}
          {/*                     href={track.trackUrl ?? ""} */}
          {/*                   > */}
          {/*                     Check on Spotify */}
          {/*                   </a> */}
          {/*                 </div> */}
          {/*               </> */}
          {/*             )} */}
          {/*           </RadioGroup.Option> */}
          {/*         ))} */}
          {/*       </div> */}
          {/*     </RadioGroup> */}
          {/*   </Form> */}
          {/* ) : null} */}
        </div>
      </div>
    </DialogModal>
  );
}
