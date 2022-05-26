import { YoutubeVideo } from "@prisma/client";
import { prisma } from "~/db.server";

export async function getTrackRatingByYoutubeVideoId({
  userId,
  youtubeVideoIdFromAPI,
}: {
  userId: string;
  youtubeVideoIdFromAPI: string;
}) {
  return prisma.trackRating.findFirst({
    where: {
      userId,
      serviceTrackId: youtubeVideoIdFromAPI,
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
