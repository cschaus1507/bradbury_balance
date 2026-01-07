import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const schemaPath = path.join(__dirname, "..", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  // Ensure pgcrypto (for gen_random_uuid) exists
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
  await pool.query(sql);

  console.log("✅ Database initialized");
  await pool.end();
}

main().catch((e) => {
  console.error("❌ DB init failed:", e);
  process.exit(1);
});
