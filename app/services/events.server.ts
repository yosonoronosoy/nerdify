import { EventEmitter } from "events";

declare global {
  var progress: number;
  var progressEvents: EventEmitter;
}

global.progress = global.progress || 10_000;
global.progressEvents = global.progressEvents || new EventEmitter();

export const events = global.progressEvents;

export function dispatchProgress(processedSoFar: number) {
  global.progress = global.progress || 10_000;
  global.progress -= global.progress - processedSoFar < 0 ? 0 : processedSoFar;
  global.progressEvents.emit("playlists-changed", progress);
}
