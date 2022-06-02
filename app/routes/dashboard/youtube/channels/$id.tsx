import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import {
  setSessionWithNewAccessToken,
  spotifyStrategy,
} from "~/services/auth.server";
import { searchTrack } from "~/services/spotify.server";
import type { ExtendedResponse } from "~/services/youtube.server";
import { getPlaylistData } from "~/services/youtube.server";
import { queryYoutubeChannel } from "~/services/youtube.server";

import { createYoutubeVideo } from "~/models/youtube-video.server";
import type { YoutubeVideo } from "~/models/youtube-video.server";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { upsertYoutubeChannel } from "~/models/youtube-channel.server";
import { getUserIdFromSession } from "~/services/session.server";
import TracksTable from "~/components/tracks-table";
import invariant from "tiny-invariant";

type LoaderData = (ExtendedResponse & { channelId: string }) | null;

const getPageNumber = (searchParams: URLSearchParams) =>
  Number(searchParams.get("page") ?? "1");

export const loader: LoaderFunction = async ({ params, request }) => {
  if (!params.id) {
    return null;
  }

  const pageNumber = getPageNumber(new URL(request.url).searchParams);

  const channelResponse = await queryYoutubeChannel({
    id: params.id,
    part: "contentDetails,snippet",
  });

  const channelId = channelResponse.items[0].id;
  const imageUrl = channelResponse.items[0].snippet.thumbnails.default?.url;

  const playlistId =
    channelResponse.items[0].contentDetails.relatedPlaylists.uploads;

  const userId = await getUserIdFromSession(request);
  const { headers, extendedResponse } = await getPlaylistData({
    title: `${channelResponse.items[0].snippet.title} - Uploads`,
    request,
    pageNumber,
    playlistId,
    resourceId: params.id,
    serviceKey: "youtube-channel",
    userIdFromDB: userId,
  });

  await upsertYoutubeChannel({
    title: channelResponse.items[0].snippet.title,
    channelId,
    userId,
    image: imageUrl,
    totalVideos: extendedResponse.pageInfo.totalResults,
  });

  return json<LoaderData>(
    { ...extendedResponse, playlistId, channelId },
    headers
  );
};

export const action: ActionFunction = async ({ request, params }) => {
  const spotifySession = await spotifyStrategy.getSession(request);

  const channelId = params.id;

  if (!channelId) {
    return null;
  }

  if (!spotifySession) {
    return null;
  }

  const formData = await request.formData();
  const { _action, playlistId, ...dataEntries } = Object.fromEntries(formData);

  if (_action === "refreshToken") {
    return setSessionWithNewAccessToken({ request, spotifySession });
  }

  const promiseCallback = async ([videoId, searchQuery]: [
    string,
    FormDataEntryValue
  ]) => {
    const res = await searchTrack({
      request: request,
      searchQuery: searchQuery.toString(),
    });

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
    return createYoutubeVideo({
      title: searchQuery.toString(),
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
      })),
    });
  };

  const spotifyTracks = Object.entries(dataEntries).map(promiseCallback);

  const res = await Promise.all(spotifyTracks);

  function filterNull(item: YoutubeVideo | null): item is YoutubeVideo {
    return item !== null;
  }

  return json<YoutubeVideo[]>(res.filter(filterNull));
};

export default function Channel() {
  const data = useLoaderData<LoaderData>();
  const channelId = data?.channelId;
  invariant(typeof channelId === "string", "channelId is required");
  const tracks = data?.items ?? [];
  return (
    <TracksTable
      resource={{ resourceId: channelId, resourceType: "channel" }}
      playlistId={data?.playlistId}
      tracks={tracks}
      totalItems={data?.totalItems}
    />
  );
}
