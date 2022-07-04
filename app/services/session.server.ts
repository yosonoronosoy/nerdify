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

type SessionOptions =
  | {
      request: Request;
      data: string | Record<string, string>;
      session?: undefined;
    }
  | {
      data: string | Record<string, string>;
      session: Session;
      request?: undefined;
    };

export async function setSessionByKey(
  sessionKey: string | null,
  { request, data, session }: SessionOptions
) {
  let scopedSession = session;

  if (!scopedSession) {
    // impossible condition to hack yelling types
    if (!request) return session;
    scopedSession = await getSession(request);
  }

  if (sessionKey === null) {
    for (const [key, value] of Object.entries(data)) {
      scopedSession.set(key, value);
    }

    return scopedSession;
  }

  /**
   * {
  *
  * FIX: SESSION WRITTEN OUTSIDE OF SPOTIFY:SESSION KEY
  'oauth2:state': '29ec997d-3ba6-4016-b2ce-a70d714825a4',
    FIX:
  'spotify:session': {
    accessToken: '....sQ5aK4hwQWO_R_J',
    refreshToken: '...iREQEtglaWnk',
    expiresAt: 1656712009055,
    tokenType: 'Bearer',
    user: {
      id: 'arodriguezpascual',
      email: 'alexandros2707@gmail.com',
      name: 'Alejandro Rodríguez Pascual',
      image: 'https://scontent-iad3-2.xx.fbcdn.net/v/t1.6435-1/122509733_10164493084660048_117519393098641749_n.jpg?stp=dst-jpg_p320x320&_nc_cat=104&ccb=1-7&_nc_sid=0c64ff&_nc_ohc=_Ojpw9ECsDQAX8ny8xG&_nc_ht=scontent-iad3-2.xx&edm=AP4hL3IEAAAA&oh=00_AT-Pln6veGEwF7T2hccUoieO4diQd99MQyFgsF54LM65Rg&oe=62E403BB'
    }
  },
  userIdFromDB: 'cl4soou2h00027g3nm01hqjos',
    FIX:
  accessToken: '...5GtgaKphLTJhrJBa',
  refreshToken: '...iREQEtglaWnk',
  expiresAt: 1656712016820,
  tokenType: 'Bearer',
  user: {
    id: 'arodriguezpascual',
    email: 'alexandros2707@gmail.com',
    name: 'Alejandro Rodríguez Pascual',
    image: 'https://scontent-iad3-2.xx.fbcdn.net/v/t1.6435-1/122509733_10164493084660048_117519393098641749_n.jpg?stp=dst-jpg_p320x320&_nc_cat=104&ccb=1-7&_nc_sid=0c64ff&_nc_ohc=_Ojpw9ECsDQAX8ny8xG&_nc_ht=scontent-iad3-2.xx&edm=AP4hL3IEAAAA&oh=00_AT-Pln6veGEwF7T2hccUoieO4diQd99MQyFgsF54LM65Rg&oe=62E403BB'
  },
  tokenExpired: false
}

   *
   */

  scopedSession.set(sessionKey, data);
  return scopedSession;
}

export async function commitSession(
  sessionKey: string | null,
  { request, data, session }: SessionOptions
) {
  const s = !session
    ? await setSessionByKey(sessionKey, { request, data })
    : await setSessionByKey(sessionKey, { data, session });

  return { "Set-Cookie": await sessionStorage.commitSession(s) };
}

export async function getUserPlaylistInfoFromSession(request: Request) {
  const session = await getSession(request);

  const offsetFromSession = Number(session.get("offset"));
  const totalPlsFromSession = Number(session.get("totalPlaylists"));

  const offset = !isNaN(offsetFromSession) ? Number(offsetFromSession) : 0;
  const totalPlaylists = !isNaN(totalPlsFromSession)
    ? Number(totalPlsFromSession)
    : 0;

  invariant(typeof offset === "number", "offset must be a number");
  invariant(
    typeof totalPlaylists === "number",
    "totalPlaylists must be a number"
  );

  return { offset, totalPlaylists };
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
export type ServiceKey =
  | `youtube-${YoutubeService}`
  | "spotify"
  | "nts"
  | "discogs";

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
