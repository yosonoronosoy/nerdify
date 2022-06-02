/*
  Warnings:

  - You are about to drop the column `channelId` on the `YoutubeVideo` table. All the data in the column will be lost.
  - You are about to drop the column `youtubeVideoId` on the `YoutubeVideo` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "YoutubeVideo_youtubeVideoId_key";

-- AlterTable
ALTER TABLE "SpotifyTrack" ADD COLUMN     "availability" "Availability" NOT NULL DEFAULT E'PENDING';

-- AlterTable
ALTER TABLE "YoutubeVideo" DROP COLUMN "channelId",
DROP COLUMN "youtubeVideoId";
