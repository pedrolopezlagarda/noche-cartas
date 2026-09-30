// Mock para preview estático: simula respuestas de tRPC sin backend.
// Se carga condicionalmente en main.tsx cuando VITE_DEMO_MODE está activo.

const demoCards = [
  {
    id: 1,
    deck: "el",
    text: "Dale un masaje en los hombros durante 2 minutos.",
    minSeconds: 60,
    maxSeconds: 180,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    deck: "el",
    text: "Cuéntale un secreto que nunca le hayas contado.",
    minSeconds: null,
    maxSeconds: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    deck: "ella",
    text: "Bésale el cuello muy despacio.",
    minSeconds: 30,
    maxSeconds: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    deck: "ella",
    text: "Prepara una copa de vino y brindad juntos.",
    minSeconds: null,
    maxSeconds: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    deck: "el",
    text: "Acaricia su espalda con los ojos vendados.",
    minSeconds: 45,
    maxSeconds: 90,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    deck: "ella",
    text: "Susurra algo íntimo al oído.",
    minSeconds: 20,
    maxSeconds: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const demoUser = {
  id: 1,
  unionId: "demo",
  name: "Pareja 1",
  email: "demo@kimi.com",
  avatar: null,
  role: "user",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastSignInAt: new Date().toISOString(),
};

function trpcResult(data: unknown) {
  return { result: { data, type: "data" } };
}

function handleTrpcBatch(url: string): unknown[] {
  const path = new URL(url, "http://localhost").pathname.replace(
    "/api/trpc/", "");
  const procedures = path.split(",");
  return procedures.map((proc) => {
    switch (proc) {
      case "auth.me":
        return trpcResult(demoUser);
      case "cards.list":
        return trpcResult(demoCards);
      default:
        return trpcResult(null);
    }
  });
}

export function installDemoFetch() {
  const orig = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/api/trpc")) {
      const results = handleTrpcBatch(url);
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "content-type": "application/json" },
      }) as Response;
    }
    return orig(input, init);
  };
}
