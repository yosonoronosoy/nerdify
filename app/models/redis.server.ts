import { redis } from "~/services/redis.server";
import {
  YoutubePlaylistItems,
  youtubePlaylistItemsSchema,
} from "~/zod-schemas/youtube-playlist-schema.server";

type YoutubePlaylistId = string;
type YoutubePage = number;
type YoutubePageCacheKey = `youtube-page:${YoutubePlaylistId}:${YoutubePage}`;

const REDIS_KEYS = {
  getYoutubePageKey: (
    playlistId: YoutubePlaylistId,
    page: YoutubePage
  ): YoutubePageCacheKey => `youtube-page:${playlistId}:${page}`,
};

export async function getCachedYoutubePlaylistPage({
  playlistId,
  page,
}: {
  playlistId: string;
  page: number;
}) {
  const key = REDIS_KEYS.getYoutubePageKey(playlistId, page);
  const cacheRes = await redis.get(key);

  if (!cacheRes) {
    return null;
  }

  return youtubePlaylistItemsSchema.parse(JSON.parse(cacheRes));
}

export async function setCacheYoutubePlaylistPage({
  playlistId,
  page,
  data,
}: {
  playlistId: string;
  page: number;
  data: YoutubePlaylistItems;
}) {
  const key = REDIS_KEYS.getYoutubePageKey(playlistId, page);
  return redis.set(key, JSON.stringify(data), "EX", 60 * 60 * 24);
}
