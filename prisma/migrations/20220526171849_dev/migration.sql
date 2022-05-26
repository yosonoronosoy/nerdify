/*
  Warnings:

  - A unique constraint covering the columns `[spotifyUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `spotifyUserId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "spotifyUserId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_spotifyUserId_key" ON "User"("spotifyUserId");
