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

// Get current merchant ID from session
export async function getMerchantId(request: Request): Promise<string | null> {
  const session = await getSession(request);
  return session.get("merchantId") || null;
}

// Require authentication - redirect to home if not logged in
export async function requireMerchant(request: Request): Promise<string> {
  const merchantId = await getMerchantId(request);
  if (!merchantId) {
    throw redirect("/");
  }
  return merchantId;
}

// Create authenticated session
export async function createMerchantSession(merchantId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("merchantId", merchantId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
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
