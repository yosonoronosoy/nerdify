import type { ActionFunction } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import { redirect } from "@remix-run/node";
import {
  createYoutubeVideo,
  makeSpotifyTrackAvailableFromYoutubeVideo,
  makeSpotifyTrackUnavailableFromYoutubeVideo,
} from "~/models/youtube-video.server";
import {
  setSessionWithNewAccessToken,
  spotifyStrategy,
} from "~/services/auth.server";
import { searchTrack } from "~/services/spotify.server";
import leven from 'leven';

export const action: ActionFunction = async ({ request }) => {
  console.log("============ HIT ============");
  const spotifySession = await spotifyStrategy.getSession(request);

  if (!spotifySession) {
    return null;
  }

  const formData = await request.formData();
  const {
    _action,
    playlistId,
    makeAvailable,
    makeUnavailable,
    prevUrl,
    ...dataEntries
  } = Object.fromEntries(formData);
  invariant(typeof prevUrl === "string", "prevUrl must be a string");

  // TODO: maybe change this to a switch statement with intents
  if (typeof makeAvailable === "string") {
    const [channelId, youtubeVideoId, spotifyTrackId] =
      makeAvailable.split(":");
    await makeSpotifyTrackAvailableFromYoutubeVideo({
      channelId,
      youtubeVideoId,
      spotifyTrackId,
    });
    return redirect(prevUrl, { status: 302 });
  }

  if (typeof makeUnavailable === "string") {
    const [channelId, youtubeVideoId] = makeUnavailable.split(":");
    await makeSpotifyTrackUnavailableFromYoutubeVideo({
      channelId,
      youtubeVideoId,
    });
    return redirect(prevUrl, { status: 302 });
  }

  if (_action === "refreshToken") {
    return setSessionWithNewAccessToken({
      request,
      spotifySession,
      path: prevUrl,
    });
  }

  const promiseCallback = async ([inputName, searchQuery]: [
    string,
    FormDataEntryValue
  ]) => {
    const res = await searchTrack({
      request: request,
      searchQuery: searchQuery.toString(),
    });
    invariant(typeof inputName === "string", "inputName must be a string");
    const [channelId, videoId] = inputName.split(":");

    if (res.kind === "parsingError") {
      console.log("============= PARSING ERROR ======================");
      console.log(res.error);
      return null;
    }

    if (res.kind === "expiredToken") {
      // WARNING: not sure if this a good option
      // WARNING: maybe implement this as a cron job or with setInterval
      console.log("============= EXPIRED TOKEN ======================");
      return null;
    }

    if (res.kind === "noData") {
      console.log("=========== NO DATA =====================");
      console.log(res.error);
      return null;
    }

    if (res.kind === "error") {
      return createYoutubeVideo({
        title: searchQuery.toString(),
        channelId,
        youtubeVideoId: videoId,
        availability: "UNAVAILABLE",
      });
    }

    invariant(typeof playlistId === "string", "playlistId is required");
    const title = searchQuery.toString();
    return createYoutubeVideo({
      title,
      channelId,
      youtubeVideoId: videoId,
      availability: "PENDING",
      playlistId,
      spotifyTracks: res.data.map((item) => ({
        name: item.name,
        trackId: item.id,
        searchQuery: searchQuery.toString(),
        trackUrl: item.external_urls.spotify,
        artists: item.artists,
        images: item.album.images,
        levenshteinScore: leven(
          title,
          `${item.artists.map((artist) => artist.name).join(", ")} - ${
            item.name
          }`
        ),
      })),
    });
  };

  const spotifyTracks = Object.entries(dataEntries).map(promiseCallback);

  await Promise.all(spotifyTracks);

  return redirect(prevUrl, { status: 302 });
};
