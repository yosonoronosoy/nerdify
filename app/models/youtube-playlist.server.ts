import type { YoutubePlaylist } from "@prisma/client";
import { prisma } from "~/db.server";

export function getYoutubePlaylistByPlaylistId(playlistId: string) {
  return prisma.youtubePlaylist.findFirst({
    where: { playlistId },
  });
}

export function getYoutubePlaylistByTitle(title: `${string} - Uploads`) {
  return prisma.youtubePlaylist.findFirst({
    where: { title },
  });
}

export function createYoutubePlaylist(
  playlist: Omit<YoutubePlaylist, "id" | "status" | "title"> & {
    title: string;
  }
) {
  return prisma.youtubePlaylist.create({
    data: {
      ...playlist,
      status: "UNPROCESSED",
    },
  });
}

export async function connectSingleYoutubePageToPlaylist({
  playlistIdFromDB,
  pageId,
}: {
  playlistIdFromDB: string;
  pageId: string;
}) {
  return prisma.youtubePlaylist.update({
    where: { id: playlistIdFromDB },
    data: {
      pages: {
        connect: { id: pageId },
      },
    },
  });
}

export async function connectYoutubePagesToPlaylist({
  playlistIdFromDB,
  pageIds,
}: {
  playlistIdFromDB: string;
  pageIds: string[];
}) {
  try {
    await Promise.all(
      pageIds.map((pageId) => {
        return connectSingleYoutubePageToPlaylist({ pageId, playlistIdFromDB });
      })
    );
  } catch (e) {
    console.error(e);
    return null;
  }

  return getYoutubePlaylistByPlaylistId(playlistIdFromDB);
}

export function updateYoutubePlaylist({
  id,
  playlist,
}: {
  id?: string;
  playlist: Omit<YoutubePlaylist, "id">;
}) {
  const whereClause = id ? { id } : { playlistId: playlist.playlistId };

  return prisma.youtubePlaylist.update({
    where: whereClause,
    data: playlist,
  });
}

type UpdateYoutubePlaylistBaseInput =
  | {
      id?: undefined;
      playlistId: string;
    }
  | {
      id: string;
      playlistId?: undefined;
    };

export function updateYoutubePlaylistCount({
  id,
  trackCount,
  playlistId,
}: UpdateYoutubePlaylistBaseInput & { trackCount: number }) {
  const whereClause = id ? { id } : { playlistId };

  return prisma.youtubePlaylist.update({
    where: whereClause,
    data: {
      trackCount,
    },
  });
}

export function updateYoutubePlaylistStatus({
  id,
  status,
  playlistId,
}: UpdateYoutubePlaylistBaseInput & { status: YoutubePlaylist["status"] }) {
  const whereClause = id ? { id } : { playlistId };

  return prisma.youtubePlaylist.update({
    where: whereClause,
    data: {
      status,
    },
  });
}
