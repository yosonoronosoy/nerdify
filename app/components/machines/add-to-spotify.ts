import { createMachine } from "xstate";

async function fetchAllPlaylists() {}

export const machine = createMachine({
  initial: "init",
  states: {
    init: {
      on: {
        SEARCH: [],
        GRAB_ALL_PLAYLISTS: [],
      },
    },
    grabbingAllPlaylists: {
      // FIX: GET RID OF INVOCATIONS SINCE THIS WILL BE MANAGE BY REMIX's fetcher.load
      invoke: {
        src: fetchAllPlaylists,
        onDone: "grabbingAllPlaylists.success",
        onError: "grabbingAllPlaylists.error",
      },
    },
    "grabbingAllPlaylists.success": {
      on: {
        SEARCH: [],
      },
    },
    "grabbingAllPlaylists.error": {
      on: {
        RETRY: "grabbingAllPlaylists",
      },
    },
    searchingPlaylist: {
      initial: ".entering",
      states: {
        entering: {
          invoke: 
        },
        filtering: {},
      },
    },
    exit: {
      //
    },
    success: {
      //
    },
  },
});
