import { SearchIcon } from "@heroicons/react/outline";

export function SearchBarWithButton({
  title,
  placeholder,
  buttonText = "Search",
}: {
  title: string;
  placeholder?: string;
  buttonText?: string;
}) {
  const isPlaylist = title.includes("playlist");
  const ph = !placeholder
    ? `${title} ${!isPlaylist ? "name" : ""}`
    : placeholder;

  return (
    <div>
      <label
        htmlFor="searh-query"
        className="block text-left text-sm font-medium text-gray-700"
      >
        {title}
      </label>
      <div className="mt-2 flex rounded-md shadow-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-200">
        <input
          type="text"
          name="q"
          id="search-query"
          className="block w-full rounded-none rounded-l-md border-gray-300 sm:text-sm focus:ring-0 focus:border-none"
          placeholder={ph}
        />
        <button
          type="submit"
          className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-none"
        >
          <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span>{buttonText}</span>
        </button>
      </div>
    </div>
  );
}
