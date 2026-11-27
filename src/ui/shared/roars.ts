import type { Frame } from '../../render/replay.ts';
import { portraitUrls } from './portraits.ts';

/**
 * Cri d'un monstre au moment d'un bandeau : Dragon noir ★3 qui lance sa compétence secrète, ou boss qui s'enrage.
 * Déposer un son dans `src/assets/sounds/`, nommé d'après l'identifiant de l'unité (`fatalis.mp3`,
 * `rathalos.ogg`, `dire-miralis.wav`…) : Vite le trouve tout seul. Sans fichier, le bandeau s'affiche sans son.
 */

/** Sons trouvés à la compilation : chemin du fichier → adresse servie par Vite. */
const FILES = import.meta.glob<string>('../../assets/sounds/*.{mp3,ogg,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const ROARS = portraitUrls(FILES);

/** Volume des cris (0 à 1). */
const ROAR_VOLUME = 0.6;

/** Joue le cri de l'unité s'il existe ; un navigateur qui bloque le son ne gêne pas le jeu. */
export function playRoar(unitId: string, urls: ReadonlyMap<string, string> = ROARS): void {
  const url = urls.get(unitId);
  if (url === undefined) return;
  const audio = new Audio(url);
  audio.volume = ROAR_VOLUME;
  audio.play().catch(() => undefined);
}

/**
 * Suit les images du replay et joue le cri une seule fois par bandeau, au moment où le bandeau apparaît
 * (pas quand on saute au milieu d'un bandeau déjà commencé, avec « Passer »).
 */
export class UltimateCue {
  private lastKey: string | null = null;
  private readonly play: (unitId: string) => void;

  constructor(play: (unitId: string) => void = playRoar) {
    this.play = play;
  }

  update(frame: Frame): void {
    const ultimate = frame.ultimate;
    if (ultimate === null) return;
    const key = `${ultimate.uid}:${ultimate.startTick}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    if (ultimate.age < 0.25) this.play(ultimate.defId);
  }

  /** Nouveau combat à regarder : les bandeaux recommencent à zéro. */
  reset(): void {
    this.lastKey = null;
  }
}
