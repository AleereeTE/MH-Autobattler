/**
 * Générateur de nombres pseudo-aléatoires à graine (algorithme mulberry32).
 *
 * Même graine => même suite de nombres : un combat peut donc être rejoué à l'identique.
 * Le moteur ne doit JAMAIS utiliser Math.random() ; tout le hasard passe par ici.
 */
export interface Rng {
  /** Nombre dans l'intervalle [0, 1[. */
  next(): number;
  /** Renvoie true avec la probabilité donnée (entre 0 et 1). */
  chance(probability: number): boolean;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    chance(probability) {
      if (probability <= 0) return false;
      if (probability >= 1) return true;
      return next() < probability;
    },
  };
}
