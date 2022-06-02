/*
  Warnings:

  - You are about to drop the `_SpotifyTrackToYoutubeChannel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_SpotifyTrackToYoutubeChannel" DROP CONSTRAINT "_SpotifyTrackToYoutubeChannel_A_fkey";

-- DropForeignKey
ALTER TABLE "_SpotifyTrackToYoutubeChannel" DROP CONSTRAINT "_SpotifyTrackToYoutubeChannel_B_fkey";

-- AlterTable
ALTER TABLE "SpotifyTrack" ADD COLUMN     "youtubeChannelId" TEXT;

-- AlterTable
ALTER TABLE "YoutubeVideo" ADD COLUMN     "youtubeChannelId" TEXT;

-- DropTable
DROP TABLE "_SpotifyTrackToYoutubeChannel";

-- AddForeignKey
ALTER TABLE "YoutubeVideo" ADD CONSTRAINT "YoutubeVideo_youtubeChannelId_fkey" FOREIGN KEY ("youtubeChannelId") REFERENCES "YoutubeChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_youtubeChannelId_fkey" FOREIGN KEY ("youtubeChannelId") REFERENCES "YoutubeChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
