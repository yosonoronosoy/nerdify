import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getYoutubeChannelsByUserId } from "~/models/youtube-channel.server";
import { getUserIdFromSession } from "~/services/session.server";
import { useLoaderData } from "@remix-run/react";
import type { Resource } from "~/zod-schemas/resource-schema.server";
import { resourcesSchema } from "~/zod-schemas/resource-schema.server";
import { PagePresentation } from "~/components/page-presentation";
import { getYoutubePlaylistsByUserId } from "~/models/youtube-playlist.server";

type LoaderData = {
  playlists: Resource[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userIdFromDB = await getUserIdFromSession(request);

  const recentlyViewedUsersOnPlaylists = await getYoutubePlaylistsByUserId(
    userIdFromDB
  );

  const playlists = resourcesSchema.parse(
    recentlyViewedUsersOnPlaylists.map((c) => {
      const { playlistId, trackCount, ...playlist } = c.youtubePlaylist;
      return {
        ...playlist,
        resourceId: playlistId,
        totalVideos: trackCount,
        lastViewedAt: c.lastViewedAt,
      };
    })
  );

  return json<LoaderData>({ playlists });
};

export default function ChannelsIndex() {
  const data = useLoaderData<LoaderData>();

  return (
    <PagePresentation resources={data.playlists} resourceType="playlists" />
  );
}
