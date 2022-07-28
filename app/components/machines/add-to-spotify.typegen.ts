// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  eventsCausingActions: {
    updateContextWhenDataChange: "DATA_CHANGE";
    turnOffButtonSection: "xstate.init";
    turnOnButtonSection:
      | "ERASE_TELEPORT_GO_TO_GRABBING_SINGLE_PLAYLIST_SUCCESS"
      | "RESULT";
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
    isPlaylistFound: "FIND" | "RESULT";
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
    | "exit"
    | "error"
    | "searchSuccess"
    | "grabSinglePlaylistSuccess"
    | "playlistNotFound"
    | "grabbingSinglePlaylist"
    | {
        init?: "firstTimeVisiting" | "partiallyProcessed" | "fullyProcessed";
        grabbingAllPlaylists?: "start" | "error" | "success";
      };
  tags: never;
}
