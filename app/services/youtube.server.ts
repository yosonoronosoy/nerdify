import type { Status } from "@prisma/client";
import { getYoutubeChannel } from "~/models/youtubeChannel.server";
import { youtubeChannelListSchema } from "~/zod-schemas/YoutubeChannelsSchema";
import { youtubePlaylistItemsSchema } from "~/zod-schemas/YoutubePlaylistSchema";
import type {
  YoutubeChannelSearchResult,
  YoutubeSearchChannelResponse,
  YoutubeSearchResponse,
} from "~/zod-schemas/YoutubeSearchSchema";
import { youtubeSearchResponse } from "~/zod-schemas/YoutubeSearchSchema";

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
