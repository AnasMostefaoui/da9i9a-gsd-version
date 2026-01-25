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
] satisfies RouteConfig;
