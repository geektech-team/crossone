import { Platform } from "transone/platform";
import { defineConfig } from "transone-cli";
import { devPorts } from "@crossone-app/config";

export default defineConfig({
  entry: "src/index.ts",
  target: Platform.AppIos,
  server: {
    host: "127.0.0.1",
    port: Number(process.env.CLIENT_APP_IOS_PORT ?? devPorts["client-app-ios"]),
    proxy: {
      "/api": {
        target: process.env.API_URL ?? "http://127.0.0.1:" + devPorts.api,
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist/web" },
  app: { host: process.env.API_URL ?? "http://127.0.0.1:" + devPorts.api, appName: "CrossOne iOS", bundleId: "com.crossone.client.app.ios", outDir: "dist/app-ios", pages: { "/": "src/index.ts" } },
});
