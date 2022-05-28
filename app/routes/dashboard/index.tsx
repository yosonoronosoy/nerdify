import { useLocation } from "@remix-run/react";

export default function Dashboard() {
  const location = useLocation();
  return (
    <div className="text-red-500">
      <h1>NOT IMPLEMENTED [{location.pathname}/index.tsx]</h1>
    </div>
  );
}
