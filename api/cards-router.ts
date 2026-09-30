import { z } from "zod";
import { authedQuery, createRouter } from "./middleware";
import {
  createCard,
  deleteCard,
  listCards,
  updateCard,
} from "./queries/cards";

const cardInput = z.object({
  deck: z.enum(["el", "ella"]),
  text: z.string().trim().min(1, "Escribe la acción").max(2000),
  minSeconds: z.number().int().min(0).max(86400).nullable(),
  maxSeconds: z.number().int().min(0).max(86400).nullable(),
});

export const cardsRouter = createRouter({
  list: authedQuery.query(({ ctx }) => listCards(ctx.user.id)),

  create: authedQuery
    .input(cardInput)
    .mutation(({ ctx, input }) => createCard(ctx.user.id, input)),

  update: authedQuery
    .input(cardInput.extend({ id: z.number().int() }))
    .mutation(({ ctx, input }) => updateCard(ctx.user.id, input)),

  delete: authedQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(({ ctx, input }) => deleteCard(ctx.user.id, input.id)),
});
