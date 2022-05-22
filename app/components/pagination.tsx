import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
} from "@heroicons/react/solid";
import { Link, useLocation } from "@remix-run/react";
import { classNames } from "~/utils";
import { DOTS, usePagination } from "./hooks/use-pagination";

type PaginationProps = {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  url?: string;
  siblingCount?: number;
};

export default function Pagination({
  pageSize,
  totalCount,
  currentPage,
  url,
  siblingCount = 1,
}: PaginationProps) {
  const paginationRange =
    usePagination({
      currentPage,
      totalCount,
      pageSize,
      siblingCount,
    }) ?? [];

  const location = useLocation();
  const lastPage = paginationRange.at(-1);
  const currentUrl = url ?? location.pathname;

  const getParams = (page: number = currentPage) =>
    new URLSearchParams({
      page: page.toString(),
    });

  // throw new Error("CORRECT THE MIDDLE RANGE");

  return currentPage === 0 || paginationRange.length < 2 ? null : (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="-mt-px flex w-0 flex-1">
        <Link
          to={`${currentUrl}?${getParams(currentPage - 1)}`}
          className={classNames(
            "inline-flex items-center border-t-2  border-transparent pt-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          )}
          style={{
            opacity: currentPage === 1 ? 0.5 : 1,
            pointerEvents: currentPage === 1 ? "none" : "all",
          }}
        >
          <ArrowNarrowLeftIcon
            className="mr-3 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
          Previous
        </Link>
      </div>
      <div className="hidden md:-mt-px md:flex">
        {paginationRange.map((item, idx) => {
          if (typeof item === "string") {
            return (
              <span
                key={`DOTS-${idx}`}
                className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500"
              >
                {DOTS}
              </span>
            );
          }

          return (
            <Link
              key={`${currentUrl}?${getParams(item)}`}
              to={`${currentUrl}?${getParams(item)}`}
              className={classNames(
                "inline-flex items-center border-t-2 px-4 pt-4 text-sm font-medium",
                item === currentPage
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              {item}
            </Link>
          );
        })}
      </div>
      <div className="-mt-px flex w-0 flex-1 justify-end">
        <Link
          to={`${currentUrl}?${getParams(currentPage + 1)}`}
          className={classNames(
            "inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          )}
          style={{
            opacity: currentPage === lastPage ? 0.5 : 1,
            pointerEvents: currentPage === lastPage ? "none" : "all",
          }}
        >
          Next
          <ArrowNarrowRightIcon
            className="ml-3 h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </Link>
      </div>
    </nav>
  );
}
