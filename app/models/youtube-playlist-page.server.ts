import type { YoutubePlaylistPage } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getYoutubePlaylistPagesByPlaylistId(
  playlistId: YoutubePlaylistPage["youtubePlaylistId"]
) {
  return prisma.youtubePlaylistPage.findMany({
    where: {
      youtubePlaylistId: playlistId,
    },
  });
}

export async function getYoutubePlaylistPage({
  pageNumber,
}: {
  pageNumber: number;
}) {
  return prisma.youtubePlaylistPage.findFirst({
    where: {
      pageNumber,
    },
  });
}

export async function getYoutubePlaylistPageRange({
  playlistId,
  from,
  to,
}: {
  playlistId: string;
  from: number;
  to: number;
}) {
  return prisma.youtubePlaylistPage.findMany({
    where: {
      youtubePlaylistId: playlistId,
      pageNumber: {
        gte: from,
        lte: to,
      },
    },
    orderBy: {
      pageNumber: "asc",
    },
  });
}

export async function getLastYoutubePlaylistPage() {
  return prisma.youtubePlaylistPage.findFirst({
    orderBy: {
      pageNumber: "desc",
    },
  });
}

export async function getNearestYoutubePlaylistPage({
  playlistId,
  pageNumber,
}: {
  pageNumber: number;
  playlistId: string;
}) {
  return prisma.youtubePlaylistPage.findFirst({
    where: {
      pageNumber: {
        lte: pageNumber,
      },
      youtubePlaylistId: playlistId,
    },
    orderBy: {
      pageNumber: "desc",
    },
  });
}

export async function upsertYoutubePlaylistPage(
  playlistPage: Omit<YoutubePlaylistPage, "id">
) {
  return prisma.youtubePlaylistPage.upsert({
    where: {
      pageToken: playlistPage.pageToken,
    },
    update: {},
    create: playlistPage,
  });
}

export async function createManyYoutubePlaylistPages({
  pages,
}: {
  pages: Omit<YoutubePlaylistPage, "id">[];
}) {
  return prisma.youtubePlaylistPage.createMany({
    data: pages,
  });
}
