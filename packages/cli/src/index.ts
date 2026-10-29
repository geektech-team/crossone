#!/usr/bin/env bun
import { runInit, usage } from "./init";
import { DEFAULT_CLIENTS } from "@crossone/template-default";
import { parseInitArguments, promptClients } from "./init-options";
import {
  createRequirement,
  createRequirementUsage,
  validateRequirement,
  validateRequirementUsage,
} from "./requirement";

const [command, subcommand, ...args] = process.argv.slice(2);

if (command === "init") {
  const parsed = parseInitArguments([...(subcommand === undefined ? [] : [subcommand]), ...args]);
  if (!parsed.ok) {
    console.error(parsed.message);
    process.exitCode = 1;
  } else {
    try {
      let clients = parsed.clients;
      if (clients === undefined) {
        if (parsed.yes) clients = DEFAULT_CLIENTS;
        else if (process.stdin.isTTY && process.stdout.isTTY) clients = await promptClients();
        else throw new Error("Non-interactive init requires --clients <list|all|none> or --yes.");
      }
      const result = await runInit(parsed.directory, process.cwd(), { clients });
      if (!result.ok) {
        console.error(result.message);
        process.exitCode = 1;
      } else {
        console.log(`Created CrossOne app at ${result.target}`);
        console.log(`Clients: ${clients.length ? clients.join(", ") : "API only"}`);
        console.log("Next:");
        console.log(`  cd ${result.target}`);
        console.log("  bun install");
        console.log("  bun run dev");
      }
    } catch (error) {
      console.error(error instanceof Error && error.name === "AbortError" ? "Initialization canceled." : error instanceof Error ? error.message : "Unable to initialize project.");
      process.exitCode = 1;
    }
  }
} else if (command === "requirement" && subcommand === "create" && args.length === 1) {
  const result = await createRequirement(args[0]!, process.cwd());
  if (!result.ok) {
    console.error(result.message);
    process.exitCode = 1;
  } else {
    console.log(`Created requirement ${result.slug} at ${result.directory}`);
  }
} else if (command === "requirement" && subcommand === "create") {
  console.error(createRequirementUsage);
  process.exitCode = 1;
} else if (command === "requirement" && subcommand === "validate" && args.length === 1) {
  const result = await validateRequirement(args[0]!, process.cwd());
  if (!result.ok) {
    if (result.issues?.length) {
      for (const issue of result.issues) console.error(`${issue.file}: ${issue.message}`);
    } else {
      console.error(result.message);
    }
    process.exitCode = 1;
  } else {
    console.log(`Requirement ${result.slug} is valid (status: ${result.status})`);
  }
} else if (command === "requirement" && subcommand === "validate") {
  console.error(validateRequirementUsage);
  process.exitCode = 1;
} else {
  console.error(usage);
  process.exitCode = 1;
}
