import { Platform } from "transone/platform";
import { defineConfig } from "transone-cli";
import { devPorts } from "@crossone-app/config";

export default defineConfig({
  entry: "src/index.ts",
  target: Platform.AppHarmony,
  server: {
    host: "127.0.0.1",
    port: Number(process.env.CLIENT_APP_HARMONY_PORT ?? devPorts["client-app-harmony"]),
    proxy: {
      "/api": {
        target: process.env.API_URL ?? "http://127.0.0.1:" + devPorts.api,
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist/web" },
  app: { host: process.env.API_URL ?? "http://127.0.0.1:" + devPorts.api, appName: "CrossOne Harmony", bundleId: "com.crossone.client.app.harmony", outDir: "dist/app-harmony", pages: { "/": "src/index.ts" } },
});
