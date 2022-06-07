import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("q");
  invariant(
    typeof searchQuery === "string",
    "searchQuery in playlists/search must be a string"
  );

  return redirect(`/dashboard/youtube/playlists/${searchQuery}`);
};
