import { devPorts } from "@crossone-app/config";
import { Application } from "./app";

const hostname = process.env.HOST ?? "127.0.0.1";
const app = new Application({
  port: Number(process.env.PORT ?? devPorts.api),
  hostname,
});
const shutdown = () => {
  void app.stop().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

try {
  const port = await app.start();
  console.log("CrossOne API listening on http://" + hostname + ":" + port);
} catch (error) {
  await app.stop();
  throw error;
}
