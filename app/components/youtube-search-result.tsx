import { ExclamationIcon } from "@heroicons/react/outline";
import type { Status } from "@prisma/client";
import { Link } from "@remix-run/react";
import { Image } from "./image";

type Resource = "channels" | "playlists" | "videos";

export function YoutubeSearchResult({
  resource,
  resourceId,
  thumnbnailUrl,
  title,
  status,
}: {
  resource: Resource;
  resourceId: string;
  thumnbnailUrl: string | undefined;
  title: string;
  status: Status;
}) {
  const href =
    resource === "channels"
      ? `https://www.youtube.com/channel/${resourceId}`
      : resource === "playlists"
      ? `https://www.youtube.com/playlist?list=${resourceId}`
      : `https://www.youtube.com/watch?v=${resourceId}`;

  const resourceInSingular = resource.slice(0, -1);

  return (
    <li className="rounded-md">
      <div className="flex w-full items-center rounded-lg bg-emerald-100 px-4 pt-14 pb-8 shadow-2xl sm:px-6 sm:pt-8 md:p-4 lg:p-4 lg:pr-8">
        <a
          className="flex items-center justify-between gap-16"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src={thumnbnailUrl}
            alt={`${resourceInSingular}-thumbnail`}
            // crossOrigin="anonymous"
            className="rounded-full h-28 aspect-1"
          />
          <h3 className="text-md font-semibold text-slate-800">{title}</h3>
        </a>
        <Link
          className="text-sm text-indigo-500 ml-auto"
          to={`/dashboard/youtube/${resource}/${resourceId}`}
        >
          Get {resourceInSingular} info
        </Link>
      </div>
      {resource !== "videos" ? (
        status === "PROCESSED" ? (
          <div>This {resourceInSingular} has been fully checked</div>
        ) : status === "OUTDATED" ? (
          <div>This {resourceInSingular} has new content</div>
        ) : null
      ) : null}
    </li>
  );
}

export function YoutubeSearchError({ resource }: { resource: Resource }) {
  const resourceInSingular = resource.slice(0, -1);
  return (
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
              to={`/dashboard/youtube/${resource}`}
              className="font-medium text-red-700 underline hover:text-red-600"
            >
              Try looking for the {resourceInSingular} id in the url instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
