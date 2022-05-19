import { prisma } from "~/db.server";
import type {
  SpotifyArtistResponse,
  SpotifyImageResponse,
} from "~/zod-schemas/spotify-track-search.server";

export type { SpotifyTrack } from "@prisma/client";

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

export async function createSpotifyTrackFromYoutubeChannel({
  trackId,
  searchQuery,
  youtubeVideoId,
  youtubeChannelId,
  images,
  trackUrl,
  artists,
  name,
}: {
  trackId?: string;
  searchQuery: string;
  name: string;
  youtubeVideoId: string;
  youtubeChannelId: string;
  images?: SpotifyImageResponse[];
  trackUrl?: string;
  artists?: SpotifyArtistResponse[];
}) {
  return prisma.spotifyTrack.create({
    data: {
      trackId,
      searchQuery,
      youtubeVideoId,
      name,
      youtubeChannel: {
        connect: [{ channelId: youtubeChannelId }],
      },
      ...(images ? { images: JSON.stringify(images) } : {}),
      ...(trackUrl ? { trackUrl } : {}),
      ...(artists ? { images: JSON.stringify(artists) } : {}),
    },
  });
}
