import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Crown,
  EyeOff,
  Flame,
  Heart,
  Hourglass,
  Play,
  RotateCcw,
  SkipForward,
  Smartphone,
  Sparkles,
  Wifi,
  Zap,
} from "lucide-react";
import { SPECIALS, type SpecialCardDef } from "@/lib/specials";
import { sfx, buzz } from "@/lib/feedback";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseCards } from "@/hooks/useFirebaseCards";
import RoomGame from "./RoomGame";

type Player = "el" | "ella";

type ActionCard = {
  kind: "action";
  uid: string;
  id: string;
  deck: Player;
  text: string;
  minSeconds: number | null;
  maxSeconds: number | null;
};

type HandCard = ActionCard | SpecialCardDef;

const HAND_SIZE = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const other = (p: Player): Player => (p === "el" ? "ella" : "el");
const name = (p: Player) => (p === "el" ? "Él" : "Ella");
const IconFor = (p: Player) => (p === "el" ? Crown : Heart);
const accentText = (p: Player) => (p === "el" ? "text-rose-300" : "text-amber-300");
const accentBar = (p: Player) =>
  p === "el" ? "from-rose-500/70" : "from-amber-400/70";

type Phase = "setup" | "intro" | "play" | "handoff" | "timer" | "over";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

// Animación: el móvil viaja de una mano a otra.
function PhonePassAnimation({ from, to }: { from: Player; to: Player }) {
  const FromIcon = IconFor(from);
  const ToIcon = IconFor(to);
  const grad = (p: Player) =>
    p === "el" ? "from-rose-600 to-rose-400" : "from-amber-400 to-amber-600";
  return (
    <div className="relative w-72 h-44 mx-auto mb-4">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className={`h-16 w-16 rounded-full bg-gradient-to-br ${grad(from)} flex items-center justify-center`}
        >
          <FromIcon className="h-7 w-7 text-white" />
        </motion.div>
        <span className="text-xs text-muted-foreground">{name(from)}</span>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 1.1 }}
          className={`h-16 w-16 rounded-full bg-gradient-to-br ${grad(to)} flex items-center justify-center glow-rose`}
        >
          <ToIcon className="h-7 w-7 text-white" />
        </motion.div>
        <span className="text-xs text-muted-foreground">{name(to)}</span>
      </div>
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 left-0"
        animate={{ x: [12, 222, 12], rotate: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-12 w-7 rounded-lg border-2 border-rose-300/70 bg-background/80 flex items-center justify-center shadow-lg shadow-rose-500/30">
          <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
        </div>
      </motion.div>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute text-rose-400/60"
          style={{ left: `${30 + i * 18}%`, top: `${16 + (i % 2) * 12}%` }}
          animate={{ y: [-4, -14, -4], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}
        >
          <Sparkles className="h-3 w-3" />
        </motion.span>
      ))}
    </div>
  );
}

