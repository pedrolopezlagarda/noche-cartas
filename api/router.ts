import { authRouter } from "./auth-router";
import { cardsRouter } from "./cards-router";
import { roomRouter } from "./room-router";
import { devAuthRouter } from "./dev-auth-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  devAuth: devAuthRouter,
  cards: cardsRouter,
  room: roomRouter,
});

export type AppRouter = typeof appRouter;
