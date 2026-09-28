import type { Anime } from "@/data/animes";

/**
 * Toca os primeiros `seconds` segundos da abertura.
 * Com `audioSrc` usa o arquivo real; sem, sintetiza a melodia (chiptune)
 * via Web Audio, repetindo-a até preencher o tempo liberado.
 * Devolve uma função de parada.
 */
export type StopFn = () => void;

export function playOpening(
  opening: Anime["opening"],
  seconds: number,
  onTick: (elapsed: number) => void,
  onEnd: () => void,
): StopFn {
  const started = performance.now();
  let stopped = false;
  let raf = 0;

  const tick = () => {
    if (stopped) return;
    const elapsed = (performance.now() - started) / 1000;
    if (elapsed >= seconds) {
      stop();
      onEnd();
      return;
    }
    onTick(elapsed);
    raf = requestAnimationFrame(tick);
  };

  let cleanup: () => void = () => {};

  if (opening.audioSrc) {
    const audio = new Audio(opening.audioSrc);
    audio.currentTime = 0;
    void audio.play().catch(() => {});
    cleanup = () => {
      audio.pause();
      audio.src = "";
    };
  } else {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);

    const { bpm, notes } = opening.melody;
    const beat = 60 / bpm;
    let t = ctx.currentTime + 0.03;
    const end = t + seconds;
    outer: while (t < end) {
      for (const [midi, beats] of notes) {
        const dur = beats * beat;
        if (midi > 0) {
          const freq = 440 * Math.pow(2, (midi - 69) / 12);
          for (const [type, detune, vol] of [["square", 0, 1], ["triangle", -1200, 0.6]] as const) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            osc.detune.value = detune;
            const stopAt = Math.min(t + dur, end);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(vol, t + 0.015);
            gain.gain.setTargetAtTime(0, Math.max(t, stopAt - 0.05), 0.02);
            osc.connect(gain).connect(master);
            osc.start(t);
            osc.stop(stopAt + 0.1);
          }
        }
        t += dur;
        if (t >= end) break outer;
      }
    }
    cleanup = () => void ctx.close().catch(() => {});
  }

  const stop: StopFn = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    cleanup();
  };

  raf = requestAnimationFrame(tick);
  return stop;
}
