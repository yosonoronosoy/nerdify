/*
  Warnings:

  - Added the required column `name` to the `SpotifyTrack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotifyTrack" ADD COLUMN     "name" TEXT NOT NULL;
