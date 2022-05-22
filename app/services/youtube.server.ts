import type { Status } from "@prisma/client";
import invariant from "tiny-invariant";
import {
  getCachedYoutubePlaylistPage,
  setCacheYoutubePlaylistPage,
} from "~/models/redis.server";
import { getYoutubeChannel } from "~/models/youtube-channel.server";
import {
  upsertYoutubePlaylistPage,
  getNearestYoutubePlaylistPage,
  getYoutubePlaylistPageRange,
} from "~/models/youtube-playlist-page.server";
import { getYoutubeVideoByTitle } from "~/models/youtube-video.server";
import { youtubeChannelListSchema } from "~/zod-schemas/youtube-channels-schema.server";
import type { YoutubePlaylistItems } from "~/zod-schemas/youtube-playlist-schema.server";
import { youtubePlaylistItemsSchema } from "~/zod-schemas/youtube-playlist-schema.server";
import type {
  YoutubeChannelSearchResult,
  YoutubeSearchChannelResponse,
  YoutubeSearchResponse,
} from "~/zod-schemas/youtube-search-schema.server";
import { youtubeSearchResponse } from "~/zod-schemas/youtube-search-schema.server";

const baseUrl = "https://www.googleapis.com/youtube/v3";
const channelUrl = `${baseUrl}/channels`;
const playlistUrl = `${baseUrl}/playlistItems`;
const searchUrl = `${baseUrl}/search`;

type SearchParams = Record<string, string>;

function getQuerystring(searchParams: SearchParams) {
  return new URLSearchParams({
    key: process.env.YOUTUBE_API_KEY,
    maxResults: "25",
    part: "snippet",
    ...searchParams,
  });
}

export async function queryYoutubeChannel(searchParams: SearchParams) {
  const channelQuerystring = getQuerystring(searchParams);

  const channelRawRes = await fetch(`${channelUrl}?${channelQuerystring}`).then(
    (res) => res.json()
  );

  const channelResponse = youtubeChannelListSchema.parse(channelRawRes);
  return channelResponse;
}

async function fetchYoutubePlaylistPage({
  playlistId,
  pageToken,
}: {
  playlistId: string;
  pageToken?: string;
}): Promise<YoutubePlaylistItems> {
  const querystring = getQuerystring({
    playlistId,
    maxResults: "50",
    pageToken: pageToken ?? "",
  });

  const videosRawRes = await fetch(`${playlistUrl}?${querystring}`).then(
    (res) => res.json()
  );

  return youtubePlaylistItemsSchema.parse(videosRawRes);
}

export async function queryPlaylistItems({
  playlistId,
  pageToken,
  pageNumber = 1,
}: {
  playlistId: string;
  pageToken?: string;
  pageNumber?: number;
}) {
  const playlistFromRedisCache = await getCachedYoutubePlaylistPage({
    playlistId,
    page: pageNumber,
  });

  if (playlistFromRedisCache) {
    return playlistFromRedisCache;
  }

  const videosResponse = await fetchYoutubePlaylistPage({
    playlistId,
    pageToken,
  });

  await setCacheYoutubePlaylistPage({
    playlistId,
    page: pageNumber,
    data: videosResponse,
  });

  //NOTE: this is needed because pages only store prev and next page tokens
  if (videosResponse.nextPageToken) {
    const secondPage = await fetchYoutubePlaylistPage({
      playlistId,
      pageToken: videosResponse.nextPageToken,
    });

    //NOTE: take advantage to cache page 2
    await setCacheYoutubePlaylistPage({
      playlistId,
      page: pageNumber + 1,
      data: secondPage,
    });

    invariant(
      secondPage.prevPageToken,
      "Previous Token from secondPage must be available for current page"
    );

    //NOTE: store page 1 on DB
    await upsertYoutubePlaylistPage({
      pageToken: secondPage.prevPageToken,
      pageNumber: pageNumber,
      youtubePlaylistId: playlistId,
    });

    //NOTE: store page 2 on DB
    await upsertYoutubePlaylistPage({
      pageToken: videosResponse.nextPageToken,
      pageNumber: pageNumber + 1,
      youtubePlaylistId: playlistId,
    });
  }

  return videosResponse;
}

function* range(start: number, end: number) {
  for (let i = start; i < end; i++) {
    yield i;
  }
}

