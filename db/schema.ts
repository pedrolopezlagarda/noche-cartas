import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  unionId: text("unionId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  lastSignInAt: integer("lastSignInAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const cards = sqliteTable("cards", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  deck: text("deck", { enum: ["el", "ella"] }).notNull(),
  text: text("text").notNull(),
  minSeconds: integer("minSeconds", { mode: "number" }),
  maxSeconds: integer("maxSeconds", { mode: "number" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;

// ---------- Salas para jugar en dos móviles ----------

export const rooms = sqliteTable("rooms", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  status: text("status", { enum: ["lobby", "playing", "finished"] }).default("lobby").notNull(),
  activeRole: text("activeRole", { enum: ["el", "ella"] }),
  extraPlays: integer("extraPlays", { mode: "number" }).default(0).notNull(),
  currentCard: text("currentCard"),
  defMin: integer("defMin", { mode: "number" }).default(10).notNull(),
  defMax: integer("defMax", { mode: "number" }).default(300).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Room = typeof rooms.$inferSelect;

export const roomPlayers = sqliteTable("room_players", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  roomId: integer("roomId", { mode: "number" }).notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: integer("userId", { mode: "number" }).notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["el", "ella"] }).notNull(),
  hand: text("hand").notNull(),
  pile: text("pile").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type RoomPlayer = typeof roomPlayers.$inferSelect;
