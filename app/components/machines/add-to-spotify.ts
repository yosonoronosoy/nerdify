import { createMachine } from "xstate";

export const addToSpotifyMachine = createMachine(
  {
    context: {
      playlistsInDB: 0,
      playlistsInSpotify: 0,
      isPlaylistFound: false,
    },
    tsTypes: {} as import("./add-to-spotify.typegen").Typegen0,
    schema: {
      context: {} as {
        playlistsInDB: number;
        playlistsInSpotify: number;
        isPlaylistFound: boolean;
      },
      events: {} as
        | {
            type: "DATA_CHANGE";
            payload: { playlistsInDB: number; playlistsInSpotify: number };
          }
        | { type: "PLAYLIST_FOUND" }
        | { type: "SEARCH" }
        | { type: "GRAB_ALL_PLAYLISTS" }
        | { type: "SUCCEED" }
        | { type: "FAIL" }
        | { type: "RETRY" }
        | { type: "FIND" }
        | { type: "EXIT" },
    },
    id: "spotify",
    initial: "init",
    on: {
      PLAYLIST_FOUND: {
        actions: "playlistFound",
      },
      DATA_CHANGE: {
        actions: "updateContextWhenDataChange",
      },
    },
    states: {
      init: {
        initial: "enter",
        states: {
          firstTimeVisiting: {},
          partiallyProcessed: {},
          fullyProcessed: {},
          enter: {
            always: [
              {
                cond: "noPlaylistsInDB",
                target: "#spotify.init.firstTimeVisiting",
              },
              {
                cond: "somePlaylistsInDB",
                target: "#spotify.init.partiallyProcessed",
              },
              {
                target: "#spotify.init.fullyProcessed",
              },
            ],
          },
        },

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
      noPlaylistsInDB: (context) => context.playlistsInDB === 0,
      isPlaylistFound: (context) => context.isPlaylistFound,
      somePlaylistsInDB: (context) =>
        context.playlistsInDB > 0 &&
        context.playlistsInDB < context.playlistsInSpotify,
    },
    actions: {
      updateContextWhenDataChange: (context, event) => {
        return {
          ...context,
          ...event.payload,
        };
      },
      playlistFound: (context) => {
        return {
          ...context,
          playlistFound: true,
        };
      },
    },
  }
);