export default function Juego() {
  const { user } = useFirebaseAuth();
  const { cards, isLoading } = useFirebaseCards(user?.uid);

  const [phase, setPhase] = useState<Phase>("setup");
  const [active, setActive] = useState<Player>("el");
  const [hands, setHands] = useState<Record<Player, HandCard[]>>({
    el: [],
    ella: [],
  });
  const [piles, setPiles] = useState<Record<Player, HandCard[]>>({
    el: [],
    ella: [],
  });
  const [extraPlays, setExtraPlays] = useState(0);
  const [currentCard, setCurrentCard] = useState<ActionCard | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [covered, setCovered] = useState(false);
  const [defMin, setDefMin] = useState("10");
  const [defMax, setDefMax] = useState("300");
  const [mode, setMode] = useState<"choose" | "local" | "room">("choose");

  const decks = useMemo(
    () => ({
      el: cards.filter((c) => c.deck === "el"),
      ella: cards.filter((c) => c.deck === "ella"),
    }),
    [cards],
  );

  // ---------- temporizador ----------
  useEffect(() => {
    if (phase !== "timer") return;
    if (secondsLeft <= 0) {
      finishTurn();
      return;
    }
    if (secondsLeft <= 5) sfx.tick();
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  const drawTo = (hand: HandCard[], pile: HandCard[]) => {
    const needed = Math.max(0, HAND_SIZE - hand.length);
    return {
      hand: [...hand, ...pile.slice(0, needed)],
      pile: pile.slice(needed),
    };
  };

  const startGame = () => {
    // Cada uno juega con SU mazo: el Mazo de Él contiene lo que hará Ella.
    // Las 3 cartas especiales van de serie en cada mazo.
    const build = (list: Array<{ id: string; deck: Player; text: string; minSeconds: number | null; maxSeconds: number | null }>): HandCard[] =>
      shuffle([
        ...list.map(
          (c): ActionCard => ({
            kind: "action",
            uid: `a-${c.id}`,
            id: c.id,
            deck: c.deck,
            text: c.text,
            minSeconds: c.minSeconds,
            maxSeconds: c.maxSeconds,
          }),
        ),
        ...SPECIALS.map((s) => ({ ...s })),
      ]);
    const elPile = build(decks.el);
    const ellaPile = build(decks.ella);
    const elDraw = drawTo([], elPile);
    const ellaDraw = drawTo([], ellaPile);
    setHands({ el: elDraw.hand, ella: ellaDraw.hand });
    setPiles({ el: elDraw.pile, ella: ellaDraw.pile });
    setExtraPlays(0);
    setActive(Math.random() < 0.5 ? "el" : "ella");
    setCurrentCard(null);
    setPhase("intro");
  };

  const minDefault = parseInt(defMin, 10) || 10;
  const maxDefault = Math.max(minDefault, parseInt(defMax, 10) || 300);

  // Decide si el turno continúa (doble acción) o pasa a la pareja.
  const endPlay = (playedDoble: boolean) => {
    if (playedDoble) {
      setExtraPlays(2);
      setPhase("play");
      setCovered(true); // la mano se oculta: nadie más debe verla
      return;
    }
    if (extraPlays > 0) {
      const e = extraPlays - 1;
      setExtraPlays(e);
      if (e > 0) {
        setPhase("play");
        setCovered(true);
        return;
      }
    }
    setActive(other(active));
    setPhase("play");
    setCovered(true);
  };

  const playCard = (card: HandCard) => {
    if (card.kind === "special") {
      resolveSpecial(card);
      return;
    }
    const lo = card.minSeconds ?? minDefault;
    const hi = Math.max(lo, card.maxSeconds ?? maxDefault);
    const secs = Math.floor(lo + Math.random() * (hi - lo + 1));
    setHands((h) => ({
      ...h,
      [active]: h[active].filter((c) => c.uid !== card.uid),
    }));
    setCurrentCard(card);
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    sfx.launch();
    buzz(35);
    // Primero se pasa el móvil al ejecutor; el temporizador arranca cuando confirma.
    setPhase("handoff");
  };

  const resolveSpecial = (card: SpecialCardDef) => {
    sfx.special();
    buzz([25, 50, 25]);
    let hand = hands[active].filter((c) => c.uid !== card.uid);
    let pile = piles[active];

    if (card.effect === "roba2") {
      hand = [...hand, ...pile.slice(0, 2)];
      pile = pile.slice(2);
    } else if (card.effect === "cambia") {
      const r = drawTo([], shuffle([...pile, ...hand]));
      hand = r.hand;
      pile = r.pile;
    }
    // La especial vuelve al fondo del mazo (si el mazo no está vacío).
    if (pile.length > 0) pile = [...pile, card];

    const refilled = drawTo(hand, pile);
    setHands({ ...hands, [active]: refilled.hand });
    setPiles({ ...piles, [active]: refilled.pile });

    if (refilled.hand.length === 0) {
      setPhase("over");
      return;
    }
    endPlay(card.effect === "doble");
  };

  const finishTurn = () => {
    sfx.done();
    buzz([60, 40, 70]);
    // Reposición: al gastar una carta robas otra de tu mazo (mano a 3).
    const drawn = drawTo(hands[active], piles[active]);
    setHands({ ...hands, [active]: drawn.hand });
    setPiles({ ...piles, [active]: drawn.pile });
    setCurrentCard(null);
    if (drawn.hand.length === 0) {
      setPhase("over");
      return;
    }
    endPlay(false);
  };

  const mmss = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando…</p>;
  }

  // ---------- ELEGIR MODO ----------
  if (mode === "choose") {
    return (
      <div className="mx-auto max-w-xl">
        <motion.div {...fadeUp} className="text-center mb-8">
          <span className="chip mb-4">
            <Flame className="h-3 w-3" />
            ¿Cómo jugáis esta noche?
          </span>
          <h1 className="font-display text-5xl font-semibold leading-tight">
            Elige el <span className="text-gradient-rose italic">modo</span>
          </h1>
        </motion.div>
        <div className="grid gap-4">
          <motion.button
            {...fadeUp}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode("local")}
            className="card-luxe rounded-2xl p-6 text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-600 to-rose-400 glow-rose flex items-center justify-center shrink-0">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">Un móvil</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Os pasáis el teléfono. La mano se oculta automáticamente al
                  cambiar de turno.
                </p>
              </div>
            </div>
          </motion.button>
          <motion.button
            {...fadeUp}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode("room")}
            className="card-luxe rounded-2xl p-6 text-left cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                <Wifi className="h-6 w-6 text-amber-950" />
              </div>
              <div>
                <p className="font-display text-2xl font-semibold">Dos móviles</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cada uno con el suyo. Sala con código de 4 letras: cada móvil
                  ve solo su mano y todo se sincroniza en directo.
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  if (mode === "room") {
    return <RoomGame />;
  }

  // ---------- PANTALLA DE COBERTURA (privacidad de la mano) ----------
  if (covered) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur cursor-pointer px-6 text-center"
        onClick={() => setCovered(false)}
      >
        <EyeOff className="h-12 w-12 text-muted-foreground" />
        <p className="font-display text-4xl font-semibold leading-tight">
          {name(active)}, es tu turno
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tu mano es secreta: {name(other(active))} no puede verla. Toca para
          revelarla y elige una carta.
        </p>
        <Button
          size="lg"
          onClick={() => {
            sfx.reveal();
            buzz(20);
            setCovered(false);
          }}
          className="rounded-full px-8 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-rose border-0 mt-2"
        >
          <Play className="mr-2 h-5 w-5" />
          Revelar mi mano
        </Button>
      </div>
    );
  }

  // ---------- SETUP ----------
  if (phase === "setup") {
    const canStart = decks.el.length > 0 && decks.ella.length > 0;
    return (
      <div className="mx-auto max-w-xl">
        <motion.div {...fadeUp} className="text-center mb-8">
          <span className="chip mb-4">
            <Flame className="h-3 w-3" />
            La partida está a punto de empezar
          </span>
          <h1 className="font-display text-5xl font-semibold leading-tight">
            Prepara la <span className="text-gradient-rose italic">noche</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed max-w-md mx-auto">
            Cada uno roba 3 cartas de su propio mazo: lo del Mazo de Él lo
            ejecutará Ella, y lo del Mazo de Ella lo ejecutará Él. Tu mano es
            secreta. Al gastar una carta robas otra. Los turnos se alternan y
            quien empieza lo decide la suerte.
          </p>
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ delay: 0.1 }}
          className="card-luxe rounded-2xl p-6 mb-6"
        >
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(Object.keys(decks) as Player[]).map((p) => {
              const Icon = IconFor(p);
              // El Mazo de Él contiene lo que hará Ella: la ficha de cada
              // persona muestra las acciones que ejecutará su pareja.
              const count = decks[other(p)].length;
              return (
                <div
                  key={p}
                  className="rounded-xl bg-secondary/40 border border-border/60 p-4 text-center"
                >
                  <Icon className={`h-5 w-5 mx-auto mb-2 ${accentText(p)}`} />
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Lo que hará {name(p)}
                  </p>
                  <p className="font-display text-4xl font-semibold mt-1">
                    {count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    cartas + 3 especiales
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-secondary/30 border border-border/50 p-4 mb-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Cartas especiales · en ambos mazos
            </p>
            <div className="space-y-2.5">
              {SPECIALS.map((s) => (
                <div key={s.uid} className="flex items-start gap-3">
                  <s.icon className="h-4 w-4 mt-0.5 text-amber-300 shrink-0" />
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{s.title}.</span>{" "}
                    <span className="text-muted-foreground">
                      {s.description}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="def-min" className="text-muted-foreground text-xs">
                Duración mínima (s)
              </Label>
              <Input
                id="def-min"
                type="number"
                min={0}
                inputMode="numeric"
                value={defMin}
                onChange={(e) => setDefMin(e.target.value)}
                className="rounded-xl bg-secondary/40 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="def-max" className="text-muted-foreground text-xs">
                Duración máxima (s)
              </Label>
              <Input
                id="def-max"
                type="number"
                min={0}
                inputMode="numeric"
                value={defMax}
                onChange={(e) => setDefMax(e.target.value)}
                className="rounded-xl bg-secondary/40 h-12"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Se usa cuando una carta de acción no define su propio rango.
          </p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
          {canStart ? (
            <Button
              size="lg"
              onClick={startGame}
              className="w-full h-13 rounded-full text-base bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400 hover:from-rose-500 hover:to-orange-300 glow-rose border-0 h-14"
            >
              <Play className="mr-2 h-5 w-5" />
              Empezar partida
            </Button>
          ) : (
            <p className="text-sm text-rose-400 text-center">
              Necesitas al menos 1 carta en cada mazo para jugar. Créalas en el
              editor.
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // ---------- INTRO ----------
  if (phase === "intro") {
    const Icon = IconFor(active);
    return (
      <div className="mx-auto max-w-xl text-center pt-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground mb-4 tracking-[0.25em] uppercase text-xs"
        >
          La suerte decide
        </motion.p>
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.2 }}
        >
          <Icon className={`h-14 w-14 mx-auto mb-4 ${accentText(active)}`} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="font-display text-6xl font-semibold mb-10"
        >
          Empieza <span className={`italic ${accentText(active)}`}>{name(active)}</span>
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            size="lg"
            onClick={() => {
              sfx.reveal();
              setPhase("play");
              setCovered(true); // la mano se muestra solo a quien juega
            }}
            className="rounded-full px-8 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-rose border-0"
          >
            <Play className="mr-2 h-5 w-5" />
            Empezar el primer turno
          </Button>
        </motion.div>
      </div>
    );
  }

  // ---------- FIN ----------
  if (phase === "over") {
    return (
      <div className="mx-auto max-w-xl text-center pt-20">
        <motion.div {...fadeUp}>
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-amber-300" />
          <p className="font-display text-5xl font-semibold mb-4">
            Fin de la partida
          </p>
          <p className="text-muted-foreground mb-10">
            {name(active)} se ha quedado sin cartas. ¿Otra ronda?
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              size="lg"
              onClick={startGame}
              className="rounded-full px-7 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-rose border-0"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Jugar otra vez
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setPhase("setup")}
              className="rounded-full px-7"
            >
              Volver al inicio
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------- PASAR EL MÓVIL ----------
  if (phase === "handoff" && currentCard) {
    const executor = other(currentCard.deck);
    const Icon = IconFor(executor);
    return (
      <div className="mx-auto max-w-xl text-center pt-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.15 }}
          >
            <Icon className={`h-14 w-14 mx-auto mb-4 ${accentText(executor)}`} />
          </motion.div>
          <PhonePassAnimation from={active} to={executor} />
          <p className="text-muted-foreground text-sm mb-3 tracking-wide">
            {name(active)} ha lanzado una carta
          </p>
          <p className="font-display text-5xl font-semibold leading-tight mb-3">
            Pasa el móvil a{" "}
            <span className={`italic ${accentText(executor)}`}>{name(executor)}</span>
          </p>
          <p className="text-muted-foreground max-w-xs mx-auto mb-10">
            El tiempo empezará a correr cuando esté en sus manos.
          </p>
          <Button
            size="lg"
            onClick={() => {
              sfx.reveal();
              buzz(20);
              setPhase("timer");
            }}
            className="rounded-full px-8 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-rose border-0"
          >
            <Play className="mr-2 h-5 w-5" />
            Soy {name(executor)} · empezar
          </Button>
        </motion.div>
      </div>
    );
  }

  // ---------- TEMPORIZADOR ----------
  if (phase === "timer" && currentCard) {
    const executor = other(currentCard.deck);
    const pct = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
    return (
      <div className="mx-auto max-w-xl pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center mb-8"
        >
          <p className="text-muted-foreground text-xs uppercase tracking-[0.25em] mb-6">
            Turno de {name(active)}
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
              {currentCard.text}
            </p>
          </div>
        </motion.div>

        <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-xl">
            <Button
              variant="outline"
              className="w-full rounded-full h-12"
              onClick={() => setSecondsLeft(0)}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Terminar ahora
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- JUGAR ----------
  const hand = hands[active];
  return (
    <div className="mx-auto max-w-xl pb-32">
      <motion.div {...fadeUp} className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <h1 className="font-display text-4xl font-semibold">
            Turno de <span className={`italic ${accentText(active)}`}>{name(active)}</span>
          </h1>
        </div>
      </motion.div>
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="mb-6">
        <p className="text-muted-foreground text-sm">
          Tu mano es secreta. Elige una carta: {name(other(active))} la
          ejecutará durante el tiempo que salga al azar.
        </p>
        {extraPlays > 0 && (
          <span className="chip mt-3 text-amber-300 border-amber-400/30 bg-amber-500/10">
            <Zap className="h-3 w-3" />
            Doble acción: te quedan {extraPlays} cartas seguidas
          </span>
        )}
      </motion.div>

      {hand.length === 0 ? (
        <p className="text-muted-foreground">No te quedan cartas.</p>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence initial={false}>
            {hand.map((card, i) =>
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
                  onClick={() => playCard(card)}
                  className="rounded-2xl p-5 cursor-pointer group border border-amber-400/40 bg-gradient-to-br from-amber-500/15 to-transparent"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                      <card.icon className="h-5 w-5 text-amber-950" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-2xl font-semibold leading-tight">
                        {card.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">
                        {card.description}
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
                  onClick={() => playCard(card)}
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
                          ? `Duración definida en la carta (${card.minSeconds ?? minDefault}s – ${card.maxSeconds ?? maxDefault}s)`
                          : `Tiempo al azar · ${minDefault}s – ${maxDefault}s`}
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

      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => setCovered(true)}
          >
            <EyeOff className="mr-2 h-4 w-4" />
            Ocultar
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={() => setPhase("setup")}
          >
            Terminar partida
          </Button>
        </div>
      </div>
    </div>
  );
}
