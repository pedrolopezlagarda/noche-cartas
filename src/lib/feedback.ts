// Sonidos sintetizados con Web Audio API: sin archivos externos.
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.12,
  delay = 0,
) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** Carta de acción lanzada */
  launch: () => {
    tone(440, 0.1, "triangle", 0.14);
    tone(660, 0.12, "triangle", 0.12, 0.07);
  },
  /** Carta especial jugada */
  special: () => {
    tone(660, 0.1, "sine", 0.12);
    tone(830, 0.1, "sine", 0.11, 0.08);
    tone(990, 0.16, "sine", 0.09, 0.16);
  },
  /** Temporizador terminado */
  done: () => {
    tone(520, 0.15, "sine", 0.14);
    tone(780, 0.22, "sine", 0.11, 0.12);
  },
  /** Últimos 5 segundos */
  tick: () => tone(880, 0.05, "square", 0.045),
  /** Revelar mano / empezar temporizador */
  reveal: () => {
    tone(500, 0.08, "sine", 0.1);
    tone(750, 0.1, "sine", 0.08, 0.06);
  },
  /** Tu turno */
  turn: () => {
    tone(600, 0.1, "triangle", 0.1);
    tone(900, 0.12, "triangle", 0.07, 0.08);
  },
};

/** Vibración táctil (móviles compatibles) */
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* no soportado */
  }
}
