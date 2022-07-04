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
import { getUserIdFromSpotifySession } from "~/services/session.server";
import {
  getTrackRatingByYoutubeVideoId,
  upsertTrackRatingForYoutubeVideo,
} from "~/models/track-rating.server";
import { getUserBySpotifyId } from "~/models/user.server";
import { getYoutubeVideoByVideoId } from "~/models/youtube-video.server";
import { Dialog } from "@headlessui/react";
import { useState } from "react";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

type LoaderData = {
  embedHtml: string;
  rating?: number;
  ratingId?: string;
  title: string;
};
export const loader: LoaderFunction = async ({ params, request }) => {
  const spotifyUserId = await getUserIdFromSpotifySession(request);

  invariant(spotifyUserId, "spotifyUserId");
  invariant(params.videoId, "videoId is required");

  const videoPlayerRes = await getYoutubeVideoPlayer(params.videoId);
  const [videoPlayer] = videoPlayerRes.items;

  const ratingFromDB = await getTrackRatingByYoutubeVideoId({
    youtubeVideoIdFromAPI: params.videoId,
    spotifyUserId,
  });

  const weekInSeconds = 60 * 60 * 24 * 7;
  return json<LoaderData>(
    {
      embedHtml: videoPlayer.player.embedHtml,
      title: videoPlayer.snippet.title,
      rating: ratingFromDB?.rating,
      ratingId: ratingFromDB?.id,
    },
    {
      headers: {
        "Cache-Control": `public, max-age=${weekInSeconds}`,
      },
    }
  );
};

export const action: ActionFunction = async ({ params, request }) => {
  invariant(params.videoId, "videoId is required");

  const spotifyUserId = await getUserIdFromSpotifySession(request);
  invariant(spotifyUserId, "spotifyUserId is required");

  const formData = await request.formData();
  const rating = Number(formData.get("rating"));
  const ratingId = formData.get("ratingId");

  const user = await getUserBySpotifyId(spotifyUserId);
  invariant(user, "this should never happen");
  const youtubeVideo = await getYoutubeVideoByVideoId({
    youtubeVideoId: params.videoId,
  });

  await upsertTrackRatingForYoutubeVideo({
    // FIX: get userId from session
    userIdFromDB: user.id,
    youtubeVideoIdFromAPI: params.videoId,
    rating: !Number.isNaN(rating) ? rating : undefined,
    ratingIdFromDB: typeof ratingId === "string" ? ratingId : undefined,
    youtubeVideoIdFromDB: youtubeVideo?.id ?? undefined,
  });

  return null;
};

export default function VideoPlayer() {
  const fetcher = useFetcher();
  const data = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const { embedHtml } = useLoaderData<LoaderData>();
  const { id: channelId } = useParams();
  const prevUrl = `/dashboard/youtube/channels/${channelId}?${searchParams}`;

  return (
    <DialogModal prevUrl={prevUrl}>
      <div className="grid place-items-center gap-4">
        <Dialog.Title
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900"
        >
          Preview Track
        </Dialog.Title>
        <Dialog.Title
          as="h4"
          className="mt-[-1rem] text-base font-medium leading-6 text-gray-500"
        >
          {data.title}
        </Dialog.Title>
        <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
        <Rating
          onClick={(rating) =>
            fetcher.submit(
              { rating: String(rating), ratingId: data?.ratingId ?? "" },
              { method: "post" }
            )
          }
          ratingValue={data.rating ?? 0}
          size={24}
          transition
          allowHalfIcon
          fillColor="#4F46E5"
        />
      </div>
    </DialogModal>
  );
}
