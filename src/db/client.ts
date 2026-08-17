import postgres from "postgres";

// Lazy singleton — avoids crashing `next build` when DATABASE_URL isn't set yet
// (e.g. before the CockroachDB connection string is configured).
let _sql: postgres.Sql | null = null;

export function getDb(): postgres.Sql {
  if (_sql) return _sql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your CockroachDB connection string to .env.local (see .env.local.example)."
    );
  }

  _sql = postgres(connectionString, {
    ssl: "require",
    // CockroachDB serverless idles connections aggressively; keep the pool small
    // and let it reconnect rather than holding stale sockets open.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return _sql;
}
