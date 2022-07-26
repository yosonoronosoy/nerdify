/*
  Warnings:

  - Made the column `lastViewedAt` on table `SpotifyPlaylist` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SpotifyPlaylist" ALTER COLUMN "lastViewedAt" SET NOT NULL;
