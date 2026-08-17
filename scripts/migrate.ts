// Applies src/db/schema.sql against DATABASE_URL.
// Usage: npx dotenv -e .env.local -- npx tsx scripts/migrate.ts

import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set. Add it to .env.local first (see .env.local.example).");
    process.exit(1);
  }

  const sql = postgres(connectionString, { ssl: "require", max: 1 });
  const schema = readFileSync(join(process.cwd(), "src/db/schema.sql"), "utf8");

  console.log("Applying src/db/schema.sql...");
  await sql.unsafe(schema);
  console.log("Schema applied.");

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
