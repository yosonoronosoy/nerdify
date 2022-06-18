import type { SpotifyPlaylist } from "~/models/spotify-playlist.server";
import { prisma } from "~/db.server";
export type { SpotifyPlaylist } from "@prisma/client";

export function getSpotifyPlaylists({
  name,
  playlistId,
  userId,
}: {
  userId: string;
  name?: string;
  playlistId?: string;
}) {
  return prisma.spotifyPlaylist.findMany({
    where: {
      OR: [{ name: { contains: name, mode: "insensitive" } }, { playlistId }],
      userId,
    },
    orderBy: {
      lastViewedAt: "desc",
    },
    select: {
      url: true,
      name: true,
      image: true,
      playlistId: true,
    },
  });
}

export function getSpotifyPlaylist({
  userId,
  name,
  playlistId,
}: {
  userId: string;
  name?: string;
  playlistId?: string;
}) {
  return prisma.spotifyPlaylist.findFirst({
    where: {
      OR: [{ name: { contains: name, mode: "insensitive" } }, { playlistId }],
      userId,
    },
    select: {
      url: true,
      name: true,
      image: true,
      playlistId: true,
      user: {
        select: {
          totalPlaylists: true,
          playlistOffset: true,
        },
      },
    },
  });
}

type DataInputBase = Pick<
  SpotifyPlaylist,
  "url" | "name" | "url" | "image" | "playlistId"
>;
type DataInput = DataInputBase & {
  userId: string;
};

export function createSpotifyPlaylist({
  name,
  playlistId,
  url,
  image,
  userId,
}: DataInput) {
  return prisma.spotifyPlaylist.create({
    data: {
      name,
      playlistId,
      url,
      user: {
        connect: {
          id: userId,
        },
      },
      image,
    },
  });
}

export async function upsertManySpotifyPlaylists({
  data,
}: {
  data: DataInput[];
}) {
  return prisma.$transaction(
    data.map((d) => {
      return prisma.spotifyPlaylist.upsert({
        where: {
          playlistId: d.playlistId,
        },
        update: {},
        create: d,
      });
    })
  );
}
