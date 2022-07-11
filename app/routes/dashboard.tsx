import { Form, Outlet } from "@remix-run/react";

export default function Dashboard() {
  return (
    <main className="flex-1">
      <div className="py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <Form action="/logout" method="post">
            <button className="inline-flex items-center rounded-full border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              Logout
            </button>
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
