import type { Rng } from './rng.ts';

/**
 * Tirages courants construits sur le générateur à graine (jamais Math.random()).
 */

/** Entier dans [0, max[ (max ≥ 1). */
export function randomInt(rng: Rng, max: number): number {
  return Math.min(max - 1, Math.floor(rng.next() * max));
}

/** Un élément au hasard, ou undefined si la liste est vide. */
export function pickOne<T>(rng: Rng, items: readonly T[]): T | undefined {
  return items.length === 0 ? undefined : items[randomInt(rng, items.length)];
}

/**
 * Indice tiré au hasard, proportionnellement aux poids (les poids nuls ou négatifs ne sortent jamais).
 * Renvoie -1 si aucun poids n'est positif.
 */
export function weightedIndex(rng: Rng, weights: readonly number[]): number {
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (total <= 0) return -1;
  let roll = rng.next() * total;
  for (let index = 0; index < weights.length; index++) {
    const weight = Math.max(0, weights[index] ?? 0);
    if (roll < weight) return index;
    roll -= weight;
  }
  // Sécurité contre les arrondis : le dernier poids positif.
  for (let index = weights.length - 1; index >= 0; index--) if ((weights[index] ?? 0) > 0) return index;
  return -1;
}
