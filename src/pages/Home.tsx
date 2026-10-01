import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useFirebaseCards } from "@/hooks/useFirebaseCards";
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
  id: string;
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
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { cards, isLoading, create, update, remove } = useFirebaseCards(user?.uid);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<CardRow | null>(null);
  const [editing, setEditing] = useState<CardRow | null>(null);
  const [activeDeck, setActiveDeck] = useState<Deck>("el");
  const [text, setText] = useState("");
  const [minSec, setMinSec] = useState("");
  const [maxSec, setMaxSec] = useState("");
  const [error, setError] = useState("");

  const openCreate = (deck: Deck) => {
    setEditing(null);
    setActiveDeck(deck);
    setText("");
    setMinSec("");
    setMaxSec("");
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (card: CardRow) => {
    setEditing(card);
    setActiveDeck(card.deck);
    setText(card.text);
    setMinSec(card.minSeconds?.toString() ?? "");
    setMaxSec(card.maxSeconds?.toString() ?? "");
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) { setError("Escribe la acción de la carta."); return; }
    const min = minSec === "" ? null : parseInt(minSec, 10);
    const max = maxSec === "" ? null : parseInt(maxSec, 10);
    if ((min != null && isNaN(min)) || (max != null && isNaN(max)) || (min != null && min < 0) || (max != null && max < 0)) {
      setError("Las duraciones deben ser números de segundos válidos."); return;
    }
    if (min != null && max != null && min > max) { setError("El mínimo no puede ser mayor que el máximo."); return; }

    const payload = { userId: user!.uid, deck: activeDeck, text: trimmed, minSeconds: min, maxSeconds: max };

    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeleteModal(null);
  };

  const deckCards = (deck: Deck) => cards.filter((c) => c.deck === deck);

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><div className="text-sm text-stone-500">Cargando...</div></div>;
  }

  return (
    <div className="px-5 pb-24 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-serif text-2xl text-stone-100">Noche de <span className="text-amber-400">Cartas</span></h1>
          <p className="text-xs text-stone-500 mt-0.5">Crea las cartas de tu noche juntos.</p>
        </div>
        <div className="text-right"><span className="text-[10px] uppercase tracking-widest text-stone-600">Total</span><div className="text-xl font-serif text-amber-400">{cards.length}</div></div>
      </div>

      <Tabs defaultValue="el" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-stone-900/50 border border-stone-800 rounded-2xl h-12 mb-4">
          <TabsTrigger value="el" className="rounded-xl data-[state=active]:bg-stone-800 data-[state=active]:text-amber-400 data-[state=active]:border-amber-400/20 border border-transparent text-stone-500 text-sm">Mazo de Él</TabsTrigger>
          <TabsTrigger value="ella" className="rounded-xl data-[state=active]:bg-stone-800 data-[state=active]:text-rose-400 data-[state=active]:border-rose-400/20 border border-transparent text-stone-500 text-sm">Mazo de Ella</TabsTrigger>
        </TabsList>

        {(["el", "ella"] as Deck[]).map((deck) => (
          <TabsContent key={deck} value={deck} className="mt-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-300">{(() => { const I = deckMeta[deck].icon; return <I className="w-4 h-4" />; })()}<span className="text-sm font-medium">{deckMeta[deck].label}</span></div>
              <Button onClick={() => openCreate(deck)} className="rounded-full bg-gradient-to-r from-stone-700 to-stone-800 text-stone-200 hover:from-stone-600 hover:to-stone-700 text-xs h-8 px-3 border border-stone-700"><Plus className="w-3.5 h-3.5 mr-1" /> Añadir carta</Button>
            </div>

            <AnimatePresence>
              {deckCards(deck).length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed border-stone-700/60 bg-stone-900/30 p-6 text-center">
                  <Sparkles className="w-5 h-5 text-stone-600 mx-auto mb-2" />
                  <p className="text-sm text-stone-500">Aún no hay cartas aquí.</p>
                  <p className="text-xs text-stone-600 mt-1">Añade la primera y empieza a jugar.</p>
                </motion.div>
              ) : (
                deckCards(deck).map((card) => (
                  <motion.div key={card.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4">
                    <p className="text-[15px] text-stone-200 leading-snug mb-2">{card.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-500"><Clock className="w-3 h-3" />{formatRange(card.minSeconds, card.maxSeconds)}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(card)} className="p-1.5 rounded-lg text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteModal(card)} className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-6 rounded-2xl border border-stone-800/80 bg-stone-900/40 p-4">
        <p className="text-[11px] uppercase tracking-widest text-stone-500 mb-3">Cartas especiales · en ambos mazos</p>
        <div className="space-y-2.5">
          {SPECIALS_INFO.map((s) => (
            <div key={s.title} className="flex items-start gap-2.5"><s.icon className="w-4 h-4 text-amber-400/80 mt-0.5 shrink-0" /><div><p className="text-sm text-stone-300 font-medium">{s.title}</p><p className="text-xs text-stone-500">{s.description}</p></div></div>
          ))}
        </div>
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => setDialogOpen(false)}>
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-stone-950 border border-stone-800 rounded-t-3xl p-5 max-h-[85dvh] overflow-y-auto">
            <div className="w-10 h-1 bg-stone-800 rounded-full mx-auto mb-4" />
            <h2 className="font-serif text-xl text-stone-100 mb-4">{editing ? "Editar carta" : "Nueva carta"}</h2>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setActiveDeck("el")} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${activeDeck === "el" ? "bg-amber-500/10 border-amber-400/30 text-amber-400" : "bg-stone-900 border-stone-800 text-stone-500"}`}>Él</button>
              <button onClick={() => setActiveDeck("ella")} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${activeDeck === "ella" ? "bg-rose-500/10 border-rose-400/30 text-rose-400" : "bg-stone-900 border-stone-800 text-stone-500"}`}>Ella</button>
            </div>
            <Label className="text-xs text-stone-500 mb-1.5 block">Acción de la carta</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[80px] bg-stone-900 border-stone-800 rounded-xl text-sm text-stone-200 placeholder:text-stone-600 resize-none mb-3" placeholder="Describe lo que hará la pareja..." />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><Label className="text-xs text-stone-500 mb-1.5 block">Duración mínima (s)</Label><Input type="number" value={minSec} onChange={(e) => setMinSec(e.target.value)} className="bg-stone-900 border-stone-800 rounded-xl text-sm" placeholder="Ej: 30" /></div>
              <div><Label className="text-xs text-stone-500 mb-1.5 block">Duración máxima (s)</Label><Input type="number" value={maxSec} onChange={(e) => setMaxSec(e.target.value)} className="bg-stone-900 border-stone-800 rounded-xl text-sm" placeholder="Ej: 300" /></div>
            </div>
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            <div className="flex gap-2.5">
              <Button onClick={() => setDialogOpen(false)} variant="outline" className="flex-1 rounded-xl border-stone-800 text-stone-400 hover:bg-stone-900">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-white font-medium">{editing ? "Guardar" : "Crear"}</Button>
            </div>
          </motion.div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setDeleteModal(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-stone-950 border border-stone-800 rounded-2xl p-5">
            <h3 className="font-serif text-lg text-stone-100 mb-2">¿Borrar carta?</h3>
            <p className="text-sm text-stone-500 mb-5">Se eliminará permanentemente. Esta acción no se puede deshacer.</p>
            <div className="flex gap-2.5">
              <Button onClick={() => setDeleteModal(null)} variant="outline" className="flex-1 rounded-xl border-stone-800 text-stone-400">Cancelar</Button>
              <Button onClick={() => handleDelete(deleteModal.id)} className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white">Sí, borrar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
