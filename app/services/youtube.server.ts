import type { Status } from "@prisma/client";
import {
  addOneToManyCacheYoutubePlaylistPages,
  getCachedYoutubePlaylistPage,
  setCacheYoutubePlaylistPage,
} from "~/models/redis.server";
import { getYoutubeChannel } from "~/models/youtube-channel.server";
import {
  createYoutubePlaylistPage,
  getNearestYoutubePlaylistPage,
  addOneToAllPages,
  getYoutubePlaylistPageByPageToken,
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
  youtubePlaylistIdFromDB,
  pageToken,
  page,
}: {
  playlistId: string;
  page: number;
  pageToken?: string;
  youtubePlaylistIdFromDB: string;
}): Promise<YoutubePlaylistItems> {
  const cachedResponse = await getCachedYoutubePlaylistPage({
    page,
    playlistId,
  });
  if (cachedResponse) {
    return cachedResponse;
  }

  const querystring = getQuerystring({
    playlistId,
    maxResults: "50",
    pageToken: pageToken ?? "",
  });

  const videosRawRes = await fetch(`${playlistUrl}?${querystring}`).then(
    (res) => res.json()
  );
  const res = youtubePlaylistItemsSchema.parse(videosRawRes);

  if (page === 2) {
    if (res.prevPageToken) {
      const firstPageInDB = await getYoutubePlaylistPageByPageToken({
        pageToken: res.prevPageToken,
      });

      if (!firstPageInDB) {
        await createYoutubePlaylistPage({
          pageToken: res.prevPageToken,
          pageNumber: 1,
          youtubePlaylistId: youtubePlaylistIdFromDB,
        });
      }
    }
  }

  if (res.nextPageToken) {
    const nextPageInDB = await getYoutubePlaylistPageByPageToken({
      pageToken: res.nextPageToken,
    });

    if (!nextPageInDB) {
      await createYoutubePlaylistPage({
        pageToken: res.nextPageToken,
        pageNumber: page + 1,
        youtubePlaylistId: youtubePlaylistIdFromDB,
      });
    }
  }

  await setCacheYoutubePlaylistPage({
    playlistId,
    page,
    data: res,
  });

  return res;
}

function* range({
  start,
  end,
  step = 1,
}: {
  start: number;
  end: number;
  step?: number;
}) {
  for (let i = start; i < end; i += step) {
    yield i;
  }
}

export async function queryPlaylistItemFromPageRange({
  playlistId,
  youtubePlaylistIdFromDB,
  from = 1,
  to,
}: {
  playlistId: string;
  youtubePlaylistIdFromDB: string;
  to: number;
  from?: number;
}) {
  if (from && from > to) {
    throw new Error("<<from>> must be less than <<to>>");
  }

  const nearestPageToLast = await getNearestYoutubePlaylistPage({
    pageNumber: to,
    playlistId,
  });

  const nearestPageNumberToLast = nearestPageToLast?.pageNumber ?? from;
  let pageToken = nearestPageToLast?.pageToken;

  let playlistItemsPage: YoutubePlaylistItems = await fetchYoutubePlaylistPage({
    page: from,
    playlistId,
    pageToken,
    youtubePlaylistIdFromDB,
  });

  if (nearestPageNumberToLast === to) {
    return playlistItemsPage;
  }

  for (const page of range({
    start: nearestPageNumberToLast,
    end: to + 1,
  })) {
    playlistItemsPage = await fetchYoutubePlaylistPage({
      playlistId,
      page,
      youtubePlaylistIdFromDB,
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
  trackCountFromDB,
  pageNumber,
  youtubePlaylistIdFromDB,
}: {
  playlistId: string;
  trackCountFromDB?: number;
  nextPageToken?: string;
  pageNumber?: number;
  youtubePlaylistIdFromDB: string;
}) {
  let videosResponse: YoutubePlaylistItems;

  if (!pageNumber) {
    videosResponse = await fetchYoutubePlaylistPage({
      playlistId,
      page: 1,
      youtubePlaylistIdFromDB,
    });
  } else {
    videosResponse = await queryPlaylistItemFromPageRange({
      playlistId,
      to: pageNumber,
      youtubePlaylistIdFromDB,
    });
  }

  //NOTE: on an else clause because we don't want to update the track count
  //NOTE: for the recently created playlist
  if (trackCountFromDB) {
    const pagesFromDB = Math.ceil(trackCountFromDB / 50);
    const pagesFromResponse = Math.ceil(
      videosResponse.pageInfo.totalResults / 50
    );

    if (pagesFromDB < pagesFromResponse) {
      await addOneToAllPages(playlistId);
      await addOneToManyCacheYoutubePlaylistPages({ playlistId });
    }
  }

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
