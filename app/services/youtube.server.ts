import type { Status, TrackRating } from "@prisma/client";
import {
  addOneToManyCacheYoutubePlaylistPages,
  getCachedYoutubePlaylistPage,
  getYoutubeChannelInfoFromCache,
  setCacheYoutubePlaylistPage,
  setYoutubeChannelInfoInCache,
} from "~/models/redis.server";
import { getTrackRatingByYoutubeVideoId } from "~/models/track-rating.server";
import {
  getManyYoutubeChannels,
  getYoutubeChannel,
} from "~/models/youtube-channel.server";
import {
  createYoutubePlaylistPage,
  getNearestYoutubePlaylistPage,
  addOneToAllPages,
  getYoutubePlaylistPageByPageToken,
  getYoutubePageWithVideos,
} from "~/models/youtube-playlist-page.server";
import {
  createYoutubePlaylist,
  getYoutubePlaylistByPlaylistId,
  updateYoutubePlaylistCount,
} from "~/models/youtube-playlist.server";
import {
  getYoutubeVideoByTitle,
  getYoutubeVideosFromPlaylistPage,
} from "~/models/youtube-video.server";
import { ResourceChannelResponse } from "~/routes/resources/youtube/channel.$id";
import { youtubeChannelListSchema } from "~/zod-schemas/youtube-channels-schema.server";
import type { YoutubePlaylistItems } from "~/zod-schemas/youtube-playlist-schema.server";
import { youtubePlaylistResponseSchema } from "~/zod-schemas/youtube-playlist-schema.server";
import { youtubePlaylistItemsSchema } from "~/zod-schemas/youtube-playlist-schema.server";
import type {
  YoutubeChannelSearchResult,
  YoutubeSearchChannelResponse,
  YoutubeSearchResponse,
} from "~/zod-schemas/youtube-search-schema.server";
import { youtubeSearchResponse } from "~/zod-schemas/youtube-search-schema.server";
import { youtubeVideoPlayerResponseSchema } from "~/zod-schemas/youtube-video-player.server";
import type { ServiceKey } from "./session.server";
import {
  getAlreadyVisitedSession,
  setAlreadyVisitedSession,
} from "./session.server";

const baseUrl = "https://www.googleapis.com/youtube/v3";
const channelUrl = `${baseUrl}/channels`;
const playlistItemsUrl = `${baseUrl}/playlistItems`;
const playlistUrl = `${baseUrl}/playlists`;
const videosUrl = `${baseUrl}/videos`;
const searchUrl = `${baseUrl}/search`;

type SearchParams = Record<string, string>;

function getQuerystring(searchParams: SearchParams) {
  return new URLSearchParams({
    key: process.env.YOUTUBE_API_KEY,
    part: "snippet",
    ...searchParams,
  });
}

