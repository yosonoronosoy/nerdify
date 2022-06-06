import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import type { ExtendedResponse } from "~/services/youtube.server";
import { getPlaylistData } from "~/services/youtube.server";
import { queryYoutubeChannel } from "~/services/youtube.server";
import type { LoaderFunction } from "@remix-run/server-runtime";
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
