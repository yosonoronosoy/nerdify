import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getYoutubeChannelsByUserId } from "~/models/youtube-channel.server";
import { getUserIdFromSession } from "~/services/session.server";
import { useLoaderData } from "@remix-run/react";
import type { Resource } from "~/zod-schemas/resource-schema.server";
import { resourcesSchema } from "~/zod-schemas/resource-schema.server";
import { PagePresentation } from "~/components/page-presentation";

type LoaderData = {
  channels: Resource[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userIdFromDB = await getUserIdFromSession(request);

  const recentlyViewedUsersOnChannels = await getYoutubeChannelsByUserId(
    userIdFromDB
  );

  const channels = resourcesSchema.parse(
    recentlyViewedUsersOnChannels.map((c) => {
      const { channelId, ...channel } = c.youtubeChannel;
      return {
        ...channel,
        resourceId: channelId,
        lastViewedAt: c.lastViewedAt,
      };
    })
  );

  return json<LoaderData>({ channels });
};

export default function ChannelsIndex() {
  const data = useLoaderData<LoaderData>();

  return <PagePresentation resources={data.channels} resourceType="channels" />;
}
