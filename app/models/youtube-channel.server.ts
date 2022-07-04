import type { Status, YoutubeChannel } from "@prisma/client";
import { prisma } from "~/db.server";

export type { YoutubeChannel } from "@prisma/client";

export function getYoutubeChannel({
  channelId,
}: Pick<YoutubeChannel, "channelId">) {
  return prisma.youtubeChannel.findFirst({
    where: { channelId },
  });
}

export function getManyYoutubeChannels({
  channelIds,
}: {
  channelIds: Pick<YoutubeChannel, "channelId">[];
}) {
  return prisma.youtubeChannel.findMany({
    where: {
      OR: channelIds,
    },
  });
}

export async function getYoutubeChannelsByUserId({
  userId,
  sort,
}: {
  userId: string;
  sort?: "asc" | "desc";
}) {
  return prisma.userOnYoutubeChannel.findMany({
    where: { userId },
    include: {
      youtubeChannel: {
        select: {
          id: true,
          title: true,
          channelId: true,
          status: true,
          totalVideos: true,
          image: true,
          _count: {
            select: {
              spotifyTracks: true,
            },
          },
        },
      },
    },
    orderBy: {
      lastViewedAt: sort ? sort : "desc",
    },
  });
}

type CreateYoutubeChannelInput = Pick<
  YoutubeChannel,
  "channelId" | "title" | "totalVideos"
> & {
  userIdFromDB: string;
};

export function createYoutubeChannel({
  channelId,
  title,
  userIdFromDB,
  totalVideos,
}: CreateYoutubeChannelInput) {
  return prisma.youtubeChannel.create({
    data: {
      title,
      channelId,
      totalVideos,
      users: {
        connect: {
          userId: userIdFromDB,
        },
      },
    },
  });
}

export async function upsertYoutubeChannel({
  channelId,
  title,
  status,
  userId,
  image,
  totalVideos,
}: Partial<
  Pick<
    YoutubeChannel,
    "title" | "status" | "channelId" | "image" | "totalVideos"
  >
> & { userId: string }) {
  return prisma.youtubeChannel.upsert({
    where: { channelId },
    update: {
      title,
      status,
      users: {
        update: {
          where: {
            userId: userId,
          },
          data: {
            lastViewedAt: new Date(),
          },
        },
      },
    },
    create: {
      title: title ?? "",
      image: image ?? "",
      totalVideos: totalVideos ?? 0,
      channelId: channelId ?? "",
      users: {
        create: {
          userId,
          lastViewedAt: new Date(),
        },
      },
    },
  });
}

export function deleteyoutubeChannel({ id }: Pick<YoutubeChannel, "id">) {
  return prisma.youtubeChannel.deleteMany({
    where: { id },
  });
}
