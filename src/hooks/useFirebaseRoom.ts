import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  doc, onSnapshot, setDoc, updateDoc, getDoc, deleteField,
  serverTimestamp, Timestamp
} from "firebase/firestore";

export type Role = "el" | "ella";

export type RoomCard =
  | { kind: "action"; uid: string; id: string; deck: Role; text: string; minSeconds: number | null; maxSeconds: number | null }
  | { kind: "special"; uid: string; effect: string };

export type RoomState = {
  code: string;
  status: "lobby" | "playing" | "finished";
  activeRole: Role | null;
  extraPlays: number;
  currentCard: { kind: "action"; text: string; executor: Role; timerEnd: number } | null;
  defMin: number;
  defMax: number;
  players: Record<string, { role: Role; name: string; joinedAt: Timestamp }>;
  creatorId: string;
  hands: Record<string, RoomCard[]>;
  piles: Record<string, RoomCard[]>;
  lastUpdated: Timestamp;
};

function generateCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function useFirebaseRoom(userId: string | undefined) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Escuchar sala
  useEffect(() => {
    if (!code) return;
    const unsub = onSnapshot(doc(db, "rooms", code), (snap) => {
      if (snap.exists()) {
        setRoom({ code, ...snap.data() } as RoomState);
      } else {
        setRoom(null);
        setError("La sala no existe");
      }
    }, (err) => {
      setError(err.message);
    });
    return unsub;
  }, [code]);

  const createRoom = useCallback(async (role: Role, name: string) => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const newCode = generateCode();
      await setDoc(doc(db, "rooms", newCode), {
        status: "lobby",
        activeRole: null,
        extraPlays: 0,
        currentCard: null,
        defMin: 10,
        defMax: 300,
        players: {
          [userId]: { role, name, joinedAt: serverTimestamp() }
        },
        creatorId: userId,
        hands: {},
        piles: {},
        lastUpdated: serverTimestamp(),
      });
      setCode(newCode);
      localStorage.setItem("nc-room-code", newCode);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const joinRoom = useCallback(async (roomCode: string, name: string) => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const ref = doc(db, "rooms", roomCode.toUpperCase());
      const snap = await getDoc(ref);
      if (!snap.exists()) { setError("Código no válido"); return; }
      const data = snap.data() as RoomState;
      if (data.status !== "lobby") { setError("La partida ya empezó"); return; }
      if (Object.keys(data.players).length >= 2) { setError("Sala llena"); return; }

      const takenRole = Object.values(data.players)[0]?.role;
      const myRole: Role = takenRole === "el" ? "ella" : "el";

      await updateDoc(ref, {
        [`players.${userId}`]: { role: myRole, name, joinedAt: serverTimestamp() },
        lastUpdated: serverTimestamp(),
      });
      setCode(roomCode.toUpperCase());
      localStorage.setItem("nc-room-code", roomCode.toUpperCase());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const startGame = useCallback(async (gameData: { hands: Record<string, RoomCard[]>; piles: Record<string, RoomCard[]>; activeRole: Role; defMin: number; defMax: number }) => {
    if (!code) return;
    await updateDoc(doc(db, "rooms", code), {
      status: "playing",
      ...gameData,
      lastUpdated: serverTimestamp(),
    });
  }, [code]);

  const playCard = useCallback(async (cardData: { currentCard: RoomState["currentCard"]; extraPlays: number; hands: Record<string, RoomCard[]>; piles: Record<string, RoomCard[]>; activeRole: Role }) => {
    if (!code) return;
    await updateDoc(doc(db, "rooms", code), {
      ...cardData,
      lastUpdated: serverTimestamp(),
    });
  }, [code]);

  const finishCard = useCallback(async (nextState: { activeRole: Role | null; extraPlays: number; currentCard: null; hands: Record<string, RoomCard[]>; piles: Record<string, RoomCard[]> }) => {
    if (!code) return;
    await updateDoc(doc(db, "rooms", code), {
      ...nextState,
      lastUpdated: serverTimestamp(),
    });
  }, [code]);

  const leaveRoom = useCallback(async () => {
    if (!code || !userId) return;
    await updateDoc(doc(db, "rooms", code), {
      [`players.${userId}`]: deleteField(),
      lastUpdated: serverTimestamp(),
    });
    setCode("");
    setRoom(null);
    localStorage.removeItem("nc-room-code");
  }, [code, userId]);

  return { room, code, error, loading, createRoom, joinRoom, startGame, playCard, finishCard, leaveRoom, setCode };
}
