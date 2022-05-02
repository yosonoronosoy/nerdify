/*
  Warnings:

  - A unique constraint covering the columns `[channelId]` on the table `YoutubeChannel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channelId` to the `YoutubeChannel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "YoutubeChannel" ADD COLUMN     "channelId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeChannel_channelId_key" ON "YoutubeChannel"("channelId");
