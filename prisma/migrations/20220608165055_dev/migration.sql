/*
  Warnings:

  - You are about to drop the column `lastViewedAt` on the `YoutubeChannel` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `YoutubeChannel` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "YoutubeChannel" DROP CONSTRAINT "YoutubeChannel_userId_fkey";

-- AlterTable
ALTER TABLE "YoutubeChannel" DROP COLUMN "lastViewedAt",
DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "UserOnYoutubeChannel" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "lastViewedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "youtubeChannelId" TEXT NOT NULL,

    CONSTRAINT "UserOnYoutubeChannel_pkey" PRIMARY KEY ("userId","youtubeChannelId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOnYoutubeChannel_userId_key" ON "UserOnYoutubeChannel"("userId");

-- AddForeignKey
ALTER TABLE "UserOnYoutubeChannel" ADD CONSTRAINT "UserOnYoutubeChannel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnYoutubeChannel" ADD CONSTRAINT "UserOnYoutubeChannel_youtubeChannelId_fkey" FOREIGN KEY ("youtubeChannelId") REFERENCES "YoutubeChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
