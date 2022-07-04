/*
  Warnings:

  - A unique constraint covering the columns `[pageNumber]` on the table `YoutubePlaylistPage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "YoutubePlaylistPage_pageNumber_key" ON "YoutubePlaylistPage"("pageNumber");
