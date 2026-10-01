// Mock de tRPC para preview estática (sin backend)
// Intercepta todas las llamadas a /api/trpc y responde con datos locales

import { DEMO_USER, DEMO_CARDS, setDemoCards } from "./demoData";

let nextId = 100;

function trpcResult(data: unknown) {
  return { result: { data: { json: data }, type: "data" } };
}

function singleResult(data: unknown) {
  return { result: { data: { json: data }, type: "data" } };
}

function handleBatch(url: string): unknown[] {
  const path = new URL(url, "http://localhost").pathname.replace("/api/trpc/", "");
  const procedures = path.split(",");

  return procedures.map((proc) => {
    if (proc === "auth.me") return trpcResult(DEMO_USER);
    if (proc === "devAuth.autoLogin") return trpcResult({ user: DEMO_USER });
    if (proc === "cards.list") return trpcResult(DEMO_CARDS);
    return trpcResult(null);
  });
}

export function installDemoFetch() {
  const origFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/api/trpc")) {
      // Mutations (POST) — devuelven resultado simple, no array
      if (init?.method === "POST" || init?.body) {
        try {
          const body = JSON.parse(init.body as string);
          const path = new URL(url, "http://localhost").pathname.replace("/api/trpc/", "");

          // Create card
          if (path === "cards.create") {
            const card = body.json;
            const newCard = {
              id: nextId++,
              userId: 1,
              ...card,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setDemoCards([...DEMO_CARDS, newCard]);
            return new Response(JSON.stringify(singleResult(newCard)), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }

          // Update card
          if (path === "cards.update") {
            const { id, ...updates } = body.json;
            setDemoCards(DEMO_CARDS.map((c) =>
              c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
            ));
            return new Response(JSON.stringify(singleResult({ success: true })), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }

          // Delete card
          if (path === "cards.delete") {
            const { id } = body.json;
            setDemoCards(DEMO_CARDS.filter((c) => c.id !== id));
            return new Response(JSON.stringify(singleResult({ success: true })), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }

          // Auto login
          if (path === "devAuth.autoLogin") {
            return new Response(JSON.stringify(singleResult({ user: DEMO_USER })), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
        } catch { /* ignore parse errors */ }
      }

      // Queries (GET) — devuelven array para batching
      const results = handleBatch(url);
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return origFetch(input, init);
  };
}
