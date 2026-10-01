import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPECIAL_BY_UID } from "@/lib/specials";
import { sfx, buzz } from "@/lib/feedback";
import {
  Crown,
  DoorOpen,
  Heart,
  Hourglass,
  KeyRound,
  Play,
  RotateCcw,
  SkipForward,
  Smartphone,
  Sparkles,
  Wifi,
  Zap,
} from "lucide-react";

type Role = "el" | "ella";
type RoomCard =
  | {
      kind: "action";
      uid: string;
      id: number;
      deck: Role;
      text: string;
      minSeconds: number | null;
      maxSeconds: number | null;
    }
  | { kind: "special"; uid: string; effect: string };

type RoomData = {
  code: string;
  status: "lobby" | "playing" | "finished";
  activeRole: Role | null;
  extraPlays: number;
  currentCard: { kind: "action"; text: string; executor: Role; timerEnd: number } | null;
  defMin: number;
  defMax: number;
  myRole: Role;
  myHand: RoomCard[];
  partnerHere: boolean;
  isCreator: boolean;
  now: number;
};

const name = (p: Role) => (p === "el" ? "Él" : "Ella");
const other = (p: Role): Role => (p === "el" ? "ella" : "el");
const IconFor = (p: Role) => (p === "el" ? Crown : Heart);
const accentText = (p: Role) => (p === "el" ? "text-rose-300" : "text-amber-300");
const accentBar = (p: Role) =>
  p === "el" ? "from-rose-500/70" : "from-amber-400/70";

const mmss = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const STORAGE_KEY = "nc-room-code";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function useCountdown(timerEnd: number | null, onDone: () => void) {
  const [left, setLeft] = useState(0);
  const firedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    firedRef.current = false;
    if (!timerEnd) return;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
      setLeft(rem);
      if (rem > 0 && rem <= 5) sfx.tick();
      if (rem <= 0 && !firedRef.current) {
        firedRef.current = true;
        onDoneRef.current();
      }
    };
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [timerEnd]);
  return timerEnd ? left : 0;
}

