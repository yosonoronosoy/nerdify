import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/server-runtime";
import { authenticator, spotifyStrategy } from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const spotifySession = await authenticator.authenticate(
    "spotify-auth",
    request,
    {
      failureRedirect: "/",
    }
  );

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  session.set(spotifyStrategy.sessionKey, spotifySession);

  const headers = new Headers({
    "Set-Cookie": await sessionStorage.commitSession(session),
  });

  return redirect("/dashboard/youtube", { headers });
};
