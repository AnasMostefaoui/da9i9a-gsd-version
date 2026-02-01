import { createCookieSessionStorage, redirect } from "react-router";

// Session storage configuration
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET || "dev-secret-change-in-production"],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function commitSession(session: Awaited<ReturnType<typeof getSession>>) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(session: Awaited<ReturnType<typeof getSession>>) {
  return sessionStorage.destroySession(session);
}

// Dev bypass - set DEV_BYPASS_AUTH=true in .env to skip OAuth
const DEV_BYPASS_AUTH = process.env.DEV_BYPASS_AUTH === "true";
const DEV_MERCHANT_ID = "dev-merchant-123";

// Get current merchant ID from session
export async function getMerchantId(request: Request): Promise<string | null> {
  if (DEV_BYPASS_AUTH) {
    return DEV_MERCHANT_ID;
  }
  const session = await getSession(request);
  return session.get("merchantId") || null;
}

// Require authentication - redirect to home if not logged in
export async function requireMerchant(request: Request): Promise<string> {
  if (DEV_BYPASS_AUTH) {
    return DEV_MERCHANT_ID;
  }
  const merchantId = await getMerchantId(request);
  if (!merchantId) {
    throw redirect("/");
  }
  return merchantId;
}

// Check if dev bypass is enabled
export function isDevBypass(): boolean {
  return DEV_BYPASS_AUTH;
}

export { DEV_MERCHANT_ID };

// Create authenticated session
export async function createMerchantSession(merchantId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("merchantId", merchantId);
  const cookie = await commitSession(session);
  console.log(`[Session] Created session for merchant ${merchantId}, cookie length: ${cookie.length}`);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}

// Logout
export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
