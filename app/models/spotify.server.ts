import type { Availability, SpotifyTrack } from "@prisma/client";
import { prisma } from "~/db.server";
import {
  SpotifyArtistResponse,
  SpotifyImageResponse,
} from "~/zod-schemas/SpotifyTrackSearch";

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
  availability = "UNAVAILABLE",
  images,
  trackUrl,
  artists,
}: {
  trackId?: string;
  searchQuery: string;
  youtubeVideoId: string;
  youtubeChannelId: string;
  availability: Availability;
  images?: SpotifyImageResponse[];
  trackUrl?: string;
  artists?: SpotifyArtistResponse[];
}) {
  return prisma.spotifyTrack.create({
    data: {
      trackId,
      searchQuery,
      availability,
      youtubeVideoId,
      youtubeChannel: {
        connect: [{ channelId: youtubeChannelId }],
      },
      ...(images ? { images: JSON.stringify(images) } : {}),
      ...(trackUrl ? { trackUrl } : {}),
      ...(artists ? { images: JSON.stringify(artists) } : {}),
    },
  });
}
