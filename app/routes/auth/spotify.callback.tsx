import { redirect } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/server-runtime";
import type { Session } from "remix-auth-spotify";
import { createUser, getUserByEmail } from "~/models/user.server";
import { authenticator, spotifyStrategy } from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const spotifySession = (await authenticator.authenticate(
    "spotify-auth",
    request,
    {
      failureRedirect: "/",
    }
  )) as Session | null;

  if (!spotifySession) {
    throw redirect("/login");
  }

  if (!spotifySession.user) {
    throw redirect("/login");
  }

  let userFromDB = await getUserByEmail(spotifySession.user.email);
  if (!userFromDB) {
    userFromDB = await createUser({
      email: spotifySession.user.email,
      spotifyUserId: spotifySession.user.id,
    });
  }

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  session.set(spotifyStrategy.sessionKey, {
    ...spotifySession,
  });
  session.set("userIdFromDB", userFromDB.id);

  const headers = new Headers({
    "Set-Cookie": await sessionStorage.commitSession(session),
  });

  return redirect("/dashboard/youtube", { headers });
};
