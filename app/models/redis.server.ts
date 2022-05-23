import { redis } from "~/services/redis.server";
import type { YoutubePlaylistItems } from "~/zod-schemas/youtube-playlist-schema.server";
import { youtubePlaylistItemsSchema } from "~/zod-schemas/youtube-playlist-schema.server";

type YoutubePlaylistId = string;
type YoutubePage = number | "*";
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

export async function deleteCacheYoutubePlaylistPage({
  playlistId,
  page,
}: {
  playlistId: string;
  page: number;
}) {
  const key = REDIS_KEYS.getYoutubePageKey(playlistId, page);
  return redis.del(key);
}

export async function deleteManyCacheYoutubePlaylistPage({
  playlistId,
}: {
  playlistId: string;
}) {
  const key = REDIS_KEYS.getYoutubePageKey(playlistId, "*");
  const keys = await redis.keys(key);
  return redis.del(keys);
}

export async function addOneToManyCacheYoutubePlaylistPages({
  playlistId,
}: {
  playlistId: string;
}) {
  const key = REDIS_KEYS.getYoutubePageKey(playlistId, "*");
  const allKeys = await redis.keys(key);
  return Promise.all(
    allKeys.map((key) => {
      const getPage = Number(key.split(":").at(-1));
      return redis.rename(
        key,
        REDIS_KEYS.getYoutubePageKey(playlistId, getPage + 1)
      );
    })
  );
}
