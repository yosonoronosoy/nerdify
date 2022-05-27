import { prisma } from "~/db.server";

export async function getTrackRatingByYoutubeVideoId({
  userId,
  youtubeVideoIdFromAPI,
  spotifyUserId,
}:
  | {
      youtubeVideoIdFromAPI: string;
      userId: string;
      spotifyUserId?: undefined;
    }
  | {
      youtubeVideoIdFromAPI: string;
      userId?: undefined;
      spotifyUserId: string;
    }) {
  return prisma.trackRating.findFirst({
    where: {
      OR: [
        {
          userId,
          serviceTrackId: youtubeVideoIdFromAPI,
        },
        {
          user: {
            spotifyUserId: spotifyUserId,
          },
          serviceTrackId: youtubeVideoIdFromAPI,
        },
      ],
    },
  });
}

export async function createTrackRatingForYoutubeVideo({
  userId,
  serviceTrackId,
  rating,
  youtubeVideoIdFromDB,
}: {
  userId: string;
  serviceTrackId: string;
  rating: number;
  youtubeVideoIdFromDB: string;
}) {
  return prisma.youtubeVideo.update({
    where: {
      id: youtubeVideoIdFromDB,
    },
    data: {
      trackRating: {
        create: {
          userId,
          rating,
          serviceTrackId,
        },
      },
    },
  });
}

export async function upsertTrackRatingForYoutubeVideo({
  rating,
  ratingIdFromDB,
  youtubeVideoIdFromAPI,
  userIdFromDB,
  youtubeVideoIdFromDB,
}: {
  youtubeVideoIdFromAPI: string;
  rating: number | undefined;
  ratingIdFromDB: string | undefined;
  userIdFromDB: string;
  youtubeVideoIdFromDB?: string;
}) {
  return prisma.trackRating.upsert({
    where: {
      id: ratingIdFromDB,
    },
    update: {
      rating,
    },
    create: {
      rating: rating ?? 0,
      serviceTrackId: youtubeVideoIdFromAPI,
      userId: userIdFromDB,
      youtubeVideoId: youtubeVideoIdFromDB,
    },
  });
}
