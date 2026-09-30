import { and, asc, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

export type CardInput = {
  deck: "el" | "ella";
  text: string;
  minSeconds: number | null;
  maxSeconds: number | null;
};

export async function listCards(userId: number) {
  return getDb()
    .select()
    .from(schema.cards)
    .where(eq(schema.cards.userId, userId))
    .orderBy(asc(schema.cards.createdAt));
}

export async function createCard(userId: number, input: CardInput) {
  await getDb().insert(schema.cards).values({ ...input, userId });
}

export async function updateCard(
  userId: number,
  input: CardInput & { id: number },
) {
  const { id, ...values } = input;
  await getDb()
    .update(schema.cards)
    .set(values)
    .where(and(eq(schema.cards.id, id), eq(schema.cards.userId, userId)));
}

export async function deleteCard(userId: number, id: number) {
  await getDb()
    .delete(schema.cards)
    .where(and(eq(schema.cards.id, id), eq(schema.cards.userId, userId)));
}
