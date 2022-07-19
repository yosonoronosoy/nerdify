import { createMachine } from "xstate";

export const machine = createMachine(
  {
    tsTypes: {} as import("./add-to-spotify.typegen").Typegen0,
    schema: {
      context: {} as { playlistsInDB: number; playlistsInSpotify: number },
      events: {} as
        | {
            type: "DATA_CHANGE";
            payload: { playlistsInDB: number; playlistsInSpotify: number };
          }
        | { type: "SEARCH" }
        | { type: "GRAB_ALL_PLAYLISTS" }
        | { type: "SUCCEED" }
        | { type: "FAIL" }
        | { type: "RETRY" }
        | { type: "FIND" }
        | { type: "EXIT" },
    },
    id: "spotify",
    context: {
      playlistsInDB: 0,
      playlistsInSpotify: 0,
    },
    initial: "init",
    on: {
      DATA_CHANGE: {
        actions: "updateContextWhenDataChange",
      },
    },
    states: {
      init: {
        on: {
          SEARCH: {
            target: "searchingPlaylist",
          },
          GRAB_ALL_PLAYLISTS: {
            cond: "isPlaylistsLeft",
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
  },
  {
    guards: {
      isPlaylistsLeft: (context) =>
        context.playlistsInSpotify !== 0 ||
        context.playlistsInDB === 0 ||
        context.playlistsInSpotify > context.playlistsInDB,
    },
    actions: {
      updateContextWhenDataChange: (_context, event) => {
        return event.payload;
      },
    },
  }
);
