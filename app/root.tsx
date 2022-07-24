import type { LinksFunction, MetaFunction } from "@remix-run/node";
import type {
  ActionArgs,
  LoaderArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { Session } from "remix-auth-spotify";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  Form,
  useLocation,
  useFetcher,
  useTransition,
} from "@remix-run/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MenuIcon } from "@heroicons/react/outline";
import { spotifyStrategy } from "~/services/auth.server";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import { DialogModal } from "./components/dialog-modal";
import { commitSession, getSession } from "./services/session.server";
import { AuthButton } from "./components/buttons";
import { MobileSidebar } from "./components/sidebar/mobile-sidebar";
import { DesktopSidebar } from "./components/sidebar/desktop-sidebar";
import invariant from "tiny-invariant";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Nerdify",
  viewport: "width=device-width,initial-scale=1",
});

export async function loader({ request }: LoaderArgs) {
  const [spotifySession, session] = await Promise.all([
    spotifyStrategy.getSession(request),
    getSession(request),
  ]);

  const dontAskAgain: "true" | undefined = session.get("dontAskForLogoutAgain");

  if (!spotifySession) {
    return json(null);
  }

  const tenMinutesInSeconds = 60 * 10;
  return json(
    {
      user: spotifySession.user,
      dontAskAgain,
    },
    {
      headers: {
        "Cache-Control": `public, max-age=${tenMinutesInSeconds}`,
      },
    }
  );
}

export async function action({ request }: ActionArgs) {
  const intent = (await request.formData()).get("intent");

  if (intent !== "dontAskForLogoutAgain") {
    return null;
  }

  return await commitSession("dontAskForLogoutAgain", {
    request,
    data: "true",
  });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const transition = useTransition();

  const user = data?.user;
  const dontAskAgain = data?.dontAskAgain;

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <div>
          <MobileSidebar
            open={sidebarOpen}
            setOpen={setSidebarOpen}
            user={user}
          />

          {/* Static sidebar for desktop */}
          <DesktopSidebar  user={user} />

          <div className="flex flex-1 flex-col md:pl-64">
            <div className="sticky top-0 z-10 bg-white pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
              <button
                type="button"
                className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {!user ? (
              <div className="grid h-[100vh] place-items-center">
                <Form action="/auth/spotify" method="post">
                  <AuthButton
                    isIdle={transition.state === "idle"}
                    isSubmitting={transition.state === "submitting"}
                  >
                    Login with Spotify
                  </AuthButton>
                </Form>
              </div>
            ) : (
              <>
                <RefreshTimer dontAskAgain={dontAskAgain} />
                <Outlet />
              </>
            )}
          </div>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

function RefreshTimer({ dontAskAgain }: { dontAskAgain: "true" | undefined }) {
  const [status, setStatus] = useState<"idle" | "show-modal">("idle");

  const location = useLocation();
  const fetcher = useFetcher();

  // const refreshTime = 5000;
  // const modalTime = 2000;

  // FIX: refreshing not working well
  // FIX: should account for actual spotify refresh token time

  const refreshTime = 1000 * 60 * 60;
  const modalTime = refreshTime - 1000 * 60 * 2;

  const modalTimer = useRef<ReturnType<typeof setTimeout>>();
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();

  const logout = () => {
    setStatus("idle");
    fetcher.submit(
      { redirectTo: location.pathname },
      { method: "post", action: "/logout" }
    );
  };

  const refresh = useCallback(() => {
    fetcher.submit(
      { redirectTo: location.pathname },
      { method: "post", action: "/resources/refresh-spotify-token" }
    );
  }, [fetcher, location.pathname]);

  const cleanupTimers = useCallback(() => {
    // @ts-ignore
    clearTimeout(modalTimer.current);
    // @ts-ignore
    clearTimeout(refreshTimer.current);
  }, []);

  // const startedAt = useRef(new Date().getTime());

  const resetTimers = useCallback(() => {
    cleanupTimers();
    modalTimer.current = setTimeout(() => {
      if (!dontAskAgain) {
        setStatus("show-modal");
      }
    }, modalTime);

    refreshTimer.current = setTimeout(() => {
      refresh();
    }, refreshTime);
  }, [cleanupTimers, refresh, refreshTime, modalTime, dontAskAgain]);

  useEffect(() => resetTimers(), [resetTimers, location.key]);
  useEffect(() => cleanupTimers, [cleanupTimers]);

  function closeModal() {
    setStatus("idle");
    resetTimers();
  }

  const openDialog = status === "show-modal";
  return (
    <DialogModal
      key={status}
      buttonSection={
        <ButtonSection>
          <button onClick={closeModal}>Cancel</button>
          <button onClick={logout}>Logout</button>
        </ButtonSection>
      }
      initialOpen={openDialog}
    >
      {/* FIX: design better modal */}
      <Form method="post">
        <button
          onClick={() => setStatus("idle")}
          name="intent"
          value="dontAskForLogoutAgain"
        >
          Don't ask for logout again
        </button>
      </Form>
    </DialogModal>
  );
}

function ButtonSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
      {children}
    </div>
  );
}
