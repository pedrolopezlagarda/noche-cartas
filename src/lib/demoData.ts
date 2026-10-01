export const DEMO_USER = {
  id: 1,
  unionId: "demo-user",
  name: "Pareja 1",
  email: "demo@noche.local",
  avatar: null,
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

export type DemoCard = {
  id: number;
  userId: number;
  deck: "el" | "ella";
  text: string;
  minSeconds: number | null;
  maxSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export let DEMO_CARDS: DemoCard[] = [];

// Helper para que el mock pueda mutar las cartas
export function setDemoCards(cards: DemoCard[]) {
  DEMO_CARDS = cards;
}
