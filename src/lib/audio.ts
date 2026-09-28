export type Sound = { volume: number; muted: boolean };
export type Playback = { stop: () => void; setSound: (sound: Sound) => void };

/**
 * Toca os primeiros `seconds` segundos de `src`. O tempo vem do próprio áudio
 * (currentTime): se a rede atrasar, o jogador ainda ouve o trecho inteiro.
 * `setSound` ajusta o volume durante a reprodução. No iOS o volume é só do
 * botão físico do aparelho — lá apenas `muted` funciona.
 */
export function playOpening(
  src: string,
  seconds: number,
  sound: Sound,
  onTick: (elapsed: number) => void,
  onEnd: () => void,
  onError: () => void,
): Playback {
  const audio = new Audio(src);
  let raf = 0;
  let stopped = false;

  const setSound = ({ volume, muted }: Sound) => {
    audio.volume = volume;
    audio.muted = muted;
  };
  setSound(sound);

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  };
  const finish = (cb: () => void) => () => {
    if (stopped) return;
    stop();
    cb();
  };
  const end = finish(onEnd);
  const fail = finish(onError);

  const tick = () => {
    if (stopped) return;
    if (audio.currentTime >= seconds) return end();
    onTick(audio.currentTime);
    raf = requestAnimationFrame(tick);
  };

  audio.addEventListener("ended", end);
  audio.addEventListener("error", fail);
  audio.play().then(() => {
    raf = requestAnimationFrame(tick);
  }, fail);
  return { stop, setSound };
}
