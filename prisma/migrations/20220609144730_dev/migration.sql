-- AlterTable
ALTER TABLE "YoutubePlaylist" ADD COLUMN     "image" TEXT,
ADD COLUMN     "totalVideos" INTEGER NOT NULL DEFAULT 0;
