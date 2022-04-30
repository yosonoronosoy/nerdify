import type { LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { authenticator } from "~/services/auth.server";
import { sessionStorage } from "~/services/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const googleSession = await authenticator.authenticate(
    "google-auth",
    request,
    {
      failureRedirect: "/dashboard",
    }
  );

  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );

  session.set("google:session", googleSession);

  const headers = new Headers({
    "Set-Cookie": await sessionStorage.commitSession(session),
  });

  return redirect("/dashboard/youtube", { headers });
};
