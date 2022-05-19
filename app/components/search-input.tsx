import { SearchIcon } from "@heroicons/react/outline";
import { classNames } from "~/utils";

type SearchContainerProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

function SearchContainer({ className, ...props }: SearchContainerProps) {
  return (
    <div className={classNames("mt-1 flex rounded-md shadow-sm", className)}>
      {props.children}
    </div>
  );
}

SearchContainer.Input = function SearchInput({
  className,
  ...props
}: React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>) {
  return (
    <input
      type="text"
      name={props.name ?? "q"}
      id={props.id ?? "search-query"}
      className={classNames(
        "block w-full  border-gray-300  focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm",
        className ? className : "rounded-none rounded-l-md"
      )}
      placeholder={props.placeholder}
      {...props}
    />
  );
};

SearchContainer.Button = function SearchButton({
  className,
  ...props
}: React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      type="submit"
      className={classNames(
        "flex w-full items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 transition duration-150 ease-in-out focus:border-indigo-500 focus:outline-none focus:ring-indigo-500",
        className
      )}
      {...props}
    >
      {props.children ? props.children : <SearchIcon className="h-5 w-5" />}
    </button>
  );
};

const Search: typeof SearchContainer & {
  Input: typeof SearchContainer.Input;
  Button: typeof SearchContainer.Button;
} = SearchContainer;

export { Search };
