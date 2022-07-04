import type { YoutubePlaylistPage } from "@prisma/client";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { getParsedVideo } from "./youtube-video.server";

export async function getYoutubePlaylistPagesByPlaylistId(
  playlistId: YoutubePlaylistPage["youtubePlaylistId"]
) {
  return prisma.youtubePlaylistPage.findMany({
    where: {
      youtubePlaylistId: playlistId,
    },
  });
}

export async function getYoutubePlaylistPageByPageToken({
  pageToken,
}: {
  pageToken: YoutubePlaylistPage["pageToken"];
}) {
  return prisma.youtubePlaylistPage.findFirst({
    where: {
      pageToken,
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
  youtubePlaylistIdFromDB,
  pageNumber,
}: {
  pageNumber: number;
  youtubePlaylistIdFromDB: string;
}) {
  const [p] = await prisma.youtubePlaylistPage.findMany({
    where: {
      pageNumber: {
        lte: pageNumber,
      },
      youtubePlaylistId: youtubePlaylistIdFromDB,
    },
    orderBy: {
      pageNumber: "desc",
    },
  });

  return p;
}

export async function createYoutubePlaylistPage(
  playlistPage: Omit<YoutubePlaylistPage, "id"> & { youtubePlaylistId: string }
) {
  const { youtubePlaylistId, ...rest } = playlistPage;

  return prisma.youtubePlaylistPage.create({
    data: {
      ...rest,
      youtubePlaylist: {
        connect: {
          id: youtubePlaylistId,
        },
      },
    },
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

export async function getYoutubePageWithVideos({
  pageNumber,
  userId,
}: {
  pageNumber: number;
  userId: string;
}) {
  const page = await prisma.youtubePlaylistPage.findFirst({
    where: {
      pageNumber,
    },
    include: {
      youtubeVideos: {
        include: {
          trackRating: {
            where: {
              userId,
            },
          },
          spotifyTracks: true,
        },
      },
    },
  });

  if (!page) {
    return null;
  }

  return {
    ...page,
    youtubeVideos: page.youtubeVideos.map((v) => getParsedVideo(v)),
  };
}

export async function addOneToAllPages(
  playlistId: YoutubePlaylistPage["youtubePlaylistId"]
) {
  return prisma.youtubePlaylistPage.updateMany({
    where: {
      youtubePlaylistId: playlistId,
    },
    data: {
      pageNumber: {
        increment: 1,
      },
    },
  });
}

export async function getYoutubePlaylistPageId({
  pageNumber,
}: {
  pageNumber: number;
}) {
  const record = await prisma.youtubePlaylistPage.findUnique({
    where: {
      pageNumber,
    },
    select: { id: true },
  });

  return record ? record.id : null;
}
