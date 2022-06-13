import { prisma } from "~/db.server";
export type { SpotifyPlaylist } from "@prisma/client";

export function getSpotifyPlaylists({
  name,
  playlistId,
}: {
  name?: string;
  playlistId?: string;
}) {
  return prisma.spotifyPlaylist.findMany({
    where: {
      OR: [{ name: { contains: name, mode: "insensitive" } }, { playlistId }],
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
