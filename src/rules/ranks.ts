import { BALANCE } from '../data/balance.ts';
import type { RankValues, StarRank, Stats } from '../data/definitions.ts';

/**
 * Rangs ★ (game-design §3.4) : 3 exemplaires identiques donnent le rang supérieur.
 * ✅ Seuls les PV et l'attaque brute augmentent (×1,8 à chaque rang) ; la compétence
 * a une valeur de base propre à chaque rang. Durées et pourcentages ne changent pas.
 */

export const STAR_RANKS: readonly StarRank[] = [1, 2, 3];

export function isStarRank(value: unknown): value is StarRank {
  return value === 1 || value === 2 || value === 3;
}

/** Multiplicateur des PV et de l'attaque brute : ×1 au ★1, ×1,8 au ★2, ×3,24 au ★3. */
export function rankMultiplier(rank: StarRank): number {
  return BALANCE.rankStatMultiplier ** (rank - 1);
}

/** Statistiques de base d'une fiche au rang donné. */
export function rankedStats(stats: Stats, rank: StarRank): Stats {
  const multiplier = rankMultiplier(rank);
  return { ...stats, hp: stats.hp * multiplier, attack: stats.attack * multiplier };
}

/** Valeur correspondant au rang dans une liste [★1, ★2, ★3]. */
export function valueForRank(values: RankValues, rank: StarRank): number {
  return values[rank - 1] ?? values[0];
}

/** « ★★ » pour le rang 2. */
export function rankStars(rank: StarRank): string {
  return '★'.repeat(rank);
}
