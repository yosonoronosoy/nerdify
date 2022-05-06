import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/server-runtime";
import type { Session } from "remix-auth-spotify";
import { authenticator, spotifyStrategy } from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const spotifySession = (await authenticator.authenticate(
    "spotify-auth",
    request,
    {
      failureRedirect: "/",
    }
  )) as Session;

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  session.set(spotifyStrategy.sessionKey, {
    ...spotifySession,
    tokenExpired: false,
  });

  const headers = new Headers({
    "Set-Cookie": await sessionStorage.commitSession(session),
  });

  return redirect("/dashboard/youtube", { headers });
};
