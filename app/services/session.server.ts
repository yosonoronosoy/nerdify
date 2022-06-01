import type { Session } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { createCookieSessionStorage } from "@remix-run/node";
import invariant from "tiny-invariant";
import { spotifyStrategy } from "./auth.server";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session", // use any name you want here
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env.SESSION_SECRET], // replace this with an actual secret from env variable
    secure: process.env.NODE_ENV === "production", // enable this in prod only
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getSpotifySession(request: Request) {
  const spotifySession = await spotifyStrategy.getSession(request);
  return spotifySession;
}

export async function getUserIdFromSpotifySession(request: Request) {
  const spotifySession = await getSpotifySession(request);
  if (!spotifySession) return null;
  return spotifySession.user?.id;
}

export async function getUserIdFromSession(request: Request) {
  const session = await getSession(request);
  return session.get("userIdFromDB");
}

export async function setNewCookie(
  sessionKey: string,
  {
    request,
    data,
    path,
  }: {
    request: Request;
    data: any;
    path?: string;
  }
) {
  const session = await setSessionByKey(sessionKey, { request, data });
  const redirectPath = path ?? new URL(request.url).pathname;

  return redirect(redirectPath, {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function setSessionByKey(
  sessionKey: string,
  {
    request,
    data,
    session,
  }:
    | {
        request: Request;
        data: any;
        session?: undefined;
      }
    | { data: any; session: Session; request?: undefined }
) {
  if (!session) {
    const session = await getSession(request);
    session.set(sessionKey, data);
    return session;
  }

  session.set(sessionKey, data);
  return session;
}

export async function logout(request: Request) {
  const session = await getSession(request);

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

const USER_SESSION_KEY = "userId";

export async function createUserSession({
  request,
  userId,
  remember,
  redirectTo,
}: {
  request: Request;
  userId: string;
  remember: boolean;
  redirectTo: string;
}) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, {
        maxAge: remember
          ? 60 * 60 * 24 * 7 // 7 days
          : undefined,
      }),
    },
  });
}

const FIRST_VISITED_SESSION_KEY = "first-visited";
type YoutubeService = "channel" | "playlist" | "video";
export type ServiceKey = `youtube-${YoutubeService}` | "spotify" | "nts" | "discogs";

function getVisitedSessionKey({
  serviceKey,
  id,
}: {
  serviceKey: ServiceKey;
  id: string;
}) {
  return `${FIRST_VISITED_SESSION_KEY}:${serviceKey}:${id}`;
}

export async function getAlreadyVisitedSession({
  request,
  serviceKey,
  id,
}: {
  request: Request;
  serviceKey: ServiceKey;
  id: string;
}) {
  const session = await getSession(request);
  const key = getVisitedSessionKey({ serviceKey, id });
  return session.get(key);
}

export async function setAlreadyVisitedSession({
  request,
  serviceKey,
  id,
}: {
  request: Request;
  serviceKey: ServiceKey;
  id: string;
}) {
  const session = await getSession(request);
  session.set(getVisitedSessionKey({ serviceKey, id }), true);

  return {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  };
}

export async function unsetAlreadyVisitedSession({
  request,
  serviceKey,
  id,
}: {
  request: Request;
  serviceKey: ServiceKey;
  id: string;
}) {
  const session = await getSession(request);
  const key = getVisitedSessionKey({ serviceKey, id });
  session.unset(key);

  return {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  };
}
