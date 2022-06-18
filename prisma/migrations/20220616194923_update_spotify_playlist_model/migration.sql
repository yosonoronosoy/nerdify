/*
  Warnings:

  - Made the column `url` on table `SpotifyPlaylist` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SpotifyPlaylist" ALTER COLUMN "url" SET NOT NULL;
