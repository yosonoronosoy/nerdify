/*
  Warnings:

  - A unique constraint covering the columns `[pageToken]` on the table `YoutubePlaylistPage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "YoutubePlaylistPage_pageToken_key" ON "YoutubePlaylistPage"("pageToken");
