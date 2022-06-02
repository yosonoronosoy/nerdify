/*
  Warnings:

  - You are about to drop the column `youtubeVideoId` on the `YoutubePlaylist` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "YoutubePlaylist" DROP CONSTRAINT "YoutubePlaylist_youtubeVideoId_fkey";

-- AlterTable
ALTER TABLE "YoutubePlaylist" DROP COLUMN "youtubeVideoId";

-- CreateTable
CREATE TABLE "_YoutubePlaylistToYoutubeVideo" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_YoutubePlaylistToYoutubeVideo_AB_unique" ON "_YoutubePlaylistToYoutubeVideo"("A", "B");

-- CreateIndex
CREATE INDEX "_YoutubePlaylistToYoutubeVideo_B_index" ON "_YoutubePlaylistToYoutubeVideo"("B");

-- AddForeignKey
ALTER TABLE "_YoutubePlaylistToYoutubeVideo" ADD FOREIGN KEY ("A") REFERENCES "YoutubePlaylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_YoutubePlaylistToYoutubeVideo" ADD FOREIGN KEY ("B") REFERENCES "YoutubeVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
