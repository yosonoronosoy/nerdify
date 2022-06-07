import type { LoaderFunction } from "@remix-run/server-runtime";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import type { SearchChannelResponse } from "~/services/youtube.server";
export default function YoutubeSearch() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
