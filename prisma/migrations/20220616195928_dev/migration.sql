/*
  Warnings:

  - Made the column `userId` on table `SpotifyPlaylist` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SpotifyPlaylist" DROP CONSTRAINT "SpotifyPlaylist_userId_fkey";

-- AlterTable
ALTER TABLE "SpotifyPlaylist" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SpotifyPlaylist" ADD CONSTRAINT "SpotifyPlaylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
