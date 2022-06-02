/*
  Warnings:

  - You are about to drop the column `spotifyTrackId` on the `YoutubePlaylist` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "YoutubePlaylist" DROP CONSTRAINT "YoutubePlaylist_spotifyTrackId_fkey";

-- AlterTable
ALTER TABLE "YoutubePlaylist" DROP COLUMN "spotifyTrackId";

-- CreateTable
CREATE TABLE "_SpotifyTrackToYoutubePlaylist" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SpotifyTrackToYoutubePlaylist_AB_unique" ON "_SpotifyTrackToYoutubePlaylist"("A", "B");

-- CreateIndex
CREATE INDEX "_SpotifyTrackToYoutubePlaylist_B_index" ON "_SpotifyTrackToYoutubePlaylist"("B");

-- AddForeignKey
ALTER TABLE "_SpotifyTrackToYoutubePlaylist" ADD FOREIGN KEY ("A") REFERENCES "SpotifyTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpotifyTrackToYoutubePlaylist" ADD FOREIGN KEY ("B") REFERENCES "YoutubePlaylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
