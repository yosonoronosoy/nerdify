import type { YoutubeChannel } from "@prisma/client";
import { prisma } from "~/db.server";

export type { YoutubeChannel } from "@prisma/client";

export function getYoutubeChannel({
  channelId,
}: Pick<YoutubeChannel, "channelId">) {
  return prisma.youtubeChannel.findFirst({
    where: { channelId },
  });
}

export async function getYoutubeChannelsByUserId({
  userId,
  sort,
}: {
  userId: string;
  sort?: "asc" | "desc";
}) {
  const channels = await prisma.youtubeChannel.findMany({
    where: {
      userId,
    },
    orderBy: {
      lastViewedAt: sort ? sort : "desc",
    },
    include: {
      _count: {
        select: {
          spotifyTracks: true,
        },
      },
    },
  });

  // console.dir(channels, {depth: Number.MAX_SAFE_INTEGER});
  return channels;
}

type CreateYoutubeChannelInput = Pick<
  YoutubeChannel,
  "channelId" | "title" | "totalVideos"
> & {
  spotifyUserId?: string;
};

export function createYoutubeChannel({
  channelId,
  title,
  spotifyUserId,
  totalVideos,
}: CreateYoutubeChannelInput) {
  return prisma.youtubeChannel.create({
    data: {
      title,
      channelId,
      status: "UNPROCESSED",
      totalVideos,
      user: { connect: { spotifyUserId } },
    },
  });
}

export async function upsertYoutubeChannel({
  channelId,
  title,
  status,
  userId,
  spotifyUserId,
  image,
  totalVideos,
}: Partial<
  Pick<
    YoutubeChannel,
    "title" | "status" | "channelId" | "lastViewedAt" | "image" | "totalVideos"
  >
> &
  (
    | { userId: string; spotifyUserId?: undefined }
    | { spotifyUserId: string; userId?: undefined }
  )) {
  const connection = userId
    ? { user: { connect: { id: userId } } }
    : {
        user: { connect: { spotifyUserId } },
      };

  return prisma.youtubeChannel.upsert({
    where: { channelId },
    update: {
      title,
      status,
      lastViewedAt: new Date(),
    },
    create: {
      title: title ?? "",
      status: "UNPROCESSED",
      image: image ?? "",
      totalVideos: totalVideos ?? 0,
      channelId: channelId ?? "",
      ...connection,
    },
  });
}

export function deleteyoutubeChannel({ id }: Pick<YoutubeChannel, "id">) {
  return prisma.youtubeChannel.deleteMany({
    where: { id },
  });
}
