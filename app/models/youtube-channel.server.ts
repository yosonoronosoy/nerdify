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

export function createYoutubeChannel({
  channelId,
  title,
}: Pick<YoutubeChannel, "channelId" | "title">) {
  return prisma.youtubeChannel.create({
    data: {
      title,
      channelId,
      status: "UNPROCESSED",
    },
  });
}

export function deleteyoutubeChannel({ id }: Pick<YoutubeChannel, "id">) {
  return prisma.youtubeChannel.deleteMany({
    where: { id },
  });
}
