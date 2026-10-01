import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const url = process.env.DATABASE_URL ?? "file:./db.sqlite";
    const client = createClient({ url });
    instance = drizzle(client, { schema: fullSchema });
  }
  return instance;
}
