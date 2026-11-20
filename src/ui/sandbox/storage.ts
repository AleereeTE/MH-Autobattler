import type { SavedPlacement } from './model.ts';

/**
 * Mémorise la composition du bac à sable dans le navigateur, pour la retrouver après un rechargement.
 * Le stockage peut être indisponible (navigation privée…) : on ignore alors simplement l'erreur.
 */

const STORAGE_KEY = 'mh-autobattler:sandbox';

export function loadComposition(): SavedPlacement[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedPlacement[]) : null;
  } catch {
    return null;
  }
}

export function saveComposition(placements: readonly SavedPlacement[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(placements));
  } catch {
    // Stockage indisponible : la composition ne sera simplement pas mémorisée.
  }
}
