#!/usr/bin/env bun
import { runInit, usage } from "./init";

const [command, directory, ...extra] = process.argv.slice(2);

if (command !== "init" || extra.length > 0) {
  console.error(usage);
  process.exitCode = 1;
} else {
  const result = await runInit(directory, process.cwd());
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
