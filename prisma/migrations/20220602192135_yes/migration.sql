/*
  Warnings:

  - A unique constraint covering the columns `[channelId]` on the table `YoutubeVideo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channelId` to the `YoutubeVideo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "YoutubeVideo" ADD COLUMN     "channelId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeVideo_channelId_key" ON "YoutubeVideo"("channelId");
