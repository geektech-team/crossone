import { Platform } from "transone/platform";
import { defineConfig } from "transone-cli";
import { devPorts } from "@crossone-app/config";

export default defineConfig({
  entry: "src/index.ts",
  target: Platform.MiniprogramXiaohongshu,
  server: {
    host: "127.0.0.1",
    port: Number(process.env.CLIENT_MINI_XIAOHONGSHU_PORT ?? devPorts["client-mini-xiaohongshu"]),
    proxy: {
      "/api": {
        target: process.env.API_URL ?? "http://127.0.0.1:" + devPorts.api,
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist/web" },
  mp: { host: process.env.API_URL ?? "http://127.0.0.1:" + devPorts.api, navigationBarTitleText: "CrossOne Xiaohongshu", outDir: "dist/mp-xiaohongshu" },
});
