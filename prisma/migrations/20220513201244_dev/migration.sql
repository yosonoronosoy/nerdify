/*
  Warnings:

  - You are about to drop the column `availability` on the `SpotifyTrack` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[channelId]` on the table `YoutubeVideo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[youtubeVideoId]` on the table `YoutubeVideo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SpotifyTrack" DROP COLUMN "availability";

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeVideo_channelId_key" ON "YoutubeVideo"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeVideo_youtubeVideoId_key" ON "YoutubeVideo"("youtubeVideoId");
