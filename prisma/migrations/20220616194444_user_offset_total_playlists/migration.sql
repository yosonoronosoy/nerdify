-- AlterTable
ALTER TABLE "User" ADD COLUMN     "playlistOffset" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPlaylists" INTEGER NOT NULL DEFAULT 0;