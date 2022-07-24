// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  eventsCausingActions: {
    updateContextWhenDataChange: "DATA_CHANGE";
  };
  internalEvents: {
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {
    noPlaylistsInDB: "DATA_CHANGE";
    somePlaylistsInDB: "DATA_CHANGE";
    isPlaylistsLeft: "GRAB_ALL_PLAYLISTS";
    isPlaylistFound: "FIND";
  };
  eventsCausingDelays: {};
  matchesStates:
    | "init"
    | "init.firstTimeVisiting"
    | "init.partiallyProcessed"
    | "init.fullyProcessed"
    | "grabbingAllPlaylists"
    | "grabbingAllPlaylists.start"
    | "grabbingAllPlaylists.error"
    | "grabbingAllPlaylists.success"
    | "searchingPlaylist"
    | "searchingPlaylist.entering"
    | "searchingPlaylist.filtering"
    | "exit"
    | "success"
    | "playlistNotFound"
    | {
        init?: "firstTimeVisiting" | "partiallyProcessed" | "fullyProcessed";
        grabbingAllPlaylists?: "start" | "error" | "success";
        searchingPlaylist?: "entering" | "filtering";
      };
  tags: never;
}
