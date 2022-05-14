-- DropForeignKey
ALTER TABLE "SpotifyTrack" DROP CONSTRAINT "SpotifyTrack_youtubeVideoId_fkey";

-- AlterTable
ALTER TABLE "SpotifyTrack" ALTER COLUMN "youtubeVideoId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
