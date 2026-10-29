import { Platform } from "transone/platform";
import { defineConfig } from "transone-cli";
import { devPorts } from "@crossone-app/config";

export default defineConfig({
  entry: "src/index.ts",
  target: Platform.WebMobile,
  server: {
    host: "127.0.0.1",
    port: Number(process.env.CLIENT_WEB_PHONE_PORT ?? devPorts["client-web-phone"]),
    proxy: {
      "/api": {
        target: process.env.API_URL ?? "http://127.0.0.1:" + devPorts.api,
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist/web" },
});
