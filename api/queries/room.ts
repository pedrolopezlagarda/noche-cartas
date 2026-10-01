import { asc, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import { getDb } from "./connection";

export type Role = "el" | "ella";

export type ServerCard =
  | {
      kind: "action";
      uid: string;
      id: number;
      deck: Role;
      text: string;
      minSeconds: number | null;
      maxSeconds: number | null;
    }
  | { kind: "special"; uid: string; effect: "roba2" | "doble" | "cambia" };

export type CurrentCard = {
  kind: "action";
  text: string;
  executor: Role;
  timerEnd: number;
};

const SPECIAL_UIDS: { uid: string; effect: "roba2" | "doble" | "cambia" }[] = [
  { uid: "sp-roba2", effect: "roba2" },
  { uid: "sp-doble", effect: "doble" },
  { uid: "sp-cambia", effect: "cambia" },
];

const HAND_SIZE = 3;
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const other = (p: Role): Role => (p === "el" ? "ella" : "el");

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export const parseCards = (s: string): ServerCard[] => JSON.parse(s) as ServerCard[];
const parseCurrent = (s: string | null): CurrentCard | null =>
  s ? (JSON.parse(s) as CurrentCard) : null;

function buildPile(deckCards: schema.Card[]): ServerCard[] {
  const actions: ServerCard[] = deckCards.map((c) => ({
    kind: "action",
    uid: `a-${c.id}`,
    id: c.id,
    deck: c.deck,
    text: c.text,
    minSeconds: c.minSeconds,
    maxSeconds: c.maxSeconds,
  }));
  const specials: ServerCard[] = SPECIAL_UIDS.map((s) => ({
    kind: "special",
    uid: s.uid,
    effect: s.effect,
  }));
  return shuffle([...actions, ...specials]);
}

function drawTo(hand: ServerCard[], pile: ServerCard[]) {
  const needed = Math.max(0, HAND_SIZE - hand.length);
  return {
    hand: [...hand, ...pile.slice(0, needed)],
    pile: pile.slice(needed),
  };
}

export async function getRoomByCode(code: string) {
  const rows = await getDb()
    .select()
    .from(schema.rooms)
    .where(eq(schema.rooms.code, code.toUpperCase()))
    .limit(1);
  return rows.at(0);
}

export async function getPlayers(roomId: number) {
  return getDb()
    .select()
    .from(schema.roomPlayers)
    .where(eq(schema.roomPlayers.roomId, roomId))
    .orderBy(asc(schema.roomPlayers.id));
}

async function savePlayer(player: schema.RoomPlayer, hand: ServerCard[], pile: ServerCard[]) {
  await getDb()
    .update(schema.roomPlayers)
    .set({ hand: JSON.stringify(hand), pile: JSON.stringify(pile) })
    .where(eq(schema.roomPlayers.id, player.id));
}

async function dealRoles(creatorId: number) {
  const cards = await getDb()
    .select()
    .from(schema.cards)
    .where(eq(schema.cards.userId, creatorId));
  const piles: Record<Role, ServerCard[]> = {
    el: buildPile(cards.filter((c) => c.deck === "el")),
    ella: buildPile(cards.filter((c) => c.deck === "ella")),
  };
  const hands: Record<Role, ServerCard[]> = { el: [], ella: [] };
  (Object.keys(piles) as Role[]).forEach((r) => {
    const d = drawTo([], piles[r]);
    hands[r] = d.hand;
    piles[r] = d.pile;
  });
  return { hands, piles };
}

export async function createRoom(
  userId: number,
  role: Role,
  defMin: number,
  defMax: number,
) {
  const { hands, piles } = await dealRoles(userId);
  const code = makeCode();
  const inserted = await getDb()
    .insert(schema.rooms)
    .values({ code, status: "lobby", defMin, defMax })
    .returning({ id: schema.rooms.id });
  const roomId = inserted[0].id;
  await getDb().insert(schema.roomPlayers).values({
    roomId,
    userId,
    role,
    hand: JSON.stringify(hands[role]),
    pile: JSON.stringify(piles[role]),
  });
  // El otro rol queda también preparado con las cartas del creador
  const otherRole = other(role);
  await getDb().insert(schema.roomPlayers).values({
    roomId,
    userId,
    role: otherRole,
    hand: JSON.stringify([]),
    pile: JSON.stringify(piles[otherRole]),
  });
  return { code };
}

export async function joinRoom(userId: number, code: string) {
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Sala no encontrada");
  if (room.status !== "lobby") throw new Error("La partida ya ha empezado");
  const players = await getPlayers(room.id);
  const creatorId = players[0]?.userId;
  const mine = players.find(
    (p) => p.userId === userId && p.userId !== creatorId,
  );
  if (!mine && players.some((p) => p.userId === userId && p.id !== players[0].id)) {
    // El creador vuelve a entrar a su propia sala con el mismo rol
    return { code: room.code, role: players[0].role };
  }
  if (mine) return { code: room.code, role: mine.role }; // ya estaba dentro
  // El hueco libre es la fila extra que el creador ocupa provisionalmente
  const placeholder = players.find(
    (p) => p.id !== players[0].id && p.userId === creatorId,
  );
  if (!placeholder) throw new Error("La sala está completa");
  await getDb()
    .update(schema.roomPlayers)
    .set({ userId })
    .where(eq(schema.roomPlayers.id, placeholder.id));
  return { code: room.code, role: placeholder.role };
}

export async function getRoomState(userId: number, code: string) {
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Sala no encontrada");
  const players = await getPlayers(room.id);
  const me = players.find((p) => p.userId === userId);
  if (!me) throw new Error("No estás en esta sala");
  const creatorId = players[0]?.userId;
  const partner = players.some((p) => p.userId !== creatorId);
  return {
    code: room.code,
    status: room.status,
    activeRole: room.activeRole,
    extraPlays: room.extraPlays,
    currentCard: parseCurrent(room.currentCard),
    defMin: room.defMin,
    defMax: room.defMax,
    myRole: me.role,
    myHand: parseCards(me.hand),
    partnerHere: partner,
    isCreator: creatorId === userId,
    now: Date.now(),
  };
}

// Avanza el turno tras jugar una carta (acción o especial).
async function endPlay(
  room: schema.Room,
  players: schema.RoomPlayer[],
  playedDoble: boolean,
) {
  let extra = room.extraPlays;
  let next: Role;
  if (playedDoble) {
    extra = 2;
    next = room.activeRole as Role;
  } else if (extra > 0) {
    extra -= 1;
    next = extra > 0 ? (room.activeRole as Role) : other(room.activeRole as Role);
  } else {
    next = other(room.activeRole as Role);
  }
  let status: "playing" | "finished" = "playing";
  const current = players.find((p) => p.role === room.activeRole);
  const nextPlayer = players.find((p) => p.role === next);
  if (
    (current && parseCards(current.hand).length === 0) ||
    (nextPlayer && parseCards(nextPlayer.hand).length === 0)
  ) {
    status = "finished";
  }
  await getDb()
    .update(schema.rooms)
    .set({ activeRole: next, extraPlays: extra, status })
    .where(eq(schema.rooms.id, room.id));
}

export async function startRoom(userId: number, code: string) {
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Sala no encontrada");
  const players = await getPlayers(room.id);
  if (players[0]?.userId !== userId) throw new Error("Solo quien creó la sala puede empezar");
  const partner = players.find((p) => p.id !== players[0].id);
  if (!partner || partner.userId === players[0].userId)
    throw new Error("Falta tu pareja");
  await getDb()
    .update(schema.rooms)
    .set({
      status: "playing",
      activeRole: Math.random() < 0.5 ? "el" : "ella",
      extraPlays: 0,
      currentCard: null,
    })
    .where(eq(schema.rooms.id, room.id));
}

export async function playRoomCard(userId: number, code: string, uid: string) {
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Sala no encontrada");
  if (room.status !== "playing") throw new Error("La partida no está en marcha");
  if (room.currentCard) throw new Error("Ya hay una carta en juego");
  const players = await getPlayers(room.id);
  const me = players.find((p) => p.userId === userId);
  if (!me || me.role !== room.activeRole) throw new Error("No es tu turno");
  const hand = parseCards(me.hand);
  const pile = parseCards(me.pile);
  const card = hand.find((c) => c.uid === uid);
  if (!card) throw new Error("Carta no encontrada en tu mano");

  if (card.kind === "action") {
    const lo = card.minSeconds ?? room.defMin;
    const hi = Math.max(lo, card.maxSeconds ?? room.defMax);
    const secs = Math.floor(lo + Math.random() * (hi - lo + 1));
    await savePlayer(me, hand.filter((c) => c.uid !== card.uid), pile);
    const current: CurrentCard = {
      kind: "action",
      text: card.text,
      executor: other(me.role),
      timerEnd: Date.now() + secs * 1000,
    };
    await getDb()
      .update(schema.rooms)
      .set({ currentCard: JSON.stringify(current) })
      .where(eq(schema.rooms.id, room.id));
    return { ok: true as const };
  }

  // ---- carta especial: efecto inmediato, sin tiempo ----
  let h = hand.filter((c) => c.uid !== card.uid);
  let p = pile;
  if (card.effect === "roba2") {
    h = [...h, ...p.slice(0, 2)];
    p = p.slice(2);
  } else if (card.effect === "cambia") {
    const r = drawTo([], shuffle([...p, ...h]));
    h = r.hand;
    p = r.pile;
  }
  if (p.length > 0) p = [...p, card];
  const refilled = drawTo(h, p);
  await savePlayer(me, refilled.hand, refilled.pile);
  await endPlay(room, players, card.effect === "doble");
  return { ok: true as const };
}

export async function finishRoomCard(userId: number, code: string) {
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Sala no encontrada");
  if (!room.currentCard) return { ok: true as const }; // idempotente
  const players = await getPlayers(room.id);
  if (!players.some((p) => p.userId === userId)) throw new Error("No estás en esta sala");
  const active = players.find((p) => p.role === room.activeRole);
  if (active) {
    const drawn = drawTo(parseCards(active.hand), parseCards(active.pile));
    await savePlayer(active, drawn.hand, drawn.pile);
  }
  await getDb()
    .update(schema.rooms)
    .set({ currentCard: null })
    .where(eq(schema.rooms.id, room.id));
  await endPlay(room, players, false);
  return { ok: true as const };
}

export async function restartRoom(userId: number, code: string) {
  const room = await getRoomByCode(code);
  if (!room) throw new Error("Sala no encontrada");
  const players = await getPlayers(room.id);
  if (!players.some((p) => p.userId === userId)) throw new Error("No estás en esta sala");
  const creatorId = players[0].userId;
  const { hands, piles } = await dealRoles(creatorId);
  for (const p of players) {
    await savePlayer(p, hands[p.role], piles[p.role]);
  }
  await getDb()
    .update(schema.rooms)
    .set({
      status: "playing",
      activeRole: Math.random() < 0.5 ? "el" : "ella",
      extraPlays: 0,
      currentCard: null,
    })
    .where(eq(schema.rooms.id, room.id));
}

export async function leaveRoom(userId: number, code: string) {
  const room = await getRoomByCode(code);
  if (!room) return;
  const players = await getPlayers(room.id);
  const creatorId = players[0]?.userId;
  const me = players.find((p) => p.userId === userId);
  if (!me) return;
  // Liberar el hueco si aún estamos en el lobby; si no, terminar la partida
  if (room.status === "lobby") {
    const remaining = players.filter((p) => p.userId !== userId);
    if (remaining.length === 0) {
      await getDb().delete(schema.rooms).where(eq(schema.rooms.id, room.id));
      return;
    }
    if (me.id === players[0].id) {
      // El creador sale: la pareja pasa a ser la dueña de la sala
      await getDb().delete(schema.roomPlayers).where(eq(schema.roomPlayers.id, me.id));
    } else {
      await getDb()
        .update(schema.roomPlayers)
        .set({ userId: creatorId, hand: "[]" })
        .where(eq(schema.roomPlayers.id, me.id));
    }
  } else {
    const remaining = players.filter((p) => p.userId !== userId);
    if (remaining.length === 0) {
      await getDb().delete(schema.rooms).where(eq(schema.rooms.id, room.id));
      return;
    }
    await getDb()
      .update(schema.rooms)
      .set({ status: "finished" })
      .where(eq(schema.rooms.id, room.id));
  }
}
