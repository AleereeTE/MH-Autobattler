import { BALANCE } from '../data/balance.ts';
import type { RankValues, Ratio, StarRank, Stats } from '../data/definitions.ts';
import { valueForRank } from './ranks.ts';

/**
 * ✅ Réduction par ratio (game-design §6.2) : dégâts × 100 / (100 + défense).
 * Une défense négative compte comme 0.
 */
export function mitigate(amount: number, defense: number): number {
  return (amount * 100) / (100 + Math.max(0, defense));
}

/** ✅ Coup critique : multiplicateur fixe (×1,5 de base), que des traits ou objets peuvent augmenter. */
export function applyCrit(amount: number, multiplier: number = BALANCE.critMultiplier): number {
  return amount * multiplier;
}

/**
 * ⚠️ Formule provisoire (question ouverte n°5) : base du rang + Σ (ratio × statistique).
 * Sert aux dégâts, aux boucliers et aux soins des compétences.
 * Exemple : base 50 / 75 / 115 et 150 % de l'attaque brute, au ★2 avec 100 d'attaque → 75 + 1,5 × 100 = 225.
 */
export function scaledAmount(
  effect: { readonly base: RankValues; readonly ratios: readonly Ratio[] },
  stats: Stats,
  rank: StarRank,
): number {
  return effect.ratios.reduce((total, { stat, ratio }) => total + ratio * stats[stat], valueForRank(effect.base, rank));
}
