import type { SpotifyTrack, YoutubeVideo } from "@prisma/client";
import { prisma } from "~/db.server";
import {
  SpotifyArtistResponse,
  SpotifyImageResponse,
} from "~/zod-schemas/SpotifyTrackSearch";
import { createSpotifyTrackFromYoutubeChannel } from "./spotify.server";

export type { YoutubeVideo } from "@prisma/client";

export async function getYoutubeVideoByVideoId({
  youtubeVideoId,
}: Pick<YoutubeVideo, "youtubeVideoId">) {
  return prisma.youtubeVideo.findFirst({ where: { youtubeVideoId } });
}

export async function getYoutubeVideoByTitle({
  title,
}: Pick<YoutubeVideo, "title">) {
  return prisma.youtubeVideo.findFirst({ where: { title } });
}

type YoutubeVideoWithoutId = Omit<YoutubeVideo, "id">;

type SpotifyTrackWithPartialId = Omit<SpotifyTrack, "id"> & { id?: string };

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
          availability: "PENDING",
        },
        update: {
          where: {
            trackId: spotifyTrackId,
          },
          data: {
            availability: "AVAILABLE",
          },
        },
      },
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
    },
  });
}
