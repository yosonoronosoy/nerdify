import type { ActionFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import invariant from "tiny-invariant";
import {
  setSessionWithNewAccessToken,
  spotifyStrategy,
} from "~/services/auth.server";

export const action: ActionFunction = async ({ request }) => {
  const spotifySession = await spotifyStrategy.getSession(request);
  const redirectTo = (await request.formData()).get("redirectTo");

  invariant(typeof redirectTo === "string", "redirectTo is required");

  if (!spotifySession) {
    throw redirect("/login");
  }

  return setSessionWithNewAccessToken({
    spotifySession,
    request,
    path: redirectTo,
  });
};
