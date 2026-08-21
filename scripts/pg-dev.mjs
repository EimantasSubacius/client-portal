import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import { mkdirSync } from "node:fs";

const dataDir = path.join(process.cwd(), ".pgdata");
mkdirSync(dataDir, { recursive: true });

const port = Number(process.env.PG_PORT || 54329);

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
});

await pg.initialise();
await pg.start();
await pg.createDatabase("client_portal").catch(() => undefined);

console.log(
  `postgresql://postgres:postgres@127.0.0.1:${port}/client_portal`,
);
console.log("Embedded Postgres is running. Keep this process alive.");

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pg.stop();
  process.exit(0);
});

// keep alive
await new Promise(() => undefined);
