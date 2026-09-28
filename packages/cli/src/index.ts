#!/usr/bin/env bun
import { runInit, usage } from "./init";
import { createRequirement, createRequirementUsage } from "./requirement";

const [command, subcommand, ...args] = process.argv.slice(2);

if (command === "init") {
  if (args.length > 0) {
    console.error(usage);
    process.exitCode = 1;
  } else {
    const result = await runInit(subcommand, process.cwd());
    if (!result.ok) {
      console.error(result.message);
      process.exitCode = 1;
    } else {
      console.log(`Created CrossOne app at ${result.target}`);
      console.log("Next:");
      console.log(`  cd ${result.target}`);
      console.log("  bun install");
      console.log("  bun run dev");
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
} else {
  console.error(usage);
  process.exitCode = 1;
}
