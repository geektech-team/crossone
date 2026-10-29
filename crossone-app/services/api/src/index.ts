import { devPorts } from "@crossone-app/config";
import { createApi } from "./app";

const app = createApi();
const port = await app.listen({
  port: Number(process.env.PORT ?? devPorts.api),
  hostname: process.env.HOST ?? "127.0.0.1",
});
console.log("CrossOne API listening on http://" + (process.env.HOST ?? "127.0.0.1") + ":" + port);

async function stop(): Promise<void> {
  await app.close({ timeout: 1000 });
  process.exit(0);
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
