import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Landing page
  index("routes/home.tsx"),

  // Salla OAuth
  route("auth/salla", "routes/auth/salla.tsx"),
  route("auth/salla/callback", "routes/auth/salla.callback.tsx"),
  route("auth/logout", "routes/auth/logout.tsx"),

  // App routes (require auth)
  route("dashboard", "routes/dashboard.tsx"),
  route("import", "routes/import.tsx"),
  route("products/:id", "routes/products.$id.tsx"),

  // Widget endpoint (loaded by Salla stores via App Snippet)
  route("widget", "routes/widget.ts"),

  // API endpoints (for widget to fetch data)
  route("api/landing/:productId", "routes/api.landing.$productId.ts"),
] satisfies RouteConfig;
