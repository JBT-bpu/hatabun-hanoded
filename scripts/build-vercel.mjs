import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const vinextCli = resolve("node_modules/vinext/dist/cli.js");
const result = spawnSync(process.execPath, [vinextCli, "build"], {
  env: { ...process.env, VERCEL: "1" },
  stdio: "inherit",
});

process.exit(result.status ?? 1);
