import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  ActionFunction,
  json,
  LoaderFunction,
} from "@remix-run/server-runtime";
import type { Session } from "remix-auth-spotify";
import {
  Links,
  Link,
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
import { YoutubeIcon } from "~/icons/youtube";
import { RadioIcon } from "~/icons/radio-icon";
import { ClipboardIcon } from "~/icons/clipboard-icon";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import {
  setSessionWithNewAccessToken,
  spotifyStrategy,
} from "~/services/auth.server";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import DiscogsIcon from "./icons/discogs-icon";
import { DialogModal } from "./components/dialog-modal";
import { commitSession, setSessionByKey } from "./services/session.server";
import { Spinner } from "./icons/spinner";
import { AuthButton } from "./components/buttons";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Nerdify",
  viewport: "width=device-width,initial-scale=1",
});

const navigation = [
  { name: "Youtube", href: "youtube", icon: YoutubeIcon },
  { name: "NTS", href: "nts", icon: RadioIcon },
  { name: "Discogs", href: "discogs", icon: DiscogsIcon },
  {
    name: "Copy/Paste",
    href: "copy-paste",
    icon: ClipboardIcon,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export const loader: LoaderFunction = async ({ request }) => {
  const spotifySession = await spotifyStrategy.getSession(request);

  if (!spotifySession) {
    return null;
  }

  const tenMinutesInSeconds = 60 * 10;
  return json(
    {
      ...spotifySession,
    },
    {
      headers: {
        "Cache-Control": `public, max-age=${tenMinutesInSeconds}`,
      },
    }
  );
};

export const action: ActionFunction = async ({ request }) => {
  const intent = (await request.formData()).get("intent");

  if (intent !== "dontAskForLogoutAgain") {
    return null;
  }

  return await commitSession("dontAskForLogoutAgain", {
    request,
    data: "true",
  });
};

type LoaderData = (Session & { dontAskAgain?: "true" }) | null | undefined;

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const data = useLoaderData<LoaderData>();

  const transition = useTransition();

  const user = data?.user;
  const dontAskAgain = data?.dontAskAgain;

  const location = useLocation();

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <div>
          <Transition.Root show={sidebarOpen} as={Fragment}>
            <Dialog
              as="div"
              className="fixed inset-0 z-40 flex md:hidden"
              onClose={setSidebarOpen}
            >
              <Transition.Child
                as={Fragment}
                enter="transition-opacity ease-linear duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity ease-linear duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
              </Transition.Child>
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                      <button
                        type="button"
                        className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="sr-only">Close sidebar</span>
                        <XIcon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </Transition.Child>
                  <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                    <div className="flex flex-shrink-0 items-center px-4">
                      <img
                        className="h-8 w-auto"
                        src="https://tailwindui.com/img/logos/workflow-logo-indigo-600-mark-gray-800-text.svg"
                        alt="Workflow"
                      />
                    </div>
                    <nav className="mt-5 space-y-1 px-2">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={user ? `dashboard/${item.href}` : "/"}
                          className={classNames(
                            location.pathname.includes(item.href)
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                            "group flex items-center rounded-md px-2 py-2 text-base font-medium"
                          )}
                        >
                          <item.icon
                            className={classNames(
                              location.pathname.includes(item.href)
                                ? "text-gray-500"
                                : "text-gray-400 group-hover:text-gray-500",
                              "mr-4 h-6 w-6 flex-shrink-0"
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                  </div>
                  <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
                    {user ? (
                      <a
                        href={`https://open.spotify/user/${user.id}`}
                        className="group block flex-shrink-0"
                      >
                        <div className="flex items-center">
                          <div>
                            <img
                              className="inline-block h-10 w-10 rounded-full"
                              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                              alt=""
                            />
                          </div>
                          <div className="ml-3">
                            <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
                              View profile
                            </p>
                          </div>
                        </div>
                      </a>
                    ) : null}
                  </div>
                </div>
              </Transition.Child>
              <div className="w-14 flex-shrink-0">
                {/* Force sidebar to shrink to fit close icon */}
              </div>
            </Dialog>
          </Transition.Root>

          {/* Static sidebar for desktop */}
          <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
            {/* Sidebar component, swap this element with another sidebar if you like */}
            <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
              <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                <div className="flex flex-shrink-0 items-center px-4">
                  <img
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/workflow-logo-indigo-600-mark-gray-800-text.svg"
                    alt="Workflow"
                  />
                </div>
                <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={user ? `dashboard/${item.href}` : "/"}
                      className={classNames(
                        location.pathname.includes(item.href)
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        "group flex items-center rounded-md px-2 py-2 text-sm font-medium"
                      )}
                    >
                      <item.icon
                        className={classNames(
                          location.pathname.includes(item.href)
                            ? "text-gray-500"
                            : "text-gray-400 group-hover:text-gray-500",
                          "mr-3 h-6 w-6 flex-shrink-0"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              {user ? (
                <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
                  <a
                    href={`https://open.spotify.com/user/${user.id}`}
                    className="group block w-full flex-shrink-0"
                  >
                    <div className="flex items-center">
                      <div>
                        <img
                          className="inline-block h-9 w-9 rounded-full"
                          src={user.image}
                          alt=""
                        />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                          View profile
                        </p>
                      </div>
                    </div>
                  </a>
                </div>
              ) : null}
            </div>
          </div>
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
