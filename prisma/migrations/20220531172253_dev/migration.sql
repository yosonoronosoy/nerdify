-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PROCESSED', 'PROCESSING', 'OUTDATED', 'UNPROCESSED');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'PENDING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubePlaylist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "trackCount" INTEGER NOT NULL,
    "status" "Status" NOT NULL,

    CONSTRAINT "YoutubePlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubePlaylistPage" (
    "id" TEXT NOT NULL,
    "pageToken" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "youtubePlaylistId" TEXT,

    CONSTRAINT "YoutubePlaylistPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeChannel" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastViewedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "image" TEXT,
    "totalVideos" INTEGER NOT NULL,

    CONSTRAINT "YoutubeChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackRating" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "youtubeVideoId" TEXT,
    "serviceTrackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YoutubeVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "availability" "Availability" NOT NULL,
    "favoriteId" TEXT,

    CONSTRAINT "YoutubeVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotifyTrack" (
    "id" TEXT NOT NULL,
    "trackId" TEXT,
    "searchQuery" TEXT NOT NULL,
    "youtubeVideoId" TEXT,
    "images" JSONB,
    "artists" JSONB,
    "name" TEXT NOT NULL,
    "trackUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotifyTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SpotifyTrackToYoutubeChannel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_spotifyUserId_key" ON "User"("spotifyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_key" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubePlaylist_playlistId_key" ON "YoutubePlaylist"("playlistId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubePlaylistPage_pageToken_key" ON "YoutubePlaylistPage"("pageToken");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeChannel_channelId_key" ON "YoutubeChannel"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "YoutubeVideo_youtubeVideoId_key" ON "YoutubeVideo"("youtubeVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyTrack_trackId_key" ON "SpotifyTrack"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "_SpotifyTrackToYoutubeChannel_AB_unique" ON "_SpotifyTrackToYoutubeChannel"("A", "B");

-- CreateIndex
CREATE INDEX "_SpotifyTrackToYoutubeChannel_B_index" ON "_SpotifyTrackToYoutubeChannel"("B");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubePlaylistPage" ADD CONSTRAINT "YoutubePlaylistPage_youtubePlaylistId_fkey" FOREIGN KEY ("youtubePlaylistId") REFERENCES "YoutubePlaylist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeChannel" ADD CONSTRAINT "YoutubeChannel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackRating" ADD CONSTRAINT "TrackRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackRating" ADD CONSTRAINT "TrackRating_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YoutubeVideo" ADD CONSTRAINT "YoutubeVideo_favoriteId_fkey" FOREIGN KEY ("favoriteId") REFERENCES "Favorite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_youtubeVideoId_fkey" FOREIGN KEY ("youtubeVideoId") REFERENCES "YoutubeVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpotifyTrackToYoutubeChannel" ADD FOREIGN KEY ("A") REFERENCES "SpotifyTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpotifyTrackToYoutubeChannel" ADD FOREIGN KEY ("B") REFERENCES "YoutubeChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
