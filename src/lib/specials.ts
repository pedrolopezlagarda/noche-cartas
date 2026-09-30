import { Layers, RefreshCw, Zap, type LucideIcon } from "lucide-react";

export type SpecialEffect = "roba2" | "doble" | "cambia";

export type SpecialCardDef = {
  kind: "special";
  uid: string;
  effect: SpecialEffect;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const SPECIALS: SpecialCardDef[] = [
  {
    kind: "special",
    uid: "sp-roba2",
    effect: "roba2",
    title: "Roba dos",
    description: "Roba 2 cartas de tu mazo y añádelas a tu mano.",
    icon: Layers,
  },
  {
    kind: "special",
    uid: "sp-doble",
    effect: "doble",
    title: "Doble acción",
    description: "Juega dos cartas de acción seguidas sin ceder el turno.",
    icon: Zap,
  },
  {
    kind: "special",
    uid: "sp-cambia",
    effect: "cambia",
    title: "Manos nuevas",
    description:
      "Mete tu mano de vuelta en tu mazo, baraja y roba 3 cartas nuevas.",
    icon: RefreshCw,
  },
];

export const SPECIAL_BY_UID: Record<string, SpecialCardDef> = Object.fromEntries(
  SPECIALS.map((s) => [s.uid, s]),
);
