import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Crown, Heart, Layers, Pencil, Plus, RefreshCw, Sparkles, Trash2, Zap, type LucideIcon } from "lucide-react";

const SPECIALS_INFO: { title: string; description: string; icon: LucideIcon }[] = [
  { title: "Roba dos", description: "Roba 2 cartas de tu mazo y añádelas a tu mano.", icon: Layers },
  { title: "Doble acción", description: "Juega dos cartas de acción seguidas sin ceder el turno.", icon: Zap },
  { title: "Manos nuevas", description: "Mete tu mano de vuelta en tu mazo, baraja y roba 3 cartas nuevas.", icon: RefreshCw },
];

type Deck = "el" | "ella";

type CardRow = {
  id: number;
  deck: Deck;
  text: string;
  minSeconds: number | null;
  maxSeconds: number | null;
};

function formatRange(min: number | null, max: number | null) {
  if (min == null && max == null) return "Tiempo al azar";
  const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min` : `${s} s`);
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `Al menos ${fmt(min)}`;
  return `Hasta ${fmt(max!)}`;
}

const deckMeta: Record<Deck, { label: string; who: string; icon: typeof Crown; accent: string; chip: string }> = {
  el: { label: "Mazo de Él", who: "Lo que hará Ella", icon: Heart, accent: "from-amber-400/70", chip: "text-amber-300 border-amber-400/30 bg-amber-500/10" },
  ella: { label: "Mazo de Ella", who: "Lo que hará Él", icon: Crown, accent: "from-rose-500/70", chip: "text-rose-300 border-rose-400/30 bg-rose-500/10" },
};

export default function Home() {
  const { data: cards = [], isLoading } = trpc.cards.list.useQuery();
  const utils = trpc.useUtils();

  const [activeDeck, setActiveDeck] = useState<Deck>("el");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CardRow | null>(null);
  const [deleting, setDeleting] = useState<CardRow | null>(null);
  const [error, setError] = useState("");

  const [text, setText] = useState("");
  const [minSec, setMinSec] = useState("");
  const [maxSec, setMaxSec] = useState("");

  const openNew = () => {
    setEditing(null);
    setText("");
    setMinSec("");
    setMaxSec("");
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (card: CardRow) => {
    setEditing(card);
    setText(card.text);
    setMinSec(card.minSeconds != null ? String(card.minSeconds) : "");
    setMaxSec(card.maxSeconds != null ? String(card.maxSeconds) : "");
    setError("");
    setDialogOpen(true);
  };

  const createMutation = trpc.cards.create.useMutation({ onSuccess: () => utils.cards.list.invalidate() });
  const updateMutation = trpc.cards.update.useMutation({ onSuccess: () => utils.cards.list.invalidate() });
  const deleteMutation = trpc.cards.delete.useMutation({ onSuccess: () => utils.cards.list.invalidate() });

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) { setError("Escribe la acción de la carta."); return; }
    const min = minSec === "" ? null : parseInt(minSec, 10);
    const max = maxSec === "" ? null : parseInt(maxSec, 10);
    if ((min != null && isNaN(min)) || (max != null && isNaN(max)) || (min != null && min < 0) || (max != null && max < 0)) {
      setError("Las duraciones deben ser números de segundos válidos."); return;
    }
    if (min != null && max != null && min > max) { setError("El mínimo no puede ser mayor que el máximo."); return; }

    const payload = { deck: activeDeck, text: trimmed, minSeconds: min, maxSeconds: max };
    const onDone = () => { setDialogOpen(false); utils.cards.list.invalidate(); };

    if (editing) {
      updateMutation.mutate({ ...payload, id: editing.id }, { onSuccess: onDone });
    } else {
      createMutation.mutate(payload, { onSuccess: onDone });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const deckCards = (deck: Deck) => cards.filter((c) => c.deck === deck);
  const meta = deckMeta[activeDeck];

  const cardList = (deck: Deck) => {
    const m = deckMeta[deck];
    const list = deckCards(deck);
    if (isLoading) return <div className="grid gap-3">{[0,1,2].map((i) => <div key={i} className="card-luxe h-24 rounded-2xl animate-pulse" />)}</div>;
    if (list.length === 0) return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-luxe rounded-2xl py-14 px-6 text-center">
        <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="font-display text-2xl mb-1">Este mazo está vacío</p>
        <p className="text-sm text-muted-foreground">Crea tu primera carta y empieza a construir la noche.</p>
      </motion.div>
    );
    return (
      <div className="grid gap-3">
        <AnimatePresence initial={false}>
          {list.map((card, i) => (
            <motion.div
              key={card.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3) }}
              className="card-luxe rounded-2xl p-5 flex items-start justify-between gap-4 group"
            >
              <div className="flex gap-4 min-w-0">
                <div className={`w-1 self-stretch rounded-full bg-gradient-to-b ${m.accent} to-transparent shrink-0`} />
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{card.text}</p>
                  <span className={`chip mt-3 ${m.chip}`}><Clock className="h-3 w-3" />{formatRange(card.minSeconds, card.maxSeconds)}</span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => openEdit(card as CardRow)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleting(card as CardRow)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <span className="chip mb-3"><Sparkles className="h-3 w-3" />Juego de pareja · Solo para vosotros dos</span>
        <h1 className="font-display text-4xl font-semibold leading-tight">El Mazo de la <span className="text-gradient-rose italic">Noche</span></h1>
        <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">Escribe las cartas que compondrán vuestro juego. El Mazo de Él guarda lo que hará Ella; el Mazo de Ella, lo que hará Él.</p>
      </motion.div>

      <div className="flex justify-end mb-4">
        <Button onClick={openNew} className="rounded-full px-5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 glow-rose border-0">
          <Plus className="mr-2 h-4 w-4" />Nueva carta
        </Button>
      </div>

      <Tabs value={activeDeck} onValueChange={(v) => setActiveDeck(v as Deck)}>
        <TabsList className="w-full grid grid-cols-2 h-auto p-1.5 rounded-2xl bg-secondary/50 mb-6">
          {(Object.keys(deckMeta) as Deck[]).map((d) => {
            const m = deckMeta[d];
            return (
              <TabsTrigger key={d} value={d} className="rounded-xl py-3 data-[state=active]:bg-card data-[state=active]:shadow-lg data-[state=active]:text-foreground">
                <m.icon className="mr-2 h-4 w-4" />
                <span className="font-medium">{m.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{deckCards(d).length}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{meta.who}</p>
        </div>

        <TabsContent value="el">{cardList("el")}</TabsContent>
        <TabsContent value="ella">{cardList("ella")}</TabsContent>
      </Tabs>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card-luxe rounded-2xl p-6 mt-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />Cartas especiales · vienen de serie en los dos mazos
        </p>
        <div className="space-y-3">
          {SPECIALS_INFO.map((s) => (
            <div key={s.title} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4 text-amber-950" />
              </div>
              <p className="text-sm leading-snug pt-1.5"><span className="font-semibold">{s.title}.</span> <span className="text-muted-foreground">{s.description}</span></p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">No tienen temporizador: aplican su efecto al instante y vuelven al fondo del mazo.</p>
      </motion.div>

      {/* Modal de edición/creación (bottom-sheet) */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDialogOpen(false); }}
        >
          <div className="card-luxe rounded-t-2xl sm:rounded-2xl border-0 w-full max-w-md max-h-[85dvh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 pb-3 shrink-0">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30 sm:hidden" />
              <h3 className="font-display text-2xl sm:text-3xl">{editing ? "Editar carta" : "Nueva carta"}</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="card-text" className="text-muted-foreground">Acción · {meta.label}</Label>
                <Textarea id="card-text" value={text} onChange={(e) => setText(e.target.value)} rows={4}
                  placeholder={`Describe lo que hará ${activeDeck === "el" ? "Ella" : "Él"}…`} className="rounded-xl bg-secondary/40" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-sec" className="text-muted-foreground">Duración mínima (s)</Label>
                  <Input id="min-sec" type="number" min={0} value={minSec} onChange={(e) => setMinSec(e.target.value)} placeholder="opcional" className="rounded-xl bg-secondary/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-sec" className="text-muted-foreground">Duración máxima (s)</Label>
                  <Input id="max-sec" type="number" min={0} value={maxSec} onChange={(e) => setMaxSec(e.target.value)} placeholder="opcional" className="rounded-xl bg-secondary/40" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">Si las dejas vacías, la partida usará su rango por defecto (10 segundos – 5 minutos, ajustable al empezar).</p>
              {error && <p className="text-sm text-rose-400">{error}</p>}
            </div>
            <div className="p-5 pt-3 shrink-0 flex justify-end gap-2 border-t border-border/40">
              <Button variant="ghost" className="rounded-full" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-full px-6 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border-0">Guardar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación eliminar */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={(e) => { if (e.target === e.currentTarget) setDeleting(null); }}>
          <div className="card-luxe rounded-2xl border-0 max-w-md w-full p-6">
            <h3 className="font-display text-2xl mb-1">¿Eliminar esta carta?</h3>
            <p className="text-sm text-muted-foreground mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" className="rounded-full" onClick={() => setDeleting(null)}>Cancelar</Button>
              <Button className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { handleDelete(deleting.id); setDeleting(null); }}>Eliminar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
