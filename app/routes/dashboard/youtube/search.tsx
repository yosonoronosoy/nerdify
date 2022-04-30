import type { LoaderFunction } from "@remix-run/server-runtime";
import { Form, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import type {
  YoutubeChannelSearchResult,
  YoutubeSearchChannelResponse,
  YoutubeSearchResponse,
} from "~/zod-schemas/YoutubeSearchSchema";
import { youtubeSearchResponse } from "~/zod-schemas/YoutubeSearchSchema";

type LoaderData = YoutubeSearchChannelResponse | null;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  let searchQuery = url.searchParams.get("q");

  if (!searchQuery) {
    return null;
  }

  const searchUrl = `https://www.googleapis.com/youtube/v3/search`;

  const querystring = new URLSearchParams({
    part: "snippet",
    maxResults: "25",
    q: searchQuery,
    key: process.env.YOUTUBE_API_KEY,
  });

  const response = await fetch(`${searchUrl}?${querystring}`).then((res) =>
    res.json()
  );

  const filterChannel = (
    item: YoutubeSearchResponse["items"][number]
  ): item is YoutubeChannelSearchResult => item.id.kind === "youtube#channel";

  const ytResponse = youtubeSearchResponse.parse(response);

  const finalResponse = {
    ...ytResponse,
    items: ytResponse.items.filter(filterChannel),
  };

  return json(finalResponse);
};

export default function YoutubeSearch() {
  const data = useLoaderData<LoaderData>();
  console.log({ data });

  return (
    <div>
      <h1>Youtube Search</h1>
      <Form method="get" className="mx-auto w-64">
        <label
          htmlFor="search-query"
          className="block text-sm font-medium text-gray-700"
        >
          Search
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="q"
            id="search-query"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter your query"
          />
        </div>
      </Form>
      {data && (
        <ul className="mt-4">
          {data.items.map((item) => (
            <li key={item.id.channelId} className="mx-auto max-w-xl">
              <a
                className="flex items-center justify-between"
                href={`https://www.youtube.com/channel/${item.id.channelId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`${item.snippet.thumbnails.default?.url}?not-from-cache-please`}
                  alt=""
                  crossOrigin="anonymous"
                  className="rounded-full"
                />
                {item.snippet.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
