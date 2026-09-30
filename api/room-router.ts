import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authedQuery, createRouter } from "./middleware";
import {
  createRoom,
  finishRoomCard,
  getRoomState,
  joinRoom,
  leaveRoom,
  playRoomCard,
  restartRoom,
  startRoom,
} from "./queries/room";

const codeSchema = z.string().trim().min(4).max(8);

async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: e instanceof Error ? e.message : "Error inesperado",
    });
  }
}

export const roomRouter = createRouter({
  get: authedQuery
    .input(z.object({ code: codeSchema }))
    .query(({ ctx, input }) => guard(() => getRoomState(ctx.user.id, input.code))),

  create: authedQuery
    .input(
      z.object({
        role: z.enum(["el", "ella"]),
        defMin: z.number().int().min(0).max(86400),
        defMax: z.number().int().min(0).max(86400),
      }),
    )
    .mutation(({ ctx, input }) =>
      guard(() => createRoom(ctx.user.id, input.role, input.defMin, input.defMax)),
    ),

  join: authedQuery
    .input(z.object({ code: codeSchema }))
    .mutation(({ ctx, input }) => guard(() => joinRoom(ctx.user.id, input.code))),

  start: authedQuery
    .input(z.object({ code: codeSchema }))
    .mutation(({ ctx, input }) => guard(() => startRoom(ctx.user.id, input.code))),

  playCard: authedQuery
    .input(z.object({ code: codeSchema, uid: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      guard(() => playRoomCard(ctx.user.id, input.code, input.uid)),
    ),

  finishCard: authedQuery
    .input(z.object({ code: codeSchema }))
    .mutation(({ ctx, input }) => guard(() => finishRoomCard(ctx.user.id, input.code))),

  restart: authedQuery
    .input(z.object({ code: codeSchema }))
    .mutation(({ ctx, input }) => guard(() => restartRoom(ctx.user.id, input.code))),

  leave: authedQuery
    .input(z.object({ code: codeSchema }))
    .mutation(({ ctx, input }) => guard(() => leaveRoom(ctx.user.id, input.code))),
});
