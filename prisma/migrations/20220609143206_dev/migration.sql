-- CreateTable
CREATE TABLE "UserOnYoutubePlaylist" (
    "userId" TEXT NOT NULL,
    "youtubePlaylistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastViewedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOnYoutubePlaylist_pkey" PRIMARY KEY ("userId","youtubePlaylistId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOnYoutubePlaylist_userId_key" ON "UserOnYoutubePlaylist"("userId");

-- AddForeignKey
ALTER TABLE "UserOnYoutubePlaylist" ADD CONSTRAINT "UserOnYoutubePlaylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnYoutubePlaylist" ADD CONSTRAINT "UserOnYoutubePlaylist_youtubePlaylistId_fkey" FOREIGN KEY ("youtubePlaylistId") REFERENCES "YoutubePlaylist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
