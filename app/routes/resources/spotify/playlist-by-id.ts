import { LoaderArgs } from "@remix-run/server-runtime";

export function loader({ request }: LoaderArgs) {
  return json();
}
