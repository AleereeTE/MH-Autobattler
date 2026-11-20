import { BALANCE } from '../data/balance.ts';
import type { Ratio, Stats } from '../data/definitions.ts';

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
 * ⚠️ Formule provisoire (question ouverte n°5) : base + Σ (ratio × statistique).
 * Sert aux dégâts, aux boucliers et aux soins des compétences.
 * Exemple : base 50 et 150 % de l'attaque brute, avec 100 d'attaque → 50 + 1,5 × 100 = 200.
 */
export function scaledAmount(effect: { base: number; ratios: readonly Ratio[] }, stats: Stats): number {
  return effect.ratios.reduce((total, { stat, ratio }) => total + ratio * stats[stat], effect.base);
}
