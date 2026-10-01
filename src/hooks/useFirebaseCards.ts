import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  orderBy, Timestamp
} from "firebase/firestore";

export type Card = {
  id: string;
  userId: string;
  deck: "el" | "ella";
  text: string;
  minSeconds: number | null;
  maxSeconds: number | null;
  createdAt: Timestamp;
};

export function useFirebaseCards(userId: string | undefined) {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }

    const q = query(
      collection(db, "cards"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Card));
      setCards(items);
      setIsLoading(false);
    }, (err) => {
      console.error("Cards error:", err);
      setIsLoading(false);
    });

    return unsub;
  }, [userId]);

  const create = async (card: Omit<Card, "id" | "createdAt">) => {
    await addDoc(collection(db, "cards"), {
      ...card,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const update = async (id: string, data: Partial<Omit<Card, "id">>) => {
    await updateDoc(doc(db, "cards", id), { ...data, updatedAt: serverTimestamp() });
  };

  const remove = async (id: string) => {
    await deleteDoc(doc(db, "cards", id));
  };

  return { cards, isLoading, create, update, remove };
}
