import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("results", "routes/results.tsx"),
  route("places/:xid", "routes/details.tsx"),
  route("about", "routes/about.tsx"),
  route("u/:username", "routes/profile.tsx"),
  route("settings", "routes/settings.tsx"),
  route("reset-password", "routes/resetPassword.tsx"),
  route("feed", "routes/feed.tsx"),
  route("scrapbooks", "routes/scrapbooks.tsx"),
  route("scrapbooks/new", "routes/scrapbookEditor.tsx", { id: "scrapbook-new" }),
  route("scrapbooks/:id", "routes/scrapbookEditor.tsx", { id: "scrapbook-edit" }),
] satisfies RouteConfig;
