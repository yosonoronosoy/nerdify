import { createMachine } from "xstate";

export const machine = createMachine({
  id: "spotify",
  initial: "init",
  states: {
    init: {
      on: {
        SEARCH: {
          target: "searchingPlaylist",
        },
        GRAB_ALL_PLAYLISTS: {
          target: "grabbingAllPlaylists",
        },
      },
    },
    grabbingAllPlaylists: {
      initial: "start",
      states: {
        start: {
          on: {
            SUCCEED: {
              target: "success",
            },
            FAIL: {
              target: "error",
            },
          },
        },
        error: {
          on: {
            RETRY: {
              target: "start",
            },
          },
        },
        success: {
          on: {
            SEARCH: {
              target: "#spotify.searchingPlaylist",
            },
          },
        },
      },
    },
    searchingPlaylist: {
      initial: "entering",
      states: {
        entering: {
          on: {
            SUCCEED: {
              target: "filtering",
            },
          },
        },
        filtering: {
          on: {
            FIND: [
              {
                cond: "isPlaylistFound",
                target: "#spotify.success",
              },
              {
                target: "#spotify.playlistNotFound",
              },
            ],
          },
        },
      },
    },
    exit: {},
    success: {
      type: "final",
    },
    playlistNotFound: {
      on: {
        EXIT: {
          target: "exit",
        },
        RETRY: {
          target: "searchingPlaylist",
        },
      },
    },
  },
});
