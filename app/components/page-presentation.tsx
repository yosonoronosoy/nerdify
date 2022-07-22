import { HeartIcon, PencilIcon, ViewListIcon } from "@heroicons/react/outline";
import { ViewGridIcon as ViewGridIconSolid } from "@heroicons/react/solid";
import { Link } from "@remix-run/react";
import { formatDistance } from "date-fns";
import { useState } from "react";
import { capitalize, classNames } from "~/utils";
import type { Resource } from "~/zod-schemas/resource-schema.server";
import { Image } from "./image";
import { ProgressBar } from "./progress-bar";

type Tab = typeof tabs[number];
const tabs = [
  { name: "Recently Viewed", href: "#", current: true },
  { name: "Recently Added", href: "#", current: false },
  { name: "Favorited", href: "#", current: false },
];

type ResourceType = "channels" | "playlists";

export function PagePresentation({
  resources,
  resourceType,
}: {
  resources: Resource[];
  resourceType: ResourceType;
}) {
  const [selectedResource, setSelectedResource] = useState<
    Resource | undefined
  >(resources.at(0));

  const formattedResource = selectedResource
    ? {
        Title: selectedResource.title,
        Status: capitalize(selectedResource.status),
        "Last Time Viewed": formatDistance(
          new Date(),
          new Date(selectedResource.lastViewedAt ?? new Date()),
          { addSuffix: true }
        ),
        "Spotify Tracks Found": selectedResource._count.spotifyTracks,
        "Total Videos": selectedResource.totalVideos,
      }
    : undefined;

  return (
    <div className="flex flex-1 items-stretch overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="flex">
            <h1 className="flex-1 text-2xl font-bold text-gray-900">
              {resourceType}
            </h1>
            <ButtonsContainer view="mobile" />
          </div>

          {/* Tabs */}
          <div className="mt-3 sm:mt-2">
            <MobileViewTabs />
            <DesktopViewTabs tabs={tabs} />
          </div>

          {/* Gallery */}
          <Gallery
            resources={resources}
            current={selectedResource}
            onSelect={setSelectedResource}
          />
        </div>
      </main>

      {/* Details sidebar */}
      <DetailsSidebar
        currentResource={selectedResource}
        formattedResource={formattedResource}
        resourceType={resourceType}
      />
    </div>
  );
}

function ButtonsContainer({ view }: { view: "mobile" | "desktop" }) {
  return (
    <div
      className={classNames(
        "ml-6 flex items-center rounded-lg bg-gray-100 p-0.5 sm:hidden",
        view === "mobile" ? "flex sm:hidden" : "hidden sm:flex"
      )}
    >
      <button
        type="button"
        className="rounded-md p-1.5 text-gray-400 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      >
        <ViewListIcon className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Use list view</span>
      </button>
      <button
        type="button"
        className="ml-0.5 rounded-md bg-white p-1.5 text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      >
        <ViewGridIconSolid className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Use grid view</span>
      </button>
    </div>
  );
}

function MobileViewTabs() {
  return (
    <div className="sm:hidden">
      <label htmlFor="tabs" className="sr-only">
        Select a tab
      </label>
      {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
      <select
        id="tabs"
        name="tabs"
        className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        defaultValue="Recently Viewed"
      >
        <option>Recently Viewed</option>
        <option>Recently Added</option>
        <option>Favorited</option>
      </select>
    </div>
  );
}

function DesktopViewTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="hidden sm:block">
      <div className="flex items-center border-b border-gray-200">
        <nav
          className="-mb-px flex flex-1 space-x-6 xl:space-x-8"
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <a
              key={tab.name}
              href={tab.href}
              aria-current={tab.current ? "page" : undefined}
              className={classNames(
                tab.current
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
              )}
            >
              {tab.name}
            </a>
          ))}
        </nav>
        <ButtonsContainer view="desktop" />
      </div>
    </div>
  );
}

