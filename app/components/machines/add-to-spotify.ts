import { assign, createMachine } from "xstate";

export const addToSpotifyMachine = createMachine(
  {
    context: {
      playlistsInDB: 0,
      playlistsInSpotify: 0,
      playlistFound: false,
      hasButtonSection: false,
    },
    tsTypes: {} as import("./add-to-spotify.typegen").Typegen0,
    schema: {
      context: {} as {
        playlistsInDB: number;
        playlistsInSpotify: number;
        playlistFound: boolean;
        hasButtonSection: boolean;
      },
      events: {} as
        | {
            type: "DATA_CHANGE";
            payload: { playlistsInDB: number; playlistsInSpotify: number };
          }
        | { type: "SEARCH" }
        | { type: "GRAB_ALL_PLAYLISTS" }
        | { type: "GR" }
        | { type: "GRAB_SINGLE_PLAYLIST" }
        | { type: "FAIL" }
        | { type: "RETRY_SEARCH" }
        | { type: "RETRY_GRAB" }
        | { type: "RETRY" }
        | { type: "FIND" }
        | { type: "SUCCEED" }
        | { type: "RESULT" }
        | { type: "EXIT" }
        | { type: "ERASE_TELEPORT_GO_TO_GRABBING_SINGLE_PLAYLIST_SUCCESS" },
    },
    id: "spotify",
    initial: "init",
    on: {
      DATA_CHANGE: [
        {
          actions: "updateContextWhenDataChange",
          cond: "noPlaylistsInDB",
          target: ".init.firstTimeVisiting",
        },
        {
          cond: "somePlaylistsInDB",
          target: ".init.partiallyProcessed",
        },
        {
          target: ".init.fullyProcessed",
        },
      ],
      ERASE_TELEPORT_GO_TO_GRABBING_SINGLE_PLAYLIST_SUCCESS: {
        target: "grabSinglePlaylistSuccess",
      },
    },
    states: {
      init: {
        initial: "firstTimeVisiting",
        states: {
          firstTimeVisiting: {},
          partiallyProcessed: {},
          fullyProcessed: {},
        },
        on: {
          SEARCH: {
            target: "searchingPlaylist",
          },
          GRAB_ALL_PLAYLISTS: {
            cond: "isPlaylistsLeft",
            target: "grabbingAllPlaylists",
          },
          GRAB_SINGLE_PLAYLIST: {
            target: "grabbingSinglePlaylist",
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
        on: {
          FIND: [
            {
              cond: "isPlaylistFound",
              target: "searchSuccess",
            },
            {
              target: "playlistNotFound",
            },
          ],
        },
      },
      exit: {},
      error: {},
      searchSuccess: {},
      grabSinglePlaylistSuccess: {
        entry: "turnOnButtonSection",
        exit: "turnOffButtonSection",
      },
      playlistNotFound: {
        on: {
          EXIT: {
            target: "exit",
          },
          RETRY_SEARCH: {
            target: "searchingPlaylist",
          },
          RETRY_GRAB: {
            target: "grabbingSinglePlaylist",
          },
        },
      },
      grabbingSinglePlaylist: {
        on: {
          RESULT: [
            {
              cond: "isPlaylistFound",
              target: "grabSinglePlaylistSuccess",
            },
            {
              target: "playlistNotFound",
            },
          ],
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
      somePlaylistsInDB: (context) =>
        context.playlistsInDB > 0 &&
        context.playlistsInDB < context.playlistsInSpotify,
      isPlaylistFound: (context) => context.playlistFound,
    },
    actions: {
      updateContextWhenDataChange: assign((_context, event) => {
        return event.payload;
      }),
      turnOnButtonSection: assign({ hasButtonSection: (_context) => true }),
      turnOffButtonSection: assign({ hasButtonSection: (_context) => false }),
    },
  }
);
