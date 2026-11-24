import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts: the React Router plugin only works for the dev server/build, not for tests.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
