/*
  Warnings:

  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Password` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_userId_fkey";

-- DropForeignKey
ALTER TABLE "Password" DROP CONSTRAINT "Password_userId_fkey";

-- DropTable
DROP TABLE "Note";

-- DropTable
DROP TABLE "Password";

-- CreateTable
CREATE TABLE "TrackRating" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "youtubeVideoId" TEXT,

    CONSTRAINT "TrackRating_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TrackRating" ADD CONSTRAINT "TrackRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackRating" ADD CONSTRAINT "TrackRating_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
