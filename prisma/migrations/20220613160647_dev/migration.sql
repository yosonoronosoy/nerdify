-- CreateTable
CREATE TABLE "SpotifyPlaylist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "playlistId" TEXT NOT NULL,
    "image" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotifyPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyPlaylist_playlistId_key" ON "SpotifyPlaylist"("playlistId");

-- AddForeignKey
ALTER TABLE "SpotifyPlaylist" ADD CONSTRAINT "SpotifyPlaylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
