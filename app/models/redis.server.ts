import { redis } from "~/services/redis.server";
import {
  SpotifyPlaylistsSchema,
  spotifyPlaylistsSchema,
} from "~/zod-schemas/spotify-playlists-schema.server";
import type { YoutubePlaylistItems } from "~/zod-schemas/youtube-playlist-schema.server";
import { youtubePlaylistItemsSchema } from "~/zod-schemas/youtube-playlist-schema.server";

type YoutubePlaylistId = string;
type YoutubePage = number | "*";
type YoutubePageCacheKey = `youtube-page:${YoutubePlaylistId}:${YoutubePage}`;
type UserId = string;
type SpotifyOffset = number;
type SpotifyPlaylistKey = `spotify-playlists:${UserId}:${SpotifyOffset}`;

const REDIS_KEYS = {
  getYoutubePageKey: (
    playlistId: YoutubePlaylistId,
    page: YoutubePage
  ): YoutubePageCacheKey => `youtube-page:${playlistId}:${page}`,
  getSpotifyPlaylistKey: (
    userId: string,
    offset: SpotifyOffset
  ): SpotifyPlaylistKey => `spotify-playlists:${userId}:${offset}`,
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

export async function getSpotifyPlaylistsFromCache({
  userId,
  offset,
}: {
  userId: string;
  offset: number;
}) {
  const key = REDIS_KEYS.getSpotifyPlaylistKey(userId, offset);
  const cacheRes = await redis.get(key);

  if (!cacheRes) {
    return null;
  }

  return spotifyPlaylistsSchema.parse(JSON.parse(cacheRes));
}

export async function setSpotifyPlaylistsInCache({
  userId,
  offset,
  data,
}: {
  userId: string;
  offset: number;
  data: SpotifyPlaylistsSchema;
}) {
  const key = REDIS_KEYS.getSpotifyPlaylistKey(userId, offset);
  return redis.set(key, JSON.stringify(data), "EX", 60 * 60 * 2);
}
