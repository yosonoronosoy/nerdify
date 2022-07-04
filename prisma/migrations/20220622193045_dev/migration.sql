-- AlterTable
ALTER TABLE "YoutubeVideo" ADD COLUMN     "youtubePlaylistPageId" TEXT;

-- AddForeignKey
ALTER TABLE "YoutubeVideo" ADD CONSTRAINT "YoutubeVideo_youtubePlaylistPageId_fkey" FOREIGN KEY ("youtubePlaylistPageId") REFERENCES "YoutubePlaylistPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
