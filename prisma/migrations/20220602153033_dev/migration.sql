-- AlterTable
ALTER TABLE "YoutubePlaylist" ADD COLUMN     "youtubeVideoId" TEXT;

-- AddForeignKey
ALTER TABLE "YoutubePlaylist" ADD CONSTRAINT "YoutubePlaylist_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
