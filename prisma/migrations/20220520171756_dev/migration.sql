-- CreateTable
CREATE TABLE "YoutubePlaylistPage" (
    "id" TEXT NOT NULL,
    "pageToken" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "youtubePlaylistId" TEXT,

    CONSTRAINT "YoutubePlaylistPage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "YoutubePlaylistPage" ADD CONSTRAINT "YoutubePlaylistPage_youtubePlaylistId_fkey" FOREIGN KEY ("youtubePlaylistId") REFERENCES "YoutubePlaylist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
