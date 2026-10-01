import { eq } from "drizzle-orm";
import { setCookie } from "hono/cookie";
import * as schema from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";
import { signSessionToken } from "./kimi/session";
import { getSessionCookieOptions } from "./lib/cookies";
import { Session } from "@contracts/constants";
import { env } from "./lib/env";

let devUserCounter = 0;

export const devAuthRouter = createRouter({
  autoLogin: publicQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    devUserCounter++;
    const unionId = `demo-${Date.now()}-${devUserCounter}`;
    const name = `Pareja ${devUserCounter}`;

    await db.insert(schema.users).values({
      unionId,
      name,
      email: `${unionId}@demo.local`,
      role: "user",
    }).onConflictDoNothing();

    const user = await db.query.users.findFirst({
      where: eq(schema.users.unionId, unionId),
    });

    if (!user) {
      throw new Error("Failed to create demo user");
    }

    const token = await signSessionToken({
      unionId: user.unionId,
      clientId: env.appId || "demo",
    });

    const cookieOpts = getSessionCookieOptions(ctx.req.headers);
    setCookie(ctx.resHeaders as unknown as Parameters<typeof setCookie>[0], Session.cookieName, token, {
      ...cookieOpts,
      maxAge: Session.maxAgeMs / 1000,
    });

    return { user };
  }),
});
