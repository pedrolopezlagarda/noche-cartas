export const DEMO_CARDS: Array<{
  id: number;
  userId: number;
  deck: "el" | "ella";
  text: string;
  minSeconds: number | null;
  maxSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}> = [];

export const DEMO_USER = {
  id: 1,
  unionId: "demo",
  name: "Pareja 1",
  email: "demo@kimi.com",
  avatar: null,
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};
