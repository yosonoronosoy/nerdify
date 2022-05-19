import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import type { Session } from "remix-auth-spotify";

import { spotifyStrategy } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  return spotifyStrategy.getSession(request);
};

export const meta: MetaFunction = () => {
  return {
    title: "Login",
  };
};

export default function LoginPage() {
  const data = useLoaderData<Session | undefined | null>();
  const user = data?.user;

  return (
    <Form action={user ? "/logout" : "/auth/spotify"} method="post">
      <button>{user ? "Logout" : "Log in with Spotify"}</button>
    </Form>
  );
}
