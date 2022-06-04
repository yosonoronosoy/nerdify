import { classNames } from "~/utils";

export function ProgressBar({ width }: { width: number }) {
  return (
    <div className="h-1 w-full bg-gray-200">
      <div
        className={classNames(
          "h-1 bg-green-500",
          width < 25
            ? "bg-red-500"
            : width < 75
            ? "bg-yellow-300"
            : width < 99
            ? "bg-orange-500"
            : "bg-green-500"
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
