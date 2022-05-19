import type { Status } from "@prisma/client";
import { getYoutubeChannel } from "~/models/youtube-channel.server";
import {
  createYoutubePlaylist,
  getYoutubePlaylistByPlaylistId,
} from "~/models/youtube-playlist.server";
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

export async function queryPlaylistItems(
  playlistId: string,
  pageToken?: string
) {
  const playlistQuerystring = getQuerystring({
    playlistId,
    maxResults: "50",
    pageToken: pageToken ?? "",
  });

  const videosRawRes = await fetch(
    `${playlistUrl}?${playlistQuerystring}`
  ).then((res) => res.json());

  const videosResponse = youtubePlaylistItemsSchema.parse(videosRawRes);
  return videosResponse;
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

  const videosResponse = await queryPlaylistItems(playlistId, nextPageToken);

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
