import { prisma } from "~/db.server";

export async function getSpotifyTrackByTrackId(trackId: string) {
  const track = await prisma.spotifyTrack.findFirst({
    where: {
      trackId,
    },
  });

  return track;
}

export async function getSpotifyTrackBySearchQuery(searchQuery: string) {
  const track = await prisma.spotifyTrack.findFirst({
    where: {
      searchQuery,
    },
  });

  return track;
}
