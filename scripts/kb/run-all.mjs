import { spawnSync } from "node:child_process";

const commands = [
  ["npm", ["run", "kb:crawl"]],
  ["npm", ["run", "kb:diff"]],
  ["npm", ["run", "kb:update"]],
  ["npm", ["run", "kb:report"]],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log("KB workflow complete.");
