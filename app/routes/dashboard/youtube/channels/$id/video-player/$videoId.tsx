import { useLoaderData, useParams, useSearchParams } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { DialogModal } from "~/components/dialog-modal";
import { getYoutubeVideoPlayer } from "~/services/youtube.server";

type LoaderData = { embedHtml: string };

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.videoId, "videoId is required");
  const videoPlayerRes = await getYoutubeVideoPlayer(params.videoId);
  const [videoPlayer] = videoPlayerRes.items;

  const weekInSeconds = 60 * 60 * 24 * 7;
  return json<LoaderData>(
    { embedHtml: videoPlayer.player.embedHtml },
    {
      headers: {
        "Cache-Control": `public, max-age=${weekInSeconds}`,
      },
    }
  );
};

export default function VideoPlayer() {
  const [searchParams] = useSearchParams();
  const { embedHtml } = useLoaderData<LoaderData>();
  const { id: channelId } = useParams();
  const prevUrl = `/dashboard/youtube/channels/${channelId}?${searchParams}`;

  return (
    <DialogModal prevUrl={prevUrl}>
      <div className="grid place-items-center">
        <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
      </div>
    </DialogModal>
  );
}
