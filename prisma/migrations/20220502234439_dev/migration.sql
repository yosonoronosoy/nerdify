-- CreateTable
CREATE TABLE "SpotifyTrack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,

    CONSTRAINT "SpotifyTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyTrack_trackId_key" ON "SpotifyTrack"("trackId");
