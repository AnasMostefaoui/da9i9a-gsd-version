import type { LoaderFunctionArgs } from "react-router";
import { logout } from "~/lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return logout(request);
}
