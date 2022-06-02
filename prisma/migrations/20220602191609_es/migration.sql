/*
  Warnings:

  - A unique constraint covering the columns `[youtubeVideoId]` on the table `YoutubeVideo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `youtubeVideoId` to the `YoutubeVideo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "YoutubeVideo" ADD COLUMN     "youtubeVideoId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeVideo_youtubeVideoId_key" ON "YoutubeVideo"("youtubeVideoId");
