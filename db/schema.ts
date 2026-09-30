import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const cards = mysqlTable("cards", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // "el" = acciones que realiza Él | "ella" = acciones que realiza Ella
  deck: mysqlEnum("deck", ["el", "ella"]).notNull(),
  text: text("text").notNull(),
  // Rango opcional de duración (segundos). null = usar el rango por defecto de la partida.
  minSeconds: int("minSeconds"),
  maxSeconds: int("maxSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;

// ---------- Salas para jugar en dos móviles ----------

export const rooms = mysqlTable("rooms", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  status: mysqlEnum("status", ["lobby", "playing", "finished"])
    .default("lobby")
    .notNull(),
  activeRole: mysqlEnum("activeRole", ["el", "ella"]),
  extraPlays: int("extraPlays").default(0).notNull(),
  // JSON: { kind:"action", text, executor, timerEnd } | null
  currentCard: text("currentCard"),
  defMin: int("defMin").default(10).notNull(),
  defMax: int("defMax").default(300).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Room = typeof rooms.$inferSelect;

export const roomPlayers = mysqlTable("room_players", {
  id: serial("id").primaryKey(),
  roomId: bigint("roomId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["el", "ella"]).notNull(),
  // JSON arrays de cartas (secreto: solo se devuelve al propietario)
  hand: text("hand").notNull(),
  pile: text("pile").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type RoomPlayer = typeof roomPlayers.$inferSelect;

// TODO: Add your tables here. See docs/Database.md for schema examples and patterns.
//
// Example:
// export const posts = mysqlTable("posts", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });
//
// Note: FK columns referencing a serial() PK must use:
//   bigint("columnName", { mode: "number", unsigned: true }).notNull()
