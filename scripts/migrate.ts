import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as dns from "dns";
import pg from "pg";

// Force Node.js to try IPv6 when IPv4 is not available
dns.setDefaultResultOrder("verbatim");

const { Client } = pg;

const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

async function main() {
  console.log("Connecting to database...");

  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log("Connected!\n");

  console.log("Running migrations...\n");

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    try {
      await client.query(sql);
      console.log(`  OK: ${file}`);
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        console.log(`  SKIP (already exists): ${file}`);
      } else {
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }
  }

  console.log("\nAll migrations completed!");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
