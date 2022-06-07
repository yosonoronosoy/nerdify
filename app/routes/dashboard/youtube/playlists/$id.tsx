import { useLoaderData, useParams } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserIdFromSession } from "~/services/session.server";
import type { ExtendedResponse } from "~/services/youtube.server";
import { getPlaylistData, getPlaylistTitle } from "~/services/youtube.server";
import invariant from "tiny-invariant";
import TracksTable from "~/components/tracks-table";

const getPageNumber = (searchParams: URLSearchParams) =>
  Number(searchParams.get("page") ?? "1");

type LoaderData = ExtendedResponse | null;

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserIdFromSession(request);
  const playlistId = params.id;
  const pageNumber = getPageNumber(new URL(request.url).searchParams);
  invariant(typeof playlistId === "string", "playlistId must be a string");

  const title = await getPlaylistTitle(playlistId);
  const { headers, extendedResponse } = await getPlaylistData({
    title,
    request,
    pageNumber,
    playlistId,
    resourceId: playlistId,
    serviceKey: "youtube-playlist",
    userIdFromDB: userId,
  });

  return json<LoaderData>(
    {
      ...extendedResponse,
      items: extendedResponse.items.filter(
        (i) =>
          i.snippet.title !== "Deleted video" &&
          i.snippet.title !== "Private video"
      ),
      playlistId,
    },
    headers
  );
};

export default function Playlist() {
  const data = useLoaderData<LoaderData>();
  const { id } = useParams();
  invariant(typeof id === "string", "playlistId is required");
  const tracks = data?.items ?? [];
  return (
    <TracksTable
      resource={{ resourceId: id, resourceType: "playlist" }}
      playlistId={data?.playlistId}
      tracks={tracks}
      totalItems={data?.totalItems}
    />
  );
}
