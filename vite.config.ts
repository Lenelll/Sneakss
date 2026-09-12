import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

import { sites } from "./build/sites-vite-plugin.ts";

// Optional Cloudflare KV namespace for customer reviews. Create one with
// `npx wrangler kv namespace create REVIEWS_KV` and set REVIEWS_KV_ID.
const reviewsKvId = process.env.REVIEWS_KV_ID?.trim();

export default defineConfig({
  plugins: [
    vinext(),
    sites(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
      config: {
        main: "./worker/index.ts",
        compatibility_flags: ["nodejs_compat"],
        ...(reviewsKvId
          ? { kv_namespaces: [{ binding: "REVIEWS_KV", id: reviewsKvId }] }
          : {}),
      },
    }),
  ],
});
