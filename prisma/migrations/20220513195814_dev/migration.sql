-- AlterTable
ALTER TABLE "SpotifyTrack" ADD COLUMN     "spotifyTrackId" TEXT;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_spotifyTrackId_fkey" FOREIGN KEY ("spotifyTrackId") REFERENCES "SpotifyTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;
