import { CLIENT_OPTIONS, DEFAULT_CLIENTS, normalizeClients, type ClientId } from "@crossone/template-default";
import { createInterface } from "node:readline/promises";
import { usage } from "./init";

export function parseClientSelection(value: string): ClientId[] {
  const input = value.trim();
  if (!input) return [...DEFAULT_CLIENTS];
  if (input === "all" || input === "a") return CLIENT_OPTIONS.map((client) => client.id);
  if (input === "none" || input === "0") return [];
  const identifiers = input.split(",").map((item) => {
    const token = item.trim();
    if (/^\d+$/.test(token)) {
      const client = CLIENT_OPTIONS[Number(token) - 1];
      if (!client) throw new Error(`Invalid client number: ${token}`);
      return client.id;
    }
    return token;
  });
  return normalizeClients(identifiers);
}

export type InitArguments =
  | Readonly<{ ok: true; directory: string; clients?: readonly ClientId[]; yes: boolean }>
  | Readonly<{ ok: false; message: string }>;

export function parseInitArguments(args: readonly string[]): InitArguments {
  let directory: string | undefined;
  let clients: ClientId[] | undefined;
  let yes = false;
  try {
    for (let index = 0; index < args.length; index += 1) {
      const argument = args[index]!;
      if (argument === "--yes" || argument === "-y") {
        yes = true;
      } else if (argument === "--clients" || argument.startsWith("--clients=")) {
        if (clients !== undefined) return { ok: false, message: usage };
        const value = argument === "--clients" ? args[++index] : argument.slice("--clients=".length);
        if (!value?.trim() || value.startsWith("--")) return { ok: false, message: usage };
        clients = parseClientSelection(value);
      } else if (argument.startsWith("-") || directory !== undefined) {
        return { ok: false, message: usage };
      } else {
        directory = argument;
      }
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : usage };
  }
  if (!directory?.trim()) return { ok: false, message: usage };
  return { ok: true, directory, ...(clients === undefined ? {} : { clients }), yes };
}

export async function promptClients(): Promise<ClientId[]> {
  console.log("选择客户端 / Select clients (可多选 / multiple choices):");
  for (const [index, client] of CLIENT_OPTIONS.entries()) {
    console.log(`  ${index + 1}. ${client.id} — ${client.label}`);
  }
  console.log("输入编号或名称，以逗号分隔；all 全选，none 仅后端。回车默认 1,2。");
  console.log("Enter comma-separated numbers or names; all selects every client, none selects API only. Enter defaults to 1,2.");
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const controller = new AbortController();
  terminal.once("close", () => controller.abort());
  try {
    while (true) {
      const answer = await terminal.question("Clients [1,2]: ", { signal: controller.signal });
      try {
        return parseClientSelection(answer);
      } catch (error) {
        console.error(error instanceof Error ? error.message : "Invalid client selection");
      }
    }
  } finally {
    terminal.close();
  }
}
