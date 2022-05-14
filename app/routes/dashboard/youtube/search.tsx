import type { LoaderFunction } from "@remix-run/server-runtime";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import type { SearchChannelResponse } from "~/services/youtube.server";
import { searchChannel } from "~/services/youtube.server";
import { ExclamationIcon, SearchIcon } from "@heroicons/react/outline";

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
      <Form method="get" className="mx-auto w-3/4 md:w-3/4 lg:w-5/12">
        <SearchBarWithButton />
      </Form>
      {data && data.items.length > 0 ? (
        <ul className="mt-16">
          {data.items.map((item) => (
            <li
              key={item.id.channelId}
              className="mx-auto max-w-xl rounded-md p-8 shadow-lg"
            >
              <div className="flex items-center justify-between">
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
                  <h3 className="text-xl font-semibold text-slate-800">
                    {item.snippet.title}
                  </h3>
                </a>
                <Link
                  className="text-sm text-indigo-500"
                  to={`/dashboard/youtube/channels/${item.id.channelId}`}
                >
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
      ) : data && data.items.length === 0 ? (
        <div className="mt-8 border-l-4 border-red-400 bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationIcon
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                No results found for your query{" "}
                <Link
                  to="youtube/channel"
                  className="font-medium text-red-700 underline hover:text-red-600"
                >
                  Try looking for the channel id in the url instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SearchBarWithButton() {
  return (
    <div>
      <label
        htmlFor="searh-query"
        className="block text-sm font-medium text-gray-700"
      >
        Search Channels
      </label>
      <div className="mt-1 flex rounded-md shadow-sm">
        <input
          type="text"
          name="q"
          id="search-query"
          className="block w-full rounded-none rounded-l-md border-gray-300  focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter channel name..."
        />
        <button
          type="submit"
          className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span>Search</span>
        </button>
      </div>
    </div>
  );
}