type OnSelect = React.Dispatch<React.SetStateAction<Resource | undefined>>;

function Gallery({
  resources,
  current,
  onSelect,
}: {
  resources: Resource[];
  current: Resource | undefined;
  onSelect: OnSelect;
}) {
  return (
    <section className="mt-8 pb-16" aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" className="sr-only">
        Recently viewed
      </h2>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {resources.map((resource) => (
          <li key={resource.title} className="relative">
            <div
              className={classNames(
                resource.id === current?.id
                  ? "ring-2 ring-indigo-500 ring-offset-2"
                  : "focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100",
                "group aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-lg bg-gray-100"
              )}
            >
              <Image
                src={resource.image ?? undefined}
                alt=""
                className={classNames(
                  resource.id === current?.id ? "" : "group-hover:opacity-75",
                  "pointer-events-none object-cover"
                )}
              />
              <button
                type="button"
                className="absolute inset-0 focus:outline-none"
                onClick={() => onSelect(resource)}
              >
                <span className="sr-only">
                  View details for {resource.title}
                </span>
              </button>
            </div>
            <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
              {resource.title}
            </p>
            <p className="pointer-events-none block text-sm font-medium text-gray-500">
              {capitalize(resource.status.toLowerCase())}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

type FormattedResource = {
  Title: string;
  Status: string;
  "Last Time Viewed": string;
  "Spotify Tracks Found": number;
  "Total Videos": number;
};

function DetailsSidebar({
  currentResource,
  formattedResource,
  resourceType,
}: {
  currentResource: Resource | undefined;
  formattedResource: FormattedResource | undefined;
  resourceType: ResourceType;
}) {
  if (!currentResource || !formattedResource) {
    return null;
  }

  const resourceTypeInSingular = resourceType.replace(/s$/, "");
  const spotifyTrackCount = currentResource._count.spotifyTracks;

  const processPercentage =
    currentResource.totalVideos === 0
      ? 0
      : Math.round(spotifyTrackCount / currentResource.totalVideos);

  //TODO: ADD VIDEOS PROCESSED
  // FIX: CHANGE TRACKS PROCESSED TO SPOTIFY TRACKS FOUND
  return (
    <aside className="hidden w-96 overflow-y-auto border-l border-gray-200 bg-white p-8 lg:block">
      <div className="space-y-6 pb-16">
        <div>
          <div className="aspect-w-1 mx-auto block h-32 w-32 overflow-hidden rounded-full">
            <Image
              src={currentResource.image ?? undefined}
              // src={ undefined}
              alt="thumbnail"
              className="object-cover"
            />
          </div>
          <div className="mt-4 flex items-start justify-between">
            <div>
              <h2 className="mb-2 text-lg font-medium text-gray-900">
                <span className="sr-only">Details for </span>
                {currentResource.title}
              </h2>
              <div className="text-sm font-medium text-gray-500">
                <ProgressBar width={processPercentage} />
                <span className="mb-6">
                  {`${processPercentage}%`} processed
                </span>
              </div>
            </div>
            <button
              type="button"
              className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <HeartIcon className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Favorite</span>
            </button>
          </div>
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Information</h3>
          <dl className="mt-2 divide-y divide-gray-200 border-t border-b border-gray-200">
            {Object.entries(formattedResource).map(([key, value]) => {
              return (
                <div
                  key={key}
                  className="flex justify-between py-3 text-sm font-medium"
                >
                  <dt className="text-gray-500">{key}</dt>
                  <dd className="text-gray-900">{value}</dd>
                </div>
              );
            })}
          </dl>
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Description</h3>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm italic text-gray-500">
              Add a description to this image.
            </p>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <PencilIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Add description</span>
            </button>
          </div>
        </div>

        <div className="flex">
          <Link
            to={currentResource.resourceId}
            className="flex-1 rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-center text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Go to {resourceTypeInSingular}
          </Link>
        </div>
      </div>
    </aside>
  );
}
