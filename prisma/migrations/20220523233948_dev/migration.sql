/*
  Warnings:

  - A unique constraint covering the columns `[playlistId]` on the table `YoutubePlaylist` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "YoutubePlaylist_playlistId_key" ON "YoutubePlaylist"("playlistId");
