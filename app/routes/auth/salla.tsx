import type { Route } from "./+types/salla";
import { redirect } from "react-router";
import { getMerchantId, destroySession, getSession } from "~/lib/session.server";
import { db } from "~/lib/db.server";

// Salla OAuth initiation - redirects to Salla authorization
export async function loader({ request }: Route.LoaderArgs) {
  // Check if user is already logged in with a valid session
  const existingMerchantId = await getMerchantId(request);

  if (existingMerchantId) {
    // Verify merchant exists and is active
    const merchant = await db.merchant.findUnique({
      where: { id: existingMerchantId },
      select: { id: true, status: true },
    });

    if (merchant && merchant.status === "ACTIVE") {
      console.log(`[Auth] User ${existingMerchantId} already logged in, redirecting to dashboard`);
      return redirect("/dashboard");
    }

    // Merchant not found or expired - clear invalid session
    console.log(`[Auth] Clearing invalid session for merchant ${existingMerchantId}, status: ${merchant?.status}`);
    const session = await getSession(request);
    return redirect("/auth/salla", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }

  console.log("[Auth] No session found, initiating Salla OAuth");

  const clientId = process.env.SALLA_CLIENT_ID;
  const redirectUri = process.env.SALLA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error("Missing Salla OAuth configuration");
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // TODO: Store state in session for verification in callback

  const authUrl = new URL("https://accounts.salla.sa/oauth2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "offline_access");
  authUrl.searchParams.set("state", state);

  return redirect(authUrl.toString());
}

export default function SallaAuth() {
  // This should never render - loader always redirects
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">جاري التحويل إلى سلة...</p>
    </div>
  );
}
