import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../../cli/src/init";
import { CLIENT_OPTIONS, DEFAULT_CLIENTS, selectedClients, clientPortVariable } from "../src/clients";

// Explicit integration check: installs the published dependencies in a disposable project.
const root = await mkdtemp(join(tmpdir(), "crossone-runtime-check-"));
const project = join(root, "app");
const selection = process.argv.includes("--all-clients") ? CLIENT_OPTIONS.map((client) => client.id)
  : process.argv.includes("--api-only") ? [] : DEFAULT_CLIENTS;
const clients = selectedClients({ clients: selection });
const initialized = await runInit("app", root, { clients: selection });
if (!initialized.ok) throw new Error(initialized.message);

function unusedPort(): number {
  const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: () => new Response() });
  const port = server.port;
  server.stop(true);
  if (!port) throw new Error("Unable to allocate a test port");
  return port;
}

const apiPort = unusedPort();
const clientPorts = new Map(clients.map((client) => [client.id, unusedPort()]));
const env: Record<string, string | undefined> = {
  ...process.env,
  PORT: String(apiPort),
  API_URL: `http://127.0.0.1:${apiPort}`,
};
for (const client of clients) env[clientPortVariable(client)] = String(clientPorts.get(client.id));

function spawn(args: string[]) {
  const process = Bun.spawn([Bun.which("bun") ?? "bun", ...args], {
    cwd: project,
    env,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const output = Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]).then((streams) => streams.join("\n"));
  return { process, output };
}

type RunningCommand = ReturnType<typeof spawn>;
const processes = new Set<RunningCommand>();

async function command(args: string[]): Promise<void> {
  const child = spawn(args);
  const [code, output] = await Promise.all([child.process.exited, child.output]);
  if (code !== 0) throw new Error(`${args.join(" ")} exited ${code}\n${output}`);
  console.log(`PASS ${args.join(" ")}`);
}

function start(script: string): RunningCommand {
  const child = spawn(["run", "--no-orphans", script]);
  processes.add(child);
  return child;
}

async function stop(child: RunningCommand): Promise<void> {
  if (child.process.exitCode === null) child.process.kill("SIGTERM");
  await Promise.race([child.process.exited, Bun.sleep(3000)]);
  if (child.process.exitCode === null) child.process.kill("SIGKILL");
  await child.process.exited;
  processes.delete(child);
}

async function ready(child: RunningCommand, url: string): Promise<Response> {
  const deadline = Date.now() + 20_000;
  let error: unknown;
  while (Date.now() < deadline) {
    if (child.process.exitCode !== null) throw new Error(await child.output);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return response;
      error = new Error(`HTTP ${response.status}`);
    } catch (cause) {
      error = cause;
    }
    await Bun.sleep(100);
  }
  throw new Error(`Not ready: ${url}; ${String(error)}`);
}

async function health(child: RunningCommand, port: number): Promise<void> {
  const response = await ready(child, `http://127.0.0.1:${port}/api/health`);
  if (JSON.stringify(await response.json()) !== '{"status":"ok","service":"api"}') {
    throw new Error(`Invalid health response at ${port}`);
  }
}

async function web(child: RunningCommand, port: number, title: string): Promise<void> {
  const html = await (await ready(child, `http://127.0.0.1:${port}/`)).text();
  if (!html.includes(`<title>${title}</title>`)) throw new Error(`Missing Web entry for ${title}`);
  const script = /<script[^>]+src="([^"]+)"/.exec(html)?.[1];
  if (!script || !(await fetch(new URL(script, `http://127.0.0.1:${port}`))).ok) {
    throw new Error(`Missing Web bundle for ${title}`);
  }
  await health(child, port);
}

try {
  await command(["install"]);
  await command(["run", "typecheck"]);
  await command(["test"]);

  // Resolve defaults without --target overrides, so a wrong enum in the generated
  // config cannot be hidden by a correct build script.
  const configuredPlatforms = clients.map(({ id, platform, target }) => ({ id, platform, target }));
  await command(["--eval", `
    import { resolveConfig } from "transone-cli";
    for (const expected of ${JSON.stringify(configuredPlatforms)}) {
      const config = await resolveConfig({ root: "apps/" + expected.id });
      if (config.platform !== expected.platform || config.target !== expected.target) {
        throw new Error("Incorrect configured platform for " + expected.id + ": " + config.platform + " / " + config.target);
      }
    }
  `]);
  console.log(`PASS configured platform enums (${clients.length} clients)`);
  await command(["run", "build"]);

  for (const client of clients) {
    const directory = join(project, "apps", client.id, "dist", client.target);
    if (client.target === "web") {
      const html = await readFile(join(directory, "index.html"), "utf8");
      const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)];
      if (assets.length < 2) throw new Error(`Missing production assets: ${client.id}`);
      const filenames = await readdir(directory);
      for (const asset of assets) {
        if (!filenames.includes(asset[1]!.replace(/^\.?\//, ""))) throw new Error(`Missing asset: ${asset[1]}`);
      }
    } else if (client.target.startsWith("mp-")) {
      const app = JSON.parse(await readFile(join(directory, "app.json"), "utf8"));
      if (!app.pages?.length) throw new Error(`Missing mini-program pages: ${client.id}`);
    } else {
      const extension = client.target === "app-ios" ? ".swift" : client.target === "app-android" ? ".kt" : ".ets";
      const files = await readdir(directory, { recursive: true });
      if (!files.some((file) => file.endsWith(extension))) throw new Error(`Missing native source: ${client.id}`);
    }
  }
  console.log(`PASS selected target artifacts (${clients.length} clients)`);

  const api = start("dev:api");
  await health(api, apiPort);
  const runningClients: RunningCommand[] = [];
  for (const client of clients) {
    const child = start(`dev:${client.id}`);
    runningClients.push(child);
    await web(child, clientPorts.get(client.id)!, client.title);
  }
  await Promise.all([...runningClients.map(stop), stop(api)]);
  console.log("PASS independent dev commands, browser assets, and API proxies");

  const combined = start("dev");
  await health(combined, apiPort);
  for (const client of clients) await web(combined, clientPorts.get(client.id)!, client.title);
  await stop(combined);
  console.log("PASS combined dev command");

  const production = start("start:api");
  await health(production, apiPort);
  await stop(production);
  console.log("PASS bundled API start command");
} finally {
  await Promise.all([...processes].map(stop));
  await rm(root, { recursive: true, force: true });
}
