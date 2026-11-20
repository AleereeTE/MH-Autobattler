import type { Portrait } from '../../render/board-canvas.ts';

/**
 * Portraits des unités : une image par fiche, déposée dans `src/assets/portraits/`
 * et nommée d'après l'identifiant de l'unité (`barroth.png`, `tobi-kadachi.webp`…).
 * Une unité sans portrait garde ses initiales.
 */

/** Liste des images trouvées à la compilation : chemin du fichier → adresse servie par Vite. */
const FILES = import.meta.glob<string>('../../assets/portraits/*.{png,webp,jpg,jpeg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** « ../../assets/portraits/tobi-kadachi.png » → « tobi-kadachi ». */
export function portraitId(path: string): string {
  const file = path.split('/').at(-1) ?? path;
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : file;
}

/** Associe chaque identifiant d'unité à l'adresse de son image. */
export function portraitUrls(files: Readonly<Record<string, string>>): Map<string, string> {
  return new Map(Object.entries(files).map(([path, url]) => [portraitId(path), url]));
}

/** Charge les portraits en arrière-plan ; `onLoad` est appelé à chaque image prête, pour redessiner. */
export class PortraitStore {
  private readonly loaded = new Map<string, Portrait>();

  constructor(onLoad: () => void, urls: ReadonlyMap<string, string> = portraitUrls(FILES)) {
    for (const [id, url] of urls) {
      const image = new Image();
      image.addEventListener('load', () => {
        this.loaded.set(id, { image, width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
        onLoad();
      });
      image.src = url;
    }
  }

  get(unitId: string): Portrait | null {
    return this.loaded.get(unitId) ?? null;
  }
}
