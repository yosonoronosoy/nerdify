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
    guards: "isPlaylistFound";
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {
    isPlaylistsLeft: "GRAB_ALL_PLAYLISTS";
    isPlaylistFound: "FIND";
  };
  eventsCausingDelays: {};
  matchesStates:
    | "init"
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
        grabbingAllPlaylists?: "start" | "error" | "success";
        searchingPlaylist?: "entering" | "filtering";
      };
  tags: never;
}