export async function queryPlaylistItemFromPageRange({
  playlistId,
  from,
  to,
}: {
  playlistId: string;
  from?: number;
  to: number;
}) {
  if (from && from >= to) {
    throw new Error("<<from>> must be less than <<to>>");
  }

  const fromPage = from ?? 1;

  const pagesRangeFromDB = await getYoutubePlaylistPageRange({
    playlistId,
    from: fromPage,
    to,
  });

  if (pagesRangeFromDB.length === to - fromPage + 1) {
    const lastPage = pagesRangeFromDB.at(-1);

    return queryPlaylistItems({
      playlistId,
      pageToken: lastPage?.pageToken,
      pageNumber: lastPage?.pageNumber,
    });
  }

  const nearestPageToLast = await getNearestYoutubePlaylistPage({
    pageNumber: to,
    playlistId,
  });

  const nearestPageNumberToLast = nearestPageToLast?.pageNumber ?? fromPage;

  let pageToken = nearestPageToLast?.pageToken;

  let playlistItemsPage: YoutubePlaylistItems = await queryPlaylistItems({
    playlistId,
    pageNumber: nearestPageNumberToLast,
    pageToken,
  });

  for (const page of range(nearestPageNumberToLast + 1, to + 1)) {
    playlistItemsPage = await queryPlaylistItems({
      playlistId,
      pageNumber: page,
      pageToken,
    });

    pageToken = playlistItemsPage.nextPageToken;
  }

  return playlistItemsPage;
}

export type SearchChannelResponse = Omit<
  YoutubeSearchChannelResponse,
  "items"
> & {
  items: (YoutubeChannelSearchResult & { channelStatus: Status })[];
};

export async function searchChannel(
  searchQuery: string
): Promise<SearchChannelResponse> {
  const querystring = getQuerystring({
    q: searchQuery,
  });

  const response = await fetch(`${searchUrl}?${querystring}`).then((res) =>
    res.json()
  );

  const filterChannel = (
    item: YoutubeSearchResponse["items"][number]
  ): item is YoutubeChannelSearchResult => item.id.kind === "youtube#channel";

  const ytResponse = youtubeSearchResponse.parse(response);

  const filteredResponse = {
    ...ytResponse,
    items: ytResponse.items.filter(filterChannel),
  };

  const finalItems = await Promise.all(
    filteredResponse.items.map(async (item) => {
      const channelId = item.id.channelId;
      const channel = await getYoutubeChannel({ channelId });

      return {
        ...item,
        channelStatus: channel?.status ?? "UNPROCESSED",
      };
    })
  );

  return { ...filteredResponse, items: finalItems };
}

type SpotifyAvailability =
  | {
      kind: "UNCHECKED";
    }
  | {
      kind: "AVAILABLE";
    }
  | {
      kind: "UNAVAILABLE";
    }
  | {
      kind: "PENDING";
    };

type YoutubeResponseWithSpotifyAvailability = Omit<
  YoutubePlaylistItems,
  "items"
> & {
  items: (YoutubePlaylistItems["items"][number] & {
    spotifyAvailability: SpotifyAvailability;
  })[];
};

export type ExtendedResponse = YoutubeResponseWithSpotifyAvailability & {
  nextPageToken: string | null;
  totalItems: number;
};

export async function getPlaylistResponse({
  playlistId,
  nextPageToken,
}: {
  playlistId: string;
  nextPageToken?: string;
}) {
  // TODO: add caching with query form items:${pageNumber}:${pageToken}

  const videosResponse = await queryPlaylistItems({
    playlistId,
    pageToken: nextPageToken,
  });

  const items = await Promise.all(
    videosResponse.items.map(async (item) => {
      const track = await getYoutubeVideoByTitle({
        title: item.snippet.title,
      });

      let spotifyAvailability: SpotifyAvailability;
      if (!track) {
        spotifyAvailability = { kind: "UNCHECKED" };
      } else {
        spotifyAvailability = { kind: track.availability };
      }

      return {
        ...item,
        spotifyAvailability,
      };
    })
  );

  const extendedResponse: YoutubeResponseWithSpotifyAvailability = {
    ...videosResponse,
    items,
  };

  return {
    ...extendedResponse,
    nextPageToken: videosResponse.nextPageToken ?? "",
    totalItems: videosResponse.pageInfo.totalResults,
  };
}
