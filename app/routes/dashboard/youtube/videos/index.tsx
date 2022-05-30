import { useLocation } from "@remix-run/react";

export default function Videos() {
  const location = useLocation();
  return (
    <div className="mt-16">
      <h1 className="text-red-500">NOT IMPLEMENTED: {location.pathname} </h1>
    </div>
  );
}
