import { useState, useCallback, useEffect } from "react";

export type DemoCard = {
  id: number;
  userId: number;
  deck: "el" | "ella";
  text: string;
  minSeconds: number | null;
  maxSeconds: number | null;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "noche_cartas_demo_cards";
const STORAGE_ID_KEY = "noche_cartas_demo_next_id";

function loadCards(): DemoCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveCards(cards: DemoCard[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch { /* ignore */ }
}

function loadNextId(): number {
  try {
    const raw = localStorage.getItem(STORAGE_ID_KEY);
    if (raw) return parseInt(raw, 10);
  } catch { /* ignore */ }
  return 100;
}

function saveNextId(id: number) {
  try {
    localStorage.setItem(STORAGE_ID_KEY, String(id));
  } catch { /* ignore */ }
}

export function useDemoCards() {
  const [cards, setCards] = useState<DemoCard[]>(loadCards);
  const [nextId, setNextId] = useState<number>(loadNextId);

  // Persistir en localStorage cada vez que cambien las cartas
  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  useEffect(() => {
    saveNextId(nextId);
  }, [nextId]);

  const create = useCallback((card: Omit<DemoCard, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newCard: DemoCard = {
      ...card,
      id: nextId,
      userId: 1,
      createdAt: now,
      updatedAt: now,
    };
    setCards((prev) => [...prev, newCard]);
    setNextId((id) => id + 1);
    return newCard;
  }, [nextId]);

  const update = useCallback((id: number, updates: Partial<Omit<DemoCard, "id" | "userId" | "createdAt">>) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const remove = useCallback((id: number) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const list = useCallback((deck?: "el" | "ella") => {
    return deck ? cards.filter((c) => c.deck === deck) : cards;
  }, [cards]);

  return { cards, create, update, remove, list };
}
