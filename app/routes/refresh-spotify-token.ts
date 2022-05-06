import type { LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import {
  setSessionWithNewAccessToken,
  spotifyStrategy,
} from "~/services/auth.server";

export const action: LoaderFunction = async ({ request, params }) => {
  const spotifySession = await spotifyStrategy.getSession(request);
  const redirectUrl = params.redirectUrl;

  if (!redirectUrl) {
    throw new Error("No redirect url provided");
  }

  if (!spotifySession) {
    throw redirect("/");
  }

  setSessionWithNewAccessToken({
    spotifySession,
    request,
    path: redirectUrl,
  });
};
