/*
  Warnings:

  - Added the required column `availability` to the `SpotifyTrack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotifyTrack" ADD COLUMN     "availability" "Availability" NOT NULL;
