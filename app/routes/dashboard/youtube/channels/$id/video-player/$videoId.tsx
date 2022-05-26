import {
  useFetcher,
  useLoaderData,
  useParams,
  useSearchParams,
} from "@remix-run/react";
import type {
  ActionFunction,
  LinksFunction,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { DialogModal } from "~/components/dialog-modal";
import { getYoutubeVideoPlayer } from "~/services/youtube.server";
import { Rating } from "react-simple-star-rating";
import styles from "~/styles/video-player.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

type LoaderData = { embedHtml: string };
export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.videoId, "videoId is required");
  const videoPlayerRes = await getYoutubeVideoPlayer(params.videoId);
  const [videoPlayer] = videoPlayerRes.items;

  const weekInSeconds = 60 * 60 * 24 * 7;
  console.log({ embedHtml: videoPlayer.player.embedHtml });
  return json<LoaderData>(
    { embedHtml: videoPlayer.player.embedHtml },
    {
      headers: {
        "Cache-Control": `public, max-age=${weekInSeconds}`,
      },
    }
  );
};

export const action: ActionFunction = async ({ params }) => {
  invariant(params.videoId, "videoId is required");
  return null;
};

export default function VideoPlayer() {
  const fetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const { embedHtml } = useLoaderData<LoaderData>();
  const { id: channelId } = useParams();
  const prevUrl = `/dashboard/youtube/channels/${channelId}?${searchParams}`;

  return (
    <DialogModal prevUrl={prevUrl}>
      <div className="grid place-items-center gap-4">
        <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
        <Rating
          onClick={(rating) =>
            fetcher.submit({ rating: String(rating) }, { method: "post" })
          }
          ratingValue={0}
          size={24}
          transition
          allowHalfIcon
          fillColor="#4F46E5"
        />
      </div>
    </DialogModal>
  );
}
