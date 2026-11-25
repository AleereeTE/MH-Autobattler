import { BALANCE } from '../data/balance.ts';
import type { RankValues, SkillDefinition, StarRank, Stats, UnitDefinition } from '../data/definitions.ts';

/**
 * Rangs ★ (game-design §3.4) : 3 exemplaires identiques donnent le rang supérieur.
 * ✅ Seuls les PV et l'attaque brute augmentent (×1,8 à chaque rang). La compétence a une valeur de base
 * propre à chaque rang, et ses pourcentages de statistique augmentent (×1,25 au ★2, ×1,5 au ★3).
 * Les durées et les autres pourcentages (ralentissements, bonus de vitesse) ne changent pas.
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

/** Multiplicateur des pourcentages de statistique d'une compétence : ×1, ×1,25 puis ×1,5. */
export function skillRatioMultiplier(rank: StarRank): number {
  return valueForRank(BALANCE.skillRatioRankMultipliers, rank);
}

/** Pourcentage d'une compétence au rang donné (ex. 2,5 → 3,125 au ★2). */
export function ratioForRank(ratio: number, rank: StarRank): number {
  return ratio * skillRatioMultiplier(rank);
}

/** Valeur correspondant au rang dans une liste [★1, ★2, ★3]. */
export function valueForRank(values: RankValues, rank: StarRank): number {
  return values[rank - 1] ?? values[0];
}

/** « ★★ » pour le rang 2. */
export function rankStars(rank: StarRank): string {
  return '★'.repeat(rank);
}

/** Compétence utilisée à ce rang : la compétence secrète au ★3 si l'unité en a une (Dragons noirs), sinon la sienne. */
export function skillForRank(unit: UnitDefinition, rank: StarRank): SkillDefinition {
  return rank === 3 && unit.masterSkill !== undefined ? unit.masterSkill : unit.skill;
}

/** Cette compétence est-elle la compétence secrète du ★3 de l'unité ? */
export function isMasterSkill(unit: UnitDefinition, skillId: string): boolean {
  return unit.masterSkill?.id === skillId;
}
