import type { SpotifyTrack, TrackRating, YoutubeVideo } from "@prisma/client";
import { prisma } from "~/db.server";

import type {
  SpotifyArtistResponse,
  SpotifyImageResponse,
} from "~/zod-schemas/spotify-track-search.server";
import {
  spotifyArtistsResponse,
  spotifyImagesResponse,
} from "~/zod-schemas/spotify-track-search.server";

export type { YoutubeVideo } from "@prisma/client";

function getVideo(
  video:
    | (YoutubeVideo & {
        spotifyTracks: SpotifyTrack[];
        trackRating: TrackRating[];
      })
    | null
) {
  if (!video) {
    return null;
  }

  return {
    ...video,
    spotifyTracks: video.spotifyTracks.map((track) => {
      const images = spotifyImagesResponse.safeParse(track.images);
      const artists = spotifyArtistsResponse.safeParse(track.artists);

      return {
        ...track,
        images: images.success ? images.data : [],
        artists: artists.success ? artists.data : [],
      };
    }),
  };
}

export async function getYoutubeVideoByVideoId({
  youtubeVideoId,
  userId,
}: Pick<YoutubeVideo, "youtubeVideoId"> & { userId?: string }) {
  const video = await prisma.youtubeVideo.findFirst({
    where: { youtubeVideoId },
    include: {
      spotifyTracks: true,
      trackRating: {
        where: { userId },
      },
    },
  });

  return getVideo(video);
}

export async function getYoutubeVideoByTitle({
  title,
  userId,
}: Pick<YoutubeVideo, "title"> & { userId?: string }) {
  const video = await prisma.youtubeVideo.findFirst({
    where: { title },
    include: {
      spotifyTracks: true,
      trackRating: {
        where: { userId },
      },
    },
  });

  return getVideo(video);
}

type YoutubeVideoWithoutId = Omit<YoutubeVideo, "id" | "favoriteId">;

type SpotifyTrackWithPartialId = Omit<
  SpotifyTrack,
  "id" | "youtubeVideoId" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

type SpotifyTrackInput = Omit<
  SpotifyTrackWithPartialId,
  "images" | "artists"
> & {
  images?: SpotifyImageResponse[];
  artists?: SpotifyArtistResponse[];
};

type CreateYoutubeVideoInput = {
  spotifyTracks?: SpotifyTrackInput[];
} & YoutubeVideoWithoutId;

export async function createYoutubeVideo({
  title,
  channelId,
  youtubeVideoId,
  spotifyTracks,
}: CreateYoutubeVideoInput) {
  if (spotifyTracks && spotifyTracks.length > 0) {
    const youtubeVideo = await prisma.youtubeVideo.create({
      data: {
        title,
        channelId,
        youtubeVideoId,
        availability: "PENDING",
      },
    });

    return addSpotifyTracksToYoutubeVideo({
      youtubeVideoId: youtubeVideo.youtubeVideoId,
      spotifyTracks,
    });
  }

  return prisma.youtubeVideo.create({
    data: {
      title,
      channelId,
      youtubeVideoId,
      availability: "PENDING",
    },
  });
}

export async function createManyYoutubeVideos(videos: YoutubeVideo[]) {
  return prisma.youtubeVideo.createMany({
    data: videos,
  });
}

export async function addSpotifyTracksToYoutubeVideo({
  youtubeVideoId,
  spotifyTracks,
}: {
  youtubeVideoId: string;
  spotifyTracks: SpotifyTrackInput[];
}) {
  await Promise.all(
    spotifyTracks.map((spotifyTrack) => {
      const whereClause = spotifyTrack.trackId
        ? { trackId: spotifyTrack.trackId }
        : { id: spotifyTrack.id };

      return prisma.youtubeVideo.update({
        where: { youtubeVideoId },
        data: {
          spotifyTracks: {
            connectOrCreate: {
              where: whereClause,
              create: {
                images: JSON.stringify(spotifyTrack.images),
                artists: JSON.stringify(spotifyTrack.artists),
                ...spotifyTrack,
              },
            },
          },
        },
      });
    })
  );

  return getYoutubeVideoByVideoId({ youtubeVideoId });
}

export async function makeSpotifyTrackAvailableFromYoutubeVideo({
  youtubeVideoId,
  spotifyTrackId,
}: {
  youtubeVideoId: string;
  spotifyTrackId: string;
}) {
  return prisma.youtubeVideo.update({
    where: {
      youtubeVideoId,
    },
    data: {
      spotifyTracks: {
        deleteMany: {
          NOT: { trackId: spotifyTrackId },
        },
      },
      availability: "AVAILABLE",
    },
  });
}

export function makeSpotifyTrackUnavailableFromYoutubeVideo({
  youtubeVideoId,
}: {
  youtubeVideoId: string;
}) {
  return prisma.youtubeVideo.update({
    where: { youtubeVideoId },
    data: {
      spotifyTracks: {
        deleteMany: {},
      },
      availability: "UNAVAILABLE",
    },
  });
}
