import { Link, Outlet, useLocation } from "@remix-run/react";

const tabs = [
  { name: "Search", href: "search" },
  { name: "Channel", href: "channel" },
  { name: "Playlist", href: "playlist" },
  { name: "Video", href: "video" },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Youtube() {
  const location = useLocation();
  const currentTab = location.pathname.split("/").at(-1);

  return (
    <div className="mt-8">
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          defaultValue={currentTab}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-16 hidden sm:block">
        <nav
          className="relatie z-0 flex divide-x divide-gray-200 rounded-lg shadow"
          aria-label="Tabs"
        >
          {tabs.map((tab, tabIdx) => (
            <Link
              key={tab.name}
              to={tab.href}
              className={classNames(
                currentTab === tab.href
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700",
                tabIdx === 0 ? "rounded-l-lg" : "",
                tabIdx === tabs.length - 1 ? "rounded-r-lg" : "",
                "group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10"
              )}
              aria-current={currentTab === tab.href ? "page" : undefined}
            >
              <span>{tab.name}</span>
              <span
                aria-hidden="true"
                className={classNames(
                  currentTab === tab.href ? "bg-indigo-500" : "bg-transparent",
                  "absolute inset-x-0 bottom-0 h-0.5"
                )}
              />
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
