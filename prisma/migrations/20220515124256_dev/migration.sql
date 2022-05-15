/*
  Warnings:

  - You are about to drop the column `availability` on the `SpotifyTrack` table. All the data in the column will be lost.
  - Added the required column `availability` to the `YoutubeVideo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotifyTrack" DROP COLUMN "availability";

-- AlterTable
ALTER TABLE "YoutubeVideo" ADD COLUMN     "availability" "Availability" NOT NULL;