export default function RoomGame() {
  const { code: urlCode } = useParams<{ code?: string }>();
  const [code, setCode] = useState<string>(() => {
    const fromUrl = urlCode?.trim() ?? "";
    if (fromUrl.length >= 4) return fromUrl.toUpperCase();
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });
  const [joinInput, setJoinInput] = useState(urlCode?.trim() ?? "");
  const [createRole, setCreateRole] = useState<Role>("el");
  const [defMin, setDefMin] = useState("10");
  const [defMax, setDefMax] = useState("300");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const query = trpc.room.get.useQuery(
    { code },
    {
      refetchInterval: 1200,
      enabled: code.length >= 4,
      retry: false,
    },
  );
  const data = query.data as RoomData | undefined;
  const roomError = query.error?.message ?? "";

  const refresh = () => utils.room.get.invalidate({ code });

  const createMutation = trpc.room.create.useMutation({
    onSuccess: (res) => {
      const c = (res as { code: string }).code;
      localStorage.setItem(STORAGE_KEY, c);
      setCode(c);
      setError("");
    },
    onError: (e) => setError(e.message),
  });

  const joinMutation = trpc.room.join.useMutation({
    onSuccess: (res) => {
      const c = (res as { code: string }).code;
      localStorage.setItem(STORAGE_KEY, c);
      setCode(c);
      setError("");
    },
    onError: (e) => setError(e.message),
  });

  const startMutation = trpc.room.start.useMutation({ onSuccess: refresh, onError: (e) => setError(e.message) });
  const playMutation = trpc.room.playCard.useMutation({ onSuccess: refresh, onError: (e) => setError(e.message) });
  const finishMutation = trpc.room.finishCard.useMutation({
    onSuccess: () => {
      sfx.done();
      buzz([60, 40, 70]);
      refresh();
    },
  });
  const restartMutation = trpc.room.restart.useMutation({ onSuccess: refresh });
  const leaveMutation = trpc.room.leave.useMutation({
    onSuccess: () => {
      localStorage.removeItem(STORAGE_KEY);
      setCode("");
      setError("");
    },
  });

  // Cuenta atrás: al llegar a 0, quien lo vea primero termina la carta.
  const finishRef = useRef(finishMutation);
  finishRef.current = finishMutation;
  const secondsLeft = useCountdown(data?.currentCard?.timerEnd ?? null, () => {
    if (code) finishRef.current.mutate({ code });
  });

  // Sonido cuando cae una carta (la tuya o la de tu pareja)
  const prevTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const te = data?.currentCard?.timerEnd ?? null;
    if (te && te !== prevTimerRef.current) {
      sfx.launch();
      buzz(40);
    }
    prevTimerRef.current = te;
  }, [data?.currentCard?.timerEnd]);

  // Sonido cuando empieza tu turno
  const prevTurnMineRef = useRef(false);
  useEffect(() => {
    if (!data || data.status !== "playing" || data.currentCard) {
      prevTurnMineRef.current = false;
      return;
    }
    const mine = data.activeRole === data.myRole;
    if (mine && !prevTurnMineRef.current) {
      sfx.turn();
      buzz(20);
    }
    prevTurnMineRef.current = mine;
  }, [data]);

  const exit = () => {
    if (code) leaveMutation.mutate({ code });
    else {
      localStorage.removeItem(STORAGE_KEY);
      setCode("");
    }
  };

  // ---------- sin sala: crear o unirse ----------
  if (!data) {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div {...fadeUp} className="text-center mb-8">
          <span className="chip mb-4">
            <Wifi className="h-3 w-3" />
            Dos móviles · cada uno con el suyo
          </span>
          <h1 className="font-display text-5xl font-semibold leading-tight">
            Jugaos en <span className="text-gradient-rose italic">dos móviles</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed max-w-md mx-auto">
            Crea una sala, elige tu rol y comparte el código de 4 letras con tu
            pareja. Cada uno verá solo su propia mano en su móvil.
          </p>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.1 }}
          className="card-luxe rounded-2xl p-6 mb-4"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Crear sala · elige tu rol
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {(["el", "ella"] as Role[]).map((r) => {
              const Icon = IconFor(r);
              const selected = createRole === r;
              return (
                <button
                  key={r}
                  onClick={() => setCreateRole(r)}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    selected
                      ? "border-rose-500/60 bg-rose-500/10 glow-rose"
                      : "border-border bg-secondary/40"
                  }`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${accentText(r)}`} />
                  <p className="font-semibold">Soy {name(r)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tu mazo: lo que hará {name(other(r))}
                  </p>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Duración mínima (s)</Label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={defMin}
                onChange={(e) => setDefMin(e.target.value)}
                className="rounded-xl bg-secondary/40 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Duración máxima (s)</Label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={defMax}
                onChange={(e) => setDefMax(e.target.value)}
                className="rounded-xl bg-secondary/40 h-12"
              />
            </div>
          </div>
          <Button
            size="lg"
            className="w-full rounded-full h-13 bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400 hover:from-rose-500 hover:to-orange-300 glow-rose border-0"
            disabled={createMutation.isPending}
            onClick={() =>
              createMutation.mutate({
                role: createRole,
                defMin: parseInt(defMin, 10) || 10,
                defMax: Math.max(parseInt(defMin, 10) || 10, parseInt(defMax, 10) || 300),
              })
            }
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Crear sala
          </Button>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="card-luxe rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-1.5">
            <KeyRound className="h-3 w-3" />
            Unirse con un código
          </p>
          <div className="flex gap-3">
            <Input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              placeholder="CÓDIGO"
              maxLength={4}
              className="rounded-xl bg-secondary/40 h-12 uppercase tracking-[0.3em] text-center text-lg font-semibold"
            />
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-6 shrink-0"
              disabled={joinInput.length !== 4 || joinMutation.isPending}
              onClick={() => joinMutation.mutate({ code: joinInput })}
            >
              Unirse
            </Button>
          </div>
        </motion.div>

        {(error || roomError) && (
          <p className="text-sm text-rose-400 text-center mt-4">
            {error || roomError}
          </p>
        )}
        {code && !data && !query.isLoading && (
          <div className="text-center mt-4">
            <Button variant="ghost" onClick={exit}>
              <DoorOpen className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ---------- lobby ----------
  if (data.status === "lobby") {
    const Icon = IconFor(data.myRole);
    return (
      <div className="mx-auto max-w-xl text-center pt-10">
        <motion.div {...fadeUp}>
          <span className="chip mb-6">
            <Smartphone className="h-3 w-3" />
            Sala creada
          </span>
          <p className="text-muted-foreground text-sm mb-2">
            Dile a tu pareja que entre con este código:
          </p>
          <p className="font-display text-7xl font-semibold tracking-[0.2em] text-gradient-rose mb-8">
            {data.code}
          </p>
          <div className="card-luxe rounded-2xl p-6 mb-6 inline-flex items-center gap-4">
            <Icon className={`h-8 w-8 ${accentText(data.myRole)}`} />
            <div className="text-left">
              <p className="font-semibold">Tu rol: {name(data.myRole)}</p>
              <p className="text-xs text-muted-foreground">
                Tu mazo contiene lo que hará {name(other(data.myRole))}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            {data.partnerHere
              ? "¡Tu pareja ya está dentro!"
              : "Esperando a que tu pareja entre con el código…"}
          </p>
          {data.isCreator ? (
            <Button
              size="lg"
              disabled={!data.partnerHere || startMutation.isPending}
              onClick={() => startMutation.mutate({ code: data.code })}
              className="rounded-full px-8 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-rose border-0"
            >
              <Play className="mr-2 h-5 w-5" />
              Empezar partida
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Esperando a que tu pareja dé comienzo…
            </p>
          )}
          <div className="mt-8">
            <Button variant="ghost" onClick={exit}>
              <DoorOpen className="mr-2 h-4 w-4" />
              Salir de la sala
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------- fin ----------
  if (data.status === "finished") {
    return (
      <div className="mx-auto max-w-xl text-center pt-20">
        <motion.div {...fadeUp}>
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-amber-300" />
          <p className="font-display text-5xl font-semibold mb-4">
            Fin de la partida
          </p>
          <p className="text-muted-foreground mb-10">
            {data.activeRole ? name(data.activeRole) : "Alguien"} se quedó sin
            cartas. ¿Otra ronda?
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => restartMutation.mutate({ code: data.code })}
              className="rounded-full px-7 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-rose border-0"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Jugar otra vez
            </Button>
            <Button size="lg" variant="outline" onClick={exit} className="rounded-full px-7">
              <DoorOpen className="mr-2 h-4 w-4" />
              Salir
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------- carta en juego (temporizador) ----------
  if (data.currentCard) {
    const executor = data.currentCard.executor;
    const iAmExecutor = data.myRole === executor;
    const pct = Math.max(
      0,
      Math.min(100, (secondsLeft / Math.max(1, Math.ceil((data.currentCard.timerEnd - (data.now ?? Date.now())) / 1000))) * 100),
    );
    return (
      <div className="mx-auto max-w-xl pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center mb-8"
        >
          <p className="text-muted-foreground text-xs uppercase tracking-[0.25em] mb-6">
            {iAmExecutor ? "Te toca cumplir" : "Tu pareja está cumpliendo tu carta"}
          </p>
          <div className="relative h-52 w-52">
            <div
              className="timer-ring absolute inset-0 rounded-full"
              style={{ "--p": `${pct}%` } as React.CSSProperties}
            />
            <div className="absolute inset-2 rounded-full bg-background flex flex-col items-center justify-center">
              <span className="font-display text-6xl font-semibold tabular-nums">
                {mmss(secondsLeft)}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                <Hourglass className="inline h-3 w-3 mr-1" />
                {name(executor)} debe hacer esto
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-luxe rounded-2xl p-6"
        >
          <div className="flex gap-4">
            <div
              className={`w-1 self-stretch rounded-full bg-gradient-to-b ${accentBar(executor)} to-transparent shrink-0`}
            />
            <p className="text-lg leading-relaxed whitespace-pre-wrap">
              {data.currentCard.text}
            </p>
          </div>
        </motion.div>

        <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-xl">
            <Button
              variant="outline"
              className="w-full rounded-full h-12"
              onClick={() => finishMutation.mutate({ code: data.code })}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Terminar ahora
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- mi turno: mostrar mano ----------
  if (data.activeRole === data.myRole) {
    return (
      <div className="mx-auto max-w-xl pb-24">
        <motion.div {...fadeUp} className="mb-2">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <h1 className="font-display text-4xl font-semibold">
              Tu turno, <span className={`italic ${accentText(data.myRole)}`}>{name(data.myRole)}</span>
            </h1>
          </div>
        </motion.div>
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="mb-6">
          <p className="text-muted-foreground text-sm">
            Tu mano es secreta: {name(other(data.myRole))} no puede verla.
            Elige una carta y tu pareja la ejecutará.
          </p>
          {data.extraPlays > 0 && (
            <span className="chip mt-3 text-amber-300 border-amber-400/30 bg-amber-500/10">
              <Zap className="h-3 w-3" />
              Doble acción: te quedan {data.extraPlays} cartas seguidas
            </span>
          )}
        </motion.div>

        {data.myHand.length === 0 ? (
          <p className="text-muted-foreground">No te quedan cartas.</p>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence initial={false}>
              {data.myHand.map((card, i) =>
                card.kind === "special" ? (
                  <motion.div
                    key={card.uid}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.25) }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      playMutation.mutate({ code: data.code, uid: card.uid })
                    }
                    className="rounded-2xl p-5 cursor-pointer group border border-amber-400/40 bg-gradient-to-br from-amber-500/15 to-transparent"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                        {(() => {
                          const def = SPECIAL_BY_UID[card.uid];
                          const Icon = def?.icon ?? Sparkles;
                          return <Icon className="h-5 w-5 text-amber-950" />;
                        })()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-2xl font-semibold leading-tight">
                          {SPECIAL_BY_UID[card.uid]?.title ?? "Especial"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 leading-snug">
                          {SPECIAL_BY_UID[card.uid]?.description}
                        </p>
                        <span className="chip mt-3 text-amber-300 border-amber-400/30 bg-amber-500/10">
                          <Sparkles className="h-3 w-3" />
                          Especial · sin tiempo
                        </span>
                      </div>
                      <Play className="h-5 w-5 shrink-0 self-center text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={card.uid}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.25) }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      playMutation.mutate({ code: data.code, uid: card.uid })
                    }
                    className="card-luxe rounded-2xl p-5 cursor-pointer group"
                  >
                    <div className="flex gap-4">
                      <div
                        className={`w-1 self-stretch rounded-full bg-gradient-to-b ${accentBar(other(card.deck))} to-transparent shrink-0`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                          {card.text}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3">
                          {card.minSeconds != null || card.maxSeconds != null
                            ? `Duración definida en la carta (${card.minSeconds ?? data.defMin}s – ${card.maxSeconds ?? data.defMax}s)`
                            : `Tiempo al azar · ${data.defMin}s – ${data.defMax}s`}
                        </p>
                      </div>
                      <Play className="h-5 w-5 shrink-0 self-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ),
              )}
            </AnimatePresence>
          </div>
        )}
        {error && <p className="text-sm text-rose-400 mt-4">{error}</p>}
      </div>
    );
  }

  // ---------- turno de la pareja ----------
  return (
    <div className="mx-auto max-w-xl text-center pt-24">
      <motion.div {...fadeUp}>
        <span className="chip mb-6">
          <Hourglass className="h-3 w-3" />
          Espera…
        </span>
        <p className="font-display text-4xl font-semibold mb-3">
          Turno de{" "}
          <span className={`italic ${accentText(other(data.myRole))}`}>
            {name(other(data.myRole))}
          </span>
        </p>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Tu pareja está eligiendo una carta para ti. No mires su móvil…
        </p>
      </motion.div>
    </div>
  );
}
