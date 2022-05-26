/*
  Warnings:

  - Added the required column `serviceTrackId` to the `TrackRating` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TrackRating" ADD COLUMN     "serviceTrackId" TEXT NOT NULL;
