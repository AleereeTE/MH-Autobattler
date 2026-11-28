/**
 * Emplacement de la sauvegarde du mode run (une seule run), dans le navigateur.
 * Le stockage peut être indisponible (navigation privée, tests) : la run marche alors sans être sauvegardée.
 */

const STORAGE_KEY = 'mh-autobattler:run-save';

export interface RunSaveStore {
  load(): string | null;
  save(data: string): void;
  clear(): void;
}

/** Stockage du navigateur (localStorage). */
export const browserRunSaveStore: RunSaveStore = {
  load() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  save(data) {
    try {
      window.localStorage.setItem(STORAGE_KEY, data);
    } catch {
      // Stockage indisponible ou plein : la run continue sans sauvegarde.
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Rien à effacer.
    }
  },
};

/** Stockage en mémoire, pour les tests. */
export function memoryRunSaveStore(initial: string | null = null): RunSaveStore & { readonly data: string | null } {
  let data = initial;
  return {
    get data() {
      return data;
    },
    load: () => data,
    save: (value) => {
      data = value;
    },
    clear: () => {
      data = null;
    },
  };
}
