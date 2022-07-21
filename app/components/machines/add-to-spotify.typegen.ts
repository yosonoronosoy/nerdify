// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  eventsCausingActions: {
    playlistFound: "PLAYLIST_FOUND";
    updateContextWhenDataChange: "DATA_CHANGE";
  };
  internalEvents: {
    "": { type: "" };
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
    isPlaylistsLeft: "GRAB_ALL_PLAYLISTS";
    noPlaylistsInDB: "";
    somePlaylistsInDB: "";
    isPlaylistFound: "FIND";
  };
  eventsCausingDelays: {};
  matchesStates:
    | "init"
    | "init.firstTimeVisiting"
    | "init.partiallyProcessed"
    | "init.fullyProcessed"
    | "init.enter"
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
        init?:
          | "firstTimeVisiting"
          | "partiallyProcessed"
          | "fullyProcessed"
          | "enter";
        grabbingAllPlaylists?: "start" | "error" | "success";
        searchingPlaylist?: "entering" | "filtering";
      };
  tags: never;
}
