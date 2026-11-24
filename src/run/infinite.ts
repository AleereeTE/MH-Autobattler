import type { StatBonus } from '../data/definitions.ts';
import { INFINITE_MODE } from '../data/run-balance.ts';
import type { RunState } from './state.ts';
import { TOTAL_HUNTS } from './structure.ts';

/**
 * ✅ Mode infini (game-design §2.2) : proposé après avoir gagné la run, il continue les stages au-delà du 3e,
 * avec la carte, l'économie et les récompenses habituelles, et le même compteur de défaites.
 * Les escouades suivent les règles du stage 3, et les ennemis se renforcent à chaque étape.
 */

/** Étape du mode infini (au-delà de la 30e). */
export function isInfiniteHunt(hunt: number): boolean {
  return hunt > TOTAL_HUNTS;
}

/** Renforcement des ennemis à cette étape : 0 pendant la run, puis +5 % par étape au-delà de la 30e (0,05 = +5 %). */
export function infiniteGrowth(hunt: number): number {
  return Math.max(0, hunt - TOTAL_HUNTS) * INFINITE_MODE.statGrowthPerHunt;
}

/** Bonus de PV, d'attaque brute et de puissance élémentaire des ennemis à cette étape, ou null pendant la run. */
export function infiniteEnemyBonus(hunt: number): StatBonus | null {
  const growth = infiniteGrowth(hunt);
  return growth > 0 ? { hpPercent: growth, attackPercent: growth, elementalPowerPercent: growth } : null;
}

/** Le mode infini se propose à la fin d'une run gagnée, une seule fois. */
export function canContinueInfinite(state: RunState): boolean {
  return state.phase === 'over' && state.outcome === 'victory' && !state.infinite;
}
