import type { Route } from "./+types/salla.callback";
import { data } from "react-router";
import { Link } from "react-router";
import { db } from "~/lib/db.server";
import { createMerchantSession } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // Handle OAuth error
  if (error) {
    return data({
      error,
      errorDescription: url.searchParams.get("error_description")
    });
  }

  // Missing authorization code
  if (!code) {
    return data({
      error: "missing_code",
      errorDescription: "لم يتم استلام رمز التفويض من سلة"
    });
  }

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await fetch("https://accounts.salla.sa/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.SALLA_CLIENT_ID!,
        client_secret: process.env.SALLA_CLIENT_SECRET!,
        redirect_uri: process.env.SALLA_REDIRECT_URI!,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return data({
        error: "token_exchange_failed",
        errorDescription: "فشل في الحصول على رمز الوصول"
      });
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // 2. Fetch merchant info from Salla
    const merchantResponse = await fetch("https://api.salla.dev/admin/v2/store/info", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });

    if (!merchantResponse.ok) {
      console.error("Failed to fetch merchant info");
      return data({
        error: "merchant_fetch_failed",
        errorDescription: "فشل في جلب بيانات المتجر"
      });
    }

    const merchantData = await merchantResponse.json();
    const store = merchantData.data;

    // 3. Upsert merchant in database
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    const merchant = await db.merchant.upsert({
      where: { sallaId: store.id },
      update: {
        storeName: store.name,
        storeUrl: store.domain,
        email: store.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt,
        plan: store.plan,
        status: "ACTIVE",
        uninstalledAt: null,
      },
      create: {
        sallaId: store.id,
        storeName: store.name,
        storeUrl: store.domain,
        email: store.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt,
        plan: store.plan,
      },
    });

    console.log("Merchant authenticated:", merchant.id, merchant.storeName);

    // 4. Create session and redirect to dashboard
    return createMerchantSession(merchant.id, "/dashboard");

  } catch (err) {
    console.error("OAuth callback error:", err);
    return data({
      error: "unexpected_error",
      errorDescription: "حدث خطأ غير متوقع"
    });
  }
}

export default function SallaCallback({ loaderData }: Route.ComponentProps) {
  if (loaderData?.error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="text-red-500 text-5xl mb-4">⚠</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            فشل التفويض
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {loaderData.errorDescription || "حدث خطأ أثناء الاتصال بسلة"}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            رمز الخطأ: {loaderData.error}
          </p>
          <Link
            to="/auth/salla"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </Link>
        </div>
      </main>
    );
  }

  // Loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">جاري تسجيل الدخول...</p>
    </div>
  );
}
