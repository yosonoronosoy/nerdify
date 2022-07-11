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

export function getParsedVideo(
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
    spotifyTracks: video.spotifyTracks.map((track, idx) => {
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
      spotifyTracks: {
        orderBy: {
          levenshteinScore: "asc",
        },
      },
      trackRating: {
        where: { userId },
      },
    },
  });

  return getParsedVideo(video);
}

export async function getYoutubeVideoByTitle({
  title,
  userId,
}: Pick<YoutubeVideo, "title"> & { userId?: string }) {
  const video = await prisma.youtubeVideo.findFirst({
    where: { title },
    include: {
      spotifyTracks: {
        orderBy: {
          levenshteinScore: "desc",
        },
      },
      trackRating: {
        where: { userId },
      },
    },
  });

  return getParsedVideo(video);
}

export async function getYoutubeVideosFromPlaylistPage({
  youtubePlaylistPageIdFromDB,
}: {
  youtubePlaylistPageIdFromDB: string;
}) {
  return prisma.youtubeVideo.findMany({
    where: {
      youtubePlaylistPageId: youtubePlaylistPageIdFromDB,
    },
  });
}

type YoutubeVideoWithoutId = Omit<
  YoutubeVideo,
  "id" | "favoriteId" | "youtubeChannelId"
>;

type SpotifyTrackWithPartialId = Omit<
  SpotifyTrack,
  "id" | "youtubeVideoId" | "createdAt" | "updatedAt"
> & {
  id?: string;
};

type SpotifyTrackInput = Omit<
  SpotifyTrackWithPartialId,
  "images" | "artists" | "availability"
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
  playlistId,
  pageNumber,
}: CreateYoutubeVideoInput & { playlistId?: string; pageNumber: number }) {
  if (spotifyTracks && spotifyTracks.length > 0) {
    const youtubeVideo = await prisma.youtubeVideo.create({
      data: {
        title,
        channelId,
        availability: "PENDING",
        youtubeVideoId,
        YoutubePlaylistPage: {
          connect: {
            pageNumber,
          },
        },
        youtubeChannel: {
          connect: {
            channelId,
          },
        },
        youtubePlaylists: {
          connect: {
            playlistId,
          },
        },
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

// export async function createManyYoutubeVideos({
//   videos,
//   youtubePlaylistPageId,
// }: {
//   videos: YoutubeVideo[];
//   youtubePlaylistPageId: string;
// }) {
//   return prisma.youtubeVideo.createMany({
//     data: videos.map((video) => ({ ...video, youtubePlaylistPageId })),
//   });
// }

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
  channelId,
}: {
  youtubeVideoId: string;
  spotifyTrackId: string;
  channelId: string;
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
        update: {
          where: { trackId: spotifyTrackId },
          data: {
            youtubeChannels: {
              connect: {
                channelId,
              },
            },
          },
        },
      },
      youtubeChannel: {
        update: {
          status: "PROCESSING",
        },
        connect: {
          channelId,
        },
      },
      availability: "AVAILABLE",
    },
  });
}

export function makeSpotifyTrackUnavailableFromYoutubeVideo({
  youtubeVideoId,
  channelId,
}: {
  youtubeVideoId: string;
  channelId: string;
}) {
  return prisma.youtubeVideo.update({
    where: { youtubeVideoId },
    data: {
      spotifyTracks: {
        deleteMany: {},
      },
      youtubeChannel: {
        update: {
          status: "PROCESSING",
        },
        connect: {
          channelId,
        },
      },
      availability: "UNAVAILABLE",
    },
  });
}
type TSpotifyTrack = Omit<
  SpotifyTrack,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "availability"
  | "youtubeVideoId"
  | "artists"
  | "images"
> & {
  artists: SpotifyArtistResponse[];
  images: SpotifyImageResponse[];
};

type V = Omit<
  YoutubeVideo,
  "id" | "favoriteId" | "youtubeChannelId" | "availability"
> & { playlistId?: string };

type VideoInput = { [K in keyof V]: NonNullable<V[K]> };

export type TVid =
  | (VideoInput & { availability: "UNAVAILABLE"; spotifyTracks?: undefined })
  | (VideoInput & {
      availability: "PENDING";
      spotifyTracks: TSpotifyTrack[];
    });

export function createManyYoutubeVideos(ytVideos: Promise<TVid | null>[]) {
  return prisma.$transaction(async (db) => {
    for await (const v of ytVideos) {
      if (!v) {
        continue;
      }
      const { youtubePlaylistPageId, playlistId, ...video } = v;

      if (video.availability === "UNAVAILABLE") {
        await db.youtubeVideo.create({
          data: {
            ...video,
            YoutubePlaylistPage: {
              connect: {
                id: youtubePlaylistPageId,
              },
            },
          },
        });
        continue;
      }

      const result = await db.youtubeVideo.create({
        data: {
          ...video,
          YoutubePlaylistPage: {
            connect: {
              id: youtubePlaylistPageId,
            },
          },
          youtubePlaylists: {
            connect: {
              playlistId,
            },
          },
          spotifyTracks: {
            createMany: {
              data: video.spotifyTracks.map((item) => {
                return {
                  ...item,
                };
              }),
            },
          },
        },
      });

      console.log({ result });
    }
  });
}
