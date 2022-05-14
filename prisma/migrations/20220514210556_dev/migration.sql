/*
  Warnings:

  - Changed the type of `artists` on the `SpotifyTrack` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `images` on the `SpotifyTrack` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "SpotifyTrack" DROP COLUMN "artists",
ADD COLUMN     "artists" JSONB NOT NULL,
DROP COLUMN "images",
ADD COLUMN     "images" JSONB NOT NULL;
