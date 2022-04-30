import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = () => redirect("dashboard/youtube");

export const action: ActionFunction = ({ request }) => {
  return authenticator.authenticate("google-auth", request);
};
