import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = () => redirect("/");

export const action: ActionFunction = async ({ request }) => {
  return authenticator.authenticate("spotify-auth", request);
};
