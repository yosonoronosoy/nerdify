-- AlterTable
ALTER TABLE "YoutubePlaylist" ADD COLUMN     "spotifyTrackId" TEXT;

-- AddForeignKey
ALTER TABLE "YoutubePlaylist" ADD CONSTRAINT "YoutubePlaylist_spotifyTrackId_fkey" FOREIGN KEY ("spotifyTrackId") REFERENCES "SpotifyTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
