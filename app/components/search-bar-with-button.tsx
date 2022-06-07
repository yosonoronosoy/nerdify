import { SearchIcon } from "@heroicons/react/outline";

export function SearchBarWithButton({ title }: { title: string }) {
  const isPlaylist = title.includes("playlist");
  return (
    <div>
      <label
        htmlFor="searh-query"
        className="block text-sm font-medium text-gray-700"
      >
        {title}
      </label>
      <div className="mt-1 flex rounded-md shadow-sm">
        <input
          type="text"
          name="q"
          id="search-query"
          className="block w-full rounded-none rounded-l-md border-gray-300  focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={`${title} ${!isPlaylist ? "name" : ""}`}
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
