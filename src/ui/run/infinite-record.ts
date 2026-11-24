/**
 * Record du mode infini : la plus haute étape atteinte, gardée dans le navigateur d'une run à l'autre.
 * Le stockage peut être indisponible (navigation privée, tests) : le record marche alors sans être mémorisé.
 */

const STORAGE_KEY = 'mh-autobattler:infinite-record';

export interface RecordStore {
  load(): number;
  save(step: number): void;
}

/** Lit un record enregistré ; tout contenu illisible donne 0 (aucun record). */
export function parseRecord(raw: string | null): number {
  const value = Number(raw);
  return raw !== null && Number.isInteger(value) && value > 0 ? value : 0;
}

/** Stockage du navigateur (localStorage). */
export const browserRecordStore: RecordStore = {
  load() {
    try {
      return parseRecord(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      return 0;
    }
  },
  save(step) {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(step));
    } catch {
      // Stockage indisponible : le record ne sera simplement pas mémorisé.
    }
  },
};

/** Stockage en mémoire, pour les tests. */
export function memoryRecordStore(initial = 0): RecordStore {
  let record = initial;
  return {
    load: () => record,
    save: (step) => {
      record = step;
    },
  };
}
