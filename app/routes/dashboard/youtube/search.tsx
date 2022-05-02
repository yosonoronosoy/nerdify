import type { LoaderFunction } from "@remix-run/server-runtime";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import type { SearchChannelResponse } from "~/services/youtube.server";
import { searchChannel } from "~/services/youtube.server";

type LoaderData = SearchChannelResponse | null;

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  let searchQuery = url.searchParams.get("q");

  if (!searchQuery) {
    return null;
  }

  const res = await searchChannel(searchQuery);

  return json<SearchChannelResponse>(res);
};

export default function YoutubeSearch() {
  const data = useLoaderData<LoaderData>();

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
              <div className=" flex items-center justify-between">
                <a
                  className="flex items-center justify-between gap-24"
                  href={`https://www.youtube.com/channel/${item.id.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={`${item.snippet.thumbnails.default?.url}?not-from-cache-please`}
                    alt="channel-thumbnail"
                    crossOrigin="anonymous"
                    className="rounded-full"
                  />
                  <h3>{item.snippet.title}</h3>
                </a>
                <Link to={`/dashboard/youtube/channels/${item.id.channelId}`}>
                  Get channel info
                </Link>
              </div>
              {item.channelStatus === "PROCESSED" ? (
                <div>This channel has been fully checked</div>
              ) : item.channelStatus === "OUTDATED" ? (
                <div>This channel has new content</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
