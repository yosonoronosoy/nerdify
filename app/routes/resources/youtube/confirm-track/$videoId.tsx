import type { ActionFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import {
  makeSpotifyTrackAvailableFromYoutubeVideo,
  makeSpotifyTrackUnavailableFromYoutubeVideo,
} from "~/models/youtube-video.server";

export const action: ActionFunction = async ({ request, params }) => {
  const youtubeVideoId = params.videoId;

  invariant(youtubeVideoId, "videoId is required");

  const formData = await request.formData();
  const {
    _action,
    page: pageText,
    prevUrl,
    resourceId,
    resourceType,
    ...dataEntries
  } = Object.fromEntries(formData);
  const page = Number(pageText);

  invariant(typeof prevUrl === "string", "prevUrl is required");
  invariant(typeof resourceId === "string", "resourceId is required");
  invariant(typeof resourceType === "string", "resourceType is required");
  invariant(!Number.isNaN(page), "page must be a number");

  if (_action === "set-unavailable") {
    // FIX: need to generalize this: considering using resourceType
    await makeSpotifyTrackUnavailableFromYoutubeVideo({
      youtubeVideoId,
      channelId: resourceId,
    });

    return redirect(`${prevUrl}`, {
      status: 301,
    });
  }

  if (_action === "confirm") {
    const spotifyTrackId = dataEntries["_track[trackId]"]?.toString();
    invariant(spotifyTrackId, "trackId is required");

    // FIX: need to generalize this: considering using resourceType
    await makeSpotifyTrackAvailableFromYoutubeVideo({
      spotifyTrackId,
      youtubeVideoId,
      channelId: resourceId,
    });

    return redirect(`${prevUrl}`);
  }

  return null;
};
