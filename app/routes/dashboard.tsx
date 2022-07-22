import { Form, Outlet, useTransition } from "@remix-run/react";
import { AuthButton } from "~/components/buttons";

export default function Dashboard() {
  const transition = useTransition();

  return (
    <main className="flex-1">
      <div className="py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <Form action="/logout" method="post">
            <AuthButton
              isSubmitting={transition.state === "submitting"}
              isIdle={transition.state === "idle"}
              color="indigo"
              size="sm"
            >
              Logout
            </AuthButton>
          </Form>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          {/* Replace with your content */}
          <Outlet />
        </div>
      </div>
    </main>
  );
}
