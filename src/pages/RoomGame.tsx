import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseCards } from "@/hooks/useFirebaseCards";
import { useFirebaseRoom } from "@/hooks/useFirebaseRoom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SPECIAL_BY_UID, SPECIALS } from "@/lib/specials";
import { sfx, buzz } from "@/lib/feedback";
import {
  Crown, DoorOpen, Heart, KeyRound,
  SkipForward, Sparkles, Wifi,
} from "lucide-react";

type Role = "el" | "ella";

type RoomCard =
  | { kind: "action"; uid: string; id: string; deck: Role; text: string; minSeconds: number | null; maxSeconds: number | null }
  | { kind: "special"; uid: string; effect: string };

const name = (p: Role) => (p === "el" ? "Él" : "Ella");
const other = (p: Role): Role => (p === "el" ? "ella" : "el");
const IconFor = (p: Role) => (p === "el" ? Crown : Heart);
const accentText = (p: Role) => (p === "el" ? "text-rose-300" : "text-amber-300");

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const STORAGE_KEY = "nc-room-code";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

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
      if (rem <= 0 && !firedRef.current) { firedRef.current = true; onDoneRef.current(); }
    };
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [timerEnd]);
  return timerEnd ? left : 0;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const HAND_SIZE = 3;

export default function RoomGame() {
  const { user } = useFirebaseAuth();
  const { cards } = useFirebaseCards(user?.uid);
  const {
    room, code, error: roomError, loading,
    createRoom, joinRoom, startGame, playCard, finishCard, leaveRoom, setCode,
  } = useFirebaseRoom(user?.uid);

  const { code: urlCode } = useParams<{ code?: string }>();
  const [joinInput, setJoinInput] = useState(urlCode?.trim() ?? "");
  const [createRole, setCreateRole] = useState<Role>("el");
  const [defMin, setDefMin] = useState("10");
  const [defMax, setDefMax] = useState("300");
  const [localError, setLocalError] = useState("");

  // Al cargar, recuperar código guardado
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const fromUrl = urlCode?.trim() ?? "";
    if (fromUrl.length >= 4) {
      setCode(fromUrl.toUpperCase());
    } else if (saved && saved.length >= 4) {
      setCode(saved);
    }
  }, [urlCode, setCode]);

  const myRole = room && user ? (room.players[user.uid]?.role ?? null) : null;
  const partnerHere = room ? Object.keys(room.players).length >= 2 : false;
  const isCreator = room ? room.creatorId === user?.uid : false;

  // Temporizador
  const finishRef = useRef(finishCard);
  finishRef.current = finishCard;
  const secondsLeft = useCountdown(room?.currentCard?.timerEnd ?? null, () => {
    if (code && room && myRole) {
      const o = other(myRole);
      finishRef.current({
        activeRole: o,
        extraPlays: 0,
        currentCard: null,
        hands: room.hands,
        piles: room.piles,
      });
    }
  });

  // Sonidos
  const prevTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const te = room?.currentCard?.timerEnd ?? null;
    if (te && te !== prevTimerRef.current) { sfx.launch(); buzz(40); }
    prevTimerRef.current = te;
  }, [room?.currentCard?.timerEnd]);

  const prevTurnMineRef = useRef(false);
  useEffect(() => {
    if (!room || room.status !== "playing" || room.currentCard) { prevTurnMineRef.current = false; return; }
    const mine = room.activeRole === myRole;
    if (mine && !prevTurnMineRef.current) { sfx.turn(); buzz(20); }
    prevTurnMineRef.current = mine;
  }, [room, myRole]);

  const exit = () => { leaveRoom(); setLocalError(""); };

  // Crear sala
  const handleCreate = () => {
    setLocalError("");
    if (!user) { setLocalError("Esperando autenticación..."); return; }
    createRoom(createRole, user.uid.substring(0, 6));
  };

  // Unirse
  const handleJoin = () => {
    setLocalError("");
    const c = joinInput.trim().toUpperCase();
    if (c.length < 4) { setLocalError("Introduce un código de 4 letras."); return; }
    if (!user) { setLocalError("Esperando autenticación..."); return; }
    joinRoom(c, user.uid.substring(0, 6));
  };

  // Empezar partida
  const handleStart = () => {
    if (!room || !user || !myRole) return;
    const minDefault = parseInt(defMin, 10) || 10;
    const maxDefault = Math.max(minDefault, parseInt(defMax, 10) || 300);

    const build = (list: Array<{ id: string; deck: Role; text: string; minSeconds: number | null; maxSeconds: number | null }>): RoomCard[] =>
      shuffle([
        ...list.map((c): RoomCard => ({ kind: "action", uid: `a-${c.id}`, id: c.id, deck: c.deck, text: c.text, minSeconds: c.minSeconds, maxSeconds: c.maxSeconds })),
        ...SPECIALS.map((s) => ({ ...s })),
      ]);

    const elPile = build(cards.filter((c) => c.deck === "el"));
    const ellaPile = build(cards.filter((c) => c.deck === "ella"));

    const drawTo = (hand: RoomCard[], pile: RoomCard[]) => {
      const needed = Math.max(0, HAND_SIZE - hand.length);
      return { hand: [...hand, ...pile.slice(0, needed)], pile: pile.slice(needed) };
    };

    const elDraw = drawTo([], elPile);
    const ellaDraw = drawTo([], ellaPile);

    const activeRole: Role = Math.random() < 0.5 ? "el" : "ella";

    startGame({
      hands: { el: elDraw.hand, ella: ellaDraw.hand },
      piles: { el: elDraw.pile, ella: ellaDraw.pile },
      activeRole,
      defMin: minDefault,
      defMax: maxDefault,
    });
  };

  // Jugar carta
  const handlePlay = (card: RoomCard) => {
    if (!room || !user || !myRole) return;
    if (room.status !== "playing" || room.currentCard) return;
    if (room.activeRole !== myRole) return;

    const hand = room.hands[myRole] ?? [];
    const pile = room.piles[myRole] ?? [];
    const newHand = hand.filter((c) => c.uid !== card.uid);

    if (card.kind === "special") {
      const def = SPECIAL_BY_UID[card.uid];
      if (!def) return;

      if (def.effect === "roba2") {
        const needed = Math.max(0, 2);
        const drawn = pile.slice(0, needed);
        const newPile = pile.slice(needed);
        playCard({
          currentCard: null,
          extraPlays: room.extraPlays,
          hands: { ...room.hands, [myRole]: [...newHand, ...drawn] },
          piles: { ...room.piles, [myRole]: newPile },
          activeRole: other(myRole),
        });
        return;
      }

      if (def.effect === "doble") {
        playCard({
          currentCard: null,
          extraPlays: 2,
          hands: { ...room.hands, [myRole]: newHand },
          piles: { ...room.piles, [myRole]: pile },
          activeRole: myRole,
        });
        return;
      }

      if (def.effect === "cambia") {
        const allCards = [...newHand, ...pile];
        const shuffled = shuffle(allCards);
        const newHand2 = shuffled.slice(0, HAND_SIZE);
        const newPile2 = shuffled.slice(HAND_SIZE);
        playCard({
          currentCard: null,
          extraPlays: room.extraPlays,
          hands: { ...room.hands, [myRole]: newHand2 },
          piles: { ...room.piles, [myRole]: newPile2 },
          activeRole: other(myRole),
        });
        return;
      }
      return;
    }

    // Carta de acción
    const minS = card.minSeconds ?? room.defMin;
    const maxS = Math.max(minS, card.maxSeconds ?? room.defMax);
    const seconds = Math.floor(minS + Math.random() * (maxS - minS + 1));
    const timerEnd = Date.now() + seconds * 1000;

    playCard({
      currentCard: { kind: "action", text: card.text, executor: other(myRole), timerEnd },
      extraPlays: room.extraPlays,
      hands: { ...room.hands, [myRole]: newHand },
      piles: { ...room.piles, [myRole]: pile },
      activeRole: myRole,
    });
  };

  const handleSkip = () => {
    if (!room || !myRole) return;
    playCard({
      currentCard: null,
      extraPlays: room.extraPlays,
      hands: room.hands,
      piles: room.piles,
      activeRole: other(myRole),
    });
  };

  // UI
  if (!code || !room) {
    return (
      <div className="px-5 pb-28 pt-6">
        <motion.div {...fadeUp} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-800/60 border border-stone-700/50 mb-3">
            <Wifi className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="font-serif text-2xl text-stone-100">Jugar online</h1>
          <p className="text-sm text-stone-500 mt-1 max-w-xs mx-auto">Conecta tu movil con el de tu pareja y jugad juntos desde cualquier sitio.</p>
        </motion.div>

        <div className="space-y-4 max-w-sm mx-auto">
          <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-5">
            <div className="flex items-center gap-2 mb-3"><KeyRound className="w-4 h-4 text-amber-400" /><h2 className="text-sm font-medium text-stone-300">Unirse a sala</h2></div>
            <div className="flex gap-2">
              <Input value={joinInput} onChange={(e) => setJoinInput(e.target.value.toUpperCase())} placeholder="CODIGO" maxLength={6} className="uppercase bg-stone-900 border-stone-800 rounded-xl text-sm text-stone-200 placeholder:text-stone-600" />
              <Button onClick={handleJoin} disabled={loading} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5">{loading ? "..." : "Entrar"}</Button>
            </div>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-5">
            <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-rose-400" /><h2 className="text-sm font-medium text-stone-300">Crear sala</h2></div>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setCreateRole("el")} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${createRole === "el" ? "bg-amber-500/10 border-amber-400/30 text-amber-400" : "bg-stone-900 border-stone-800 text-stone-500"}`}>Mazo de Él</button>
              <button onClick={() => setCreateRole("ella")} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${createRole === "ella" ? "bg-rose-500/10 border-rose-400/30 text-rose-400" : "bg-stone-900 border-stone-800 text-stone-500"}`}>Mazo de Ella</button>
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 text-white font-medium">{loading ? "Creando..." : "Crear sala"}</Button>
          </motion.div>
        </div>

        {(localError || roomError) && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-red-400 mt-4">{localError || roomError}</motion.p>
        )}
      </div>
    );
  }

  // Lobby
  if (room.status === "lobby") {
    return (
      <div className="px-5 pb-28 pt-6">
        <motion.div {...fadeUp} className="text-center mb-6">
          <h1 className="font-serif text-2xl text-stone-100">Sala <span className="text-amber-400 tracking-widest">{room.code}</span></h1>
          <p className="text-sm text-stone-500 mt-1">Comparte este código con tu pareja.</p>
        </motion.div>

        <div className="max-w-sm mx-auto space-y-4">
          <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-5 text-center">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">Jugadores</p>
            <div className="space-y-2">
              {Object.entries(room.players).map(([uid, p]) => (
                <div key={uid} className="flex items-center justify-center gap-2 text-sm text-stone-300">
                  {(() => { const I = IconFor(p.role); return <I className="w-4 h-4" />; })()} {name(p.role)} {uid === user?.uid && <span className="text-[10px] text-stone-600">(tú)</span>}
                </div>
              ))}
            </div>
            {!partnerHere && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-500">
                <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Esperando a tu pareja...
              </div>
            )}
          </motion.div>

          {isCreator && partnerHere && (
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-5">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">Configuración</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><Label className="text-xs text-stone-500 mb-1.5 block">Duración mínima (s)</Label><Input type="number" value={defMin} onChange={(e) => setDefMin(e.target.value)} className="bg-stone-900 border-stone-800 rounded-xl text-sm" /></div>
                <div><Label className="text-xs text-stone-500 mb-1.5 block">Duración máxima (s)</Label><Input type="number" value={defMax} onChange={(e) => setDefMax(e.target.value)} className="bg-stone-900 border-stone-800 rounded-xl text-sm" /></div>
              </div>
              <Button onClick={handleStart} className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-800 text-white font-medium">Empezar partida</Button>
            </motion.div>
          )}

          {!isCreator && partnerHere && (
            <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-5 text-center">
              <p className="text-sm text-stone-400">Esperando a que el creador empiece la partida...</p>
            </motion.div>
          )}

          <Button onClick={exit} variant="outline" className="w-full rounded-xl border-stone-800 text-stone-500 hover:text-stone-300"><DoorOpen className="w-4 h-4 mr-1.5" /> Salir de la sala</Button>
        </div>
      </div>
    );
  }

  // Playing
  const hand = myRole ? (room.hands[myRole] ?? []) : [];
  const myTurn = room.activeRole === myRole && !room.currentCard;


  return (
    <div className="px-4 pb-28 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-serif text-xl text-stone-100">Noche de <span className="text-amber-400">Cartas</span></h1>
          <p className="text-xs text-stone-500">Sala {room.code}</p>
        </div>
        <Button onClick={exit} variant="ghost" size="sm" className="text-stone-500 hover:text-stone-300"><DoorOpen className="w-4 h-4" /></Button>
      </div>

      {room.currentCard && (
        <motion.div {...fadeUp} className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 to-stone-900/60 p-5 mb-4 text-center">
          <p className="text-xs uppercase tracking-widest text-amber-400/70 mb-2">Carta en juego</p>
          <p className="text-lg text-stone-100 font-medium mb-3">{room.currentCard.text}</p>
          <div className="text-3xl font-serif text-amber-400">{mmss(secondsLeft)}</div>
          <p className="text-xs text-stone-500 mt-2">La ejecuta: <span className={accentText(room.currentCard.executor)}>{name(room.currentCard.executor)}</span></p>
        </motion.div>
      )}

      {!room.currentCard && (
        <motion.div {...fadeUp} className="rounded-2xl border border-stone-800/80 bg-stone-900/40 p-4 mb-4 text-center">
          {myTurn ? (
            <>
              <p className="text-sm text-stone-300">Es tu turno, <span className={accentText(myRole!)}>{name(myRole!)}</span></p>
              <p className="text-xs text-stone-500 mt-1">Elige una carta de tu mano</p>
            </>
          ) : (
            <>
              <p className="text-sm text-stone-400">Turno de <span className={accentText(other(myRole!))}>{name(other(myRole!))}</span></p>
              <p className="text-xs text-stone-500 mt-1">Espera a que juegue...</p>
            </>
          )}
        </motion.div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-stone-500">Tu mano ({hand.length})</p>
        {room.extraPlays > 0 && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-400/20">Doble acción activa</span>}
      </div>

      <div className="space-y-2.5">
        <AnimatePresence>
          {hand.map((card) => (
            <motion.div key={card.uid} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
              <button
                onClick={() => myTurn && !room.currentCard && handlePlay(card)}
                disabled={!myTurn || !!room.currentCard}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  myTurn && !room.currentCard
                    ? "border-stone-700 bg-stone-900/60 hover:border-amber-500/30 hover:bg-stone-800/60 active:scale-[0.98]"
                    : "border-stone-800/60 bg-stone-900/30 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] text-stone-200 leading-snug">
                      {card.kind === "special" ? SPECIAL_BY_UID[card.uid]?.title ?? card.uid : card.text}
                    </p>
                    {card.kind === "action" && (card.minSeconds != null || card.maxSeconds != null) && (
                      <p className="text-[11px] text-stone-500 mt-1">
                        {card.minSeconds != null && card.maxSeconds != null
                          ? `${card.minSeconds}s – ${card.maxSeconds}s`
                          : card.minSeconds != null
                          ? `Min ${card.minSeconds}s`
                          : `Max ${card.maxSeconds}s`}
                      </p>
                    )}
                    {card.kind === "special" && (
                      <p className="text-[11px] text-amber-400/70 mt-1">{SPECIAL_BY_UID[card.uid]?.description}</p>
                    )}
                  </div>
                  {card.kind === "special" && <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {hand.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-700/60 p-5 text-center">
            <p className="text-sm text-stone-500">Sin cartas en mano</p>
          </div>
        )}
      </div>

      {myTurn && !room.currentCard && hand.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
          <Button onClick={handleSkip} variant="outline" className="w-full rounded-xl border-stone-800 text-stone-500 hover:text-stone-300">
            <SkipForward className="w-4 h-4 mr-1.5" /> Pasar turno
          </Button>
        </motion.div>
      )}
    </div>
  );
}
