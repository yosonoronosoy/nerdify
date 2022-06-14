import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
  YoutubeSearchError,
  YoutubeSearchResult,
} from "~/components/youtube-search-result";
import type { SearchChannelResponse } from "~/services/youtube.server";
import { searchChannel } from "~/services/youtube.server";

type LoaderData = SearchChannelResponse | null;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);

  const searchQuery = url.searchParams.get("q");

  if (!searchQuery) {
    return null;
  }

  const res = await searchChannel(searchQuery);
  return json<SearchChannelResponse>(res);
};

export default function YoutubeSearchChannel() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      {data && data.items.length > 0 ? (
        <ul className="mt-16">
          {data.items.map((item) => (
            <YoutubeSearchResult
              key={item.id.channelId}
              resource="channels"
              resourceId={item.id.channelId}
              thumnbnailUrl={item.snippet.thumbnails.default?.url}
              title={item.snippet.title}
              status={item.channelStatus}
            />
          ))}
        </ul>
      ) : data && data.items.length === 0 ? (
        <YoutubeSearchError resource="channels" />
      ) : null}
    </div>
  );
}
