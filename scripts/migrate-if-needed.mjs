import { spawnSync } from "node:child_process";

if (process.env.SKIP_DB_MIGRATE === "1") {
  console.log("SKIP_DB_MIGRATE=1 — skipping prisma migrate deploy");
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
