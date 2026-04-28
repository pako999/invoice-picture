import { drizzle } from "drizzle-orm/mysql2";
import { invoices } from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = drizzle(url, { schema: { invoices }, mode: "default" });
  }
  return _db;
}
