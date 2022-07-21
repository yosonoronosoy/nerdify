import type { ExtendedResponse } from "~/services/youtube.server";
import type {
  LoaderFunction,
  ActionFunction,
  LoaderArgs,
} from "@remix-run/server-runtime";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getPlaylistData } from "~/services/youtube.server";
import { queryYoutubeChannel } from "~/services/youtube.server";
import { upsertYoutubeChannel } from "~/models/youtube-channel.server";
import { getUserIdFromSession } from "~/services/session.server";
import TracksTable from "~/components/tracks-table";
import invariant from "tiny-invariant";
import { useEffect } from "react";

const getPageNumber = (searchParams: URLSearchParams) =>
  Number(searchParams.get("page") ?? "1");

export async function loader(args: LoaderArgs) {
  const { params, request } = args;
  invariant(typeof params.id === "string", "Channel id is required");

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

  /**
   * FIX:  DONT WAIT FOR 5 pages (it blocks the screen)
   * ----------------------------------------------------------------
   * Instead of waiting for the first 5 pages, retrieve the first and
   * schedule the remaining 4 as a promise that's not awaited
   * ----------------------------------------------------------------
   *
   * maybe you could call an endpoint without items data, just to map
   * pageNumbers to pageTokens (nextPageToken, prevPageToken) this way the data
   * over the wire reduces it's *bandwith*?
   */
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
    status: "PROCESSING",
  });

  const tracks = extendedResponse.items.map((track) => ({
    id: track.id,
    channelId: track.snippet.channelId,
    videoId: track.snippet.resourceId.videoId,
    title: track.snippet.title,
    thumbnailUrl: track.snippet.thumbnails.default?.url,
    trackRating: track.trackRating?.rating,
    channelTitle: track.snippet.videoOwnerChannelTitle,
    spotifyAvailability: track.spotifyAvailability.kind,
    closeMatchSpotifyTitle: track.closeMatchSpotifyTitle,
    closeMatchPercentage: track.closeMatchPercentage,
    closeMatchSpotifyTrackId: track.closeMatchSpotifyTrackId,
  }));

  return json(
    { tracks, playlistId, channelId, totalItems: extendedResponse.totalItems },
    headers
  );
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const scrollTo = formData.get("scrollTo");

  return null;
};

export default function Channel() {
  const data = useLoaderData<typeof loader>();

  const channelId = data?.channelId;
  invariant(typeof channelId === "string", "channelId is required");
  const tracks = data?.tracks ?? [];
  return (
    <TracksTable
      resource={{ resourceId: channelId, resourceType: "channel" }}
      playlistId={data?.playlistId}
      tracks={tracks}
      totalItems={data?.totalItems}
    />
  );
}