export async function queryYoutubeChannel(searchParams: SearchParams) {
  const channelId = searchParams.id;
  const resFromCache = await getYoutubeChannelInfoFromCache(channelId);

  if (resFromCache) {
    return resFromCache;
  }

  const channelQuerystring = getQuerystring(searchParams);

  const channelRawRes = await fetch(`${channelUrl}?${channelQuerystring}`).then(
    (res) => res.json()
  );

  const channelResponse = youtubeChannelListSchema.parse(channelRawRes);

  setYoutubeChannelInfoInCache(channelResponse);

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

  const videosRawRes = await fetch(`${playlistItemsUrl}?${querystring}`).then(
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
    youtubePlaylistIdFromDB,
  });

  const nearestPageNumberToLast = nearestPageToLast?.pageNumber ?? from;
  let pageToken: string | undefined = nearestPageToLast?.pageToken;

  let playlistItemsPage: YoutubePlaylistItems = await fetchYoutubePlaylistPage({
    page: nearestPageNumberToLast,
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

  const channelsFromDB = await getManyYoutubeChannels({
    channelIds: filteredResponse.items.map((item) => ({
      channelId: item.id.channelId,
    })),
  });

  // const finalItems = await Promise.all(
  //   filteredResponse.items.map(async (item) => {
  //     const channelId = item.id.channelId;
  //     const channel = await getYoutubeChannel({ channelId });
  //
  //     return {
  //       ...item,
  //       channelStatus: channel?.status ?? "UNPROCESSED",
  //     };
  //   })
  // );

  const finalItems = filteredResponse.items.map((item) => {
    const channelId = item.id.channelId;
    const channel = channelsFromDB.find(
      (channel) => channel.channelId === channelId
    );

    return {
      ...item,
      channelStatus: channel?.status ?? "UNPROCESSED",
    };
  });

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

type YoutubeResponseWithSpotifyAvailabilityAndTrackRating = Omit<
  YoutubePlaylistItems,
  "items"
> & {
  items: (YoutubePlaylistItems["items"][number] & {
    spotifyAvailability: SpotifyAvailability;
    trackRating?: TrackRating;
    closeMatchPercentage: number | null;
    closeMatchSpotifyTitle: string | null;
    closeMatchSpotifyTrackId: string | null;
  })[];
};

export type ExtendedResponse =
  YoutubeResponseWithSpotifyAvailabilityAndTrackRating & {
    nextPageToken: string | null;
    totalItems: number;
    playlistId: string;
  };

export async function getPlaylistResponse({
  playlistId,
  trackCountFromDB,
  pageNumber,
  youtubePlaylistIdFromDB,
  userId,
}: {
  playlistId: string;
  trackCountFromDB?: number;
  nextPageToken?: string;
  pageNumber?: number;
  youtubePlaylistIdFromDB: string;
  userId: string;
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

  // TODO: GET PAGE FROM DB AND ITS VIDEOS
  const ytPage = await getYoutubePageWithVideos({
    pageNumber: pageNumber ?? 0,
    userId,
  });

  const items = await Promise.all(
    videosResponse.items.map(async (item) => {
      const video = ytPage?.youtubeVideos.find(
        (vid) => vid?.youtubeVideoId === item.snippet.resourceId.videoId
      );

      let spotifyAvailability: SpotifyAvailability;
      if (!video) {
        spotifyAvailability = { kind: "UNCHECKED" };
      } else {
        spotifyAvailability = { kind: video.availability };
      }

      let percentage: number | null = null;
      if (video?.availability === "PENDING") {
        const titleLength = item.snippet.title.length;

        const leven = video.spotifyTracks[0].levenshteinScore ?? titleLength;
        percentage = 100 - (leven / titleLength) * 100;
      }

      const isTrack = video && video.spotifyTracks[0];
      const closeMatchSpotifyTitle = isTrack
        ? `${video.spotifyTracks[0].artists.map((a) => a.name).join(", ")} - ${
            video.spotifyTracks[0].name
          }`
        : null;

      const closeMatchSpotifyTrackId = isTrack
        ? video.spotifyTracks[0].trackId
        : null;

      return {
        ...item,
        spotifyAvailability,
        closeMatchSpotifyTitle,
        closeMatchSpotifyTrackId,
        closeMatchPercentage: percentage,
        trackRating: video?.trackRating[0],
      };
    })
  );

  const extendedResponse: YoutubeResponseWithSpotifyAvailabilityAndTrackRating =
    {
      ...videosResponse,
      items,
    };

  return {
    ...extendedResponse,
    nextPageToken: videosResponse.nextPageToken ?? "",
    totalItems: videosResponse.pageInfo.totalResults,
  };
}

export async function getYoutubeVideoPlayer(id: string) {
  const params = getQuerystring({
    part: "player,snippet",
    id,
  });
  const res = await fetch(`${videosUrl}?${params}`).then((res) => res.json());
  return youtubeVideoPlayerResponseSchema.parse(res);
}

export async function getPlaylistData({
  playlistId,
  title,
  resourceId,
  serviceKey,
  request,
  pageNumber,
  userIdFromDB,
  imgUrl,
}: {
  playlistId: string;
  title: string;
  resourceId: string;
  serviceKey: ServiceKey;
  request: Request;
  pageNumber: number;
  userIdFromDB: string;
  imgUrl?: string;
}) {
  let playlistFromDB = await getYoutubePlaylistByPlaylistId(playlistId);

  if (!playlistFromDB) {
    playlistFromDB = await createYoutubePlaylist({
      title,
      playlistId,
      trackCount: 0,
      image: imgUrl ?? null,
    });
  }

  const alreadyVisited = await getAlreadyVisitedSession({
    id: resourceId,
    request,
    serviceKey,
  });

  const oneDayInSeconds = 24 * 60 * 60;
  let headers: {
    headers: {
      [key: string]: string;
    };
  } = {
    headers: {
      "Cache-Control": `public, max-age=${oneDayInSeconds}`,
    },
  };

  if (!alreadyVisited) {
    const alreadyVisitedHeaders = await setAlreadyVisitedSession({
      id: resourceId,
      request,
      serviceKey: "youtube-channel",
    });

    headers = {
      headers: {
        ...alreadyVisitedHeaders.headers,
      },
    };

    const res = await queryPlaylistItemFromPageRange({
      playlistId,
      from: 1,
      to: 5,
      youtubePlaylistIdFromDB: playlistFromDB.id,
    });

    await updateYoutubePlaylistCount({
      id: playlistFromDB.id,
      trackCount: res.pageInfo.totalResults,
    });
  }

  // FIX: this method is too wasteful, use playlistPage hasMany ytVideos relationship instead
  const extendedResponse = await getPlaylistResponse({
    userId: userIdFromDB,
    playlistId,
    trackCountFromDB: playlistFromDB?.trackCount,
    pageNumber,
    youtubePlaylistIdFromDB: playlistFromDB.id,
  });

  return { extendedResponse, headers };
}

export async function getPlaylistMetadata(id: string) {
  const querystring = getQuerystring({
    id,
  });

  const videosRawRes = await fetch(`${playlistUrl}?${querystring}`).then(
    (res) => res.json()
  );

  const res = youtubePlaylistResponseSchema.parse(videosRawRes);
  return {
    title: res.items[0].snippet.title,
    thumbnail: res.items[0].snippet.thumbnails.default?.url,
  };
}
