import type { StarRank } from '../data/definitions.ts';
import { ECONOMY, RUN_STRUCTURE } from '../data/run-balance.ts';

/** Exemplaires représentés par une unité : 1 au ★1, 3 au ★2, 9 au ★3. */
export function copiesForRank(rank: StarRank): number {
  return 3 ** (rank - 1);
}

/** ✅ +1 zenny par tranche de 10 zennys épargnés, 5 au maximum (`cap` : plafond relevé par un talent). */
export function interest(zennys: number, cap: number = ECONOMY.maxInterest): number {
  return Math.min(cap, Math.floor(Math.max(0, zennys) / ECONOMY.interestStep));
}

/** Revenu du début de tour : base (même en défaite) + bonus de victoire + intérêts (plafonnés à `interestCap`). */
export function roundIncome(zennys: number, wonLastCombat: boolean, interestCap: number = ECONOMY.maxInterest): number {
  return ECONOMY.baseIncome + (wonLastCombat ? ECONOMY.winBonus : 0) + interest(zennys, interestCap);
}

/** Prix de revente : coût × exemplaires représentés. */
export function sellValue(cost: number, rank: StarRank): number {
  return cost * copiesForRank(rank);
}

/** Prix pour passer au niveau suivant, ou null au niveau maximum. */
export function levelUpCost(level: number): number | null {
  if (level >= RUN_STRUCTURE.maxLevel) return null;
  return ECONOMY.levelUpCosts[level] ?? null;
}
