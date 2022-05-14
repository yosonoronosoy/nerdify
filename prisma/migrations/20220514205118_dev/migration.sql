-- AlterTable
ALTER TABLE "SpotifyTrack" ADD COLUMN     "artists" JSONB[],
ADD COLUMN     "images" JSONB[],
ADD COLUMN     "trackUrl" TEXT;
