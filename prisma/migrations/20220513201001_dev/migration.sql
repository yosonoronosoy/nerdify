/*
  Warnings:

  - You are about to drop the column `spotifyTrackId` on the `SpotifyTrack` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SpotifyTrack" DROP CONSTRAINT "SpotifyTrack_spotifyTrackId_fkey";

-- AlterTable
ALTER TABLE "SpotifyTrack" DROP COLUMN "spotifyTrackId";

-- CreateTable
CREATE TABLE "YoutubeVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,

    CONSTRAINT "YoutubeVideo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
