-- CreateTable
CREATE TABLE "_SpotifyTrackToYoutubeChannel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SpotifyTrackToYoutubeChannel_AB_unique" ON "_SpotifyTrackToYoutubeChannel"("A", "B");

-- CreateIndex
CREATE INDEX "_SpotifyTrackToYoutubeChannel_B_index" ON "_SpotifyTrackToYoutubeChannel"("B");

-- AddForeignKey
ALTER TABLE "_SpotifyTrackToYoutubeChannel" ADD FOREIGN KEY ("A") REFERENCES "SpotifyTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpotifyTrackToYoutubeChannel" ADD FOREIGN KEY ("B") REFERENCES "YoutubeChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
