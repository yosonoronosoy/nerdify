import type { Session } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { createCookieSessionStorage } from "@remix-run/node";
import invariant from "tiny-invariant";

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
  console.log("========= setNewCookie ===========");
  const session = await setSessionByKey(sessionKey, { request, data });
  const redirectPath = path ?? new URL(request.url).pathname;
  console.log({ redirectPath });
  console.log("========= setNewCookie ===========");

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
