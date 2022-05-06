/*
  Warnings:

  - Added the required column `youtubeVideoId` to the `SpotifyTrack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotifyTrack" ADD COLUMN     "youtubeVideoId" TEXT NOT NULL,
ALTER COLUMN "trackId" DROP NOT NULL;
