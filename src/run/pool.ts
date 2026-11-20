import type { Rng } from '../core/rng.ts';
import { weightedIndex } from '../core/random.ts';
import type { UnitCost, UnitDefinition } from '../data/definitions.ts';
import { COPIES_BY_COST, SHOP_ODDS } from '../data/run-balance.ts';
import { UNITS, findUnit } from '../data/units/index.ts';

/**
 * Stock commun des exemplaires : la boutique et les récompenses y piochent,
 * les ventes et les relances y remettent les unités.
 */

export function createPool(units: readonly UnitDefinition[] = UNITS): Map<string, number> {
  return new Map(units.map((unit) => [unit.id, COPIES_BY_COST[unit.cost] ?? 0]));
}

export function takeCopies(pool: Map<string, number>, unitId: string, copies: number): boolean {
  const left = pool.get(unitId) ?? 0;
  if (left < copies) return false;
  pool.set(unitId, left - copies);
  return true;
}

export function returnCopies(pool: Map<string, number>, unitId: string, copies: number): void {
  pool.set(unitId, (pool.get(unitId) ?? 0) + copies);
}

/** Probabilités (en %) de chaque coût pour un niveau de boutique, index 0 = coût 1. */
export function costOdds(level: number): readonly number[] {
  return SHOP_ODDS[level] ?? SHOP_ODDS[1] ?? [100];
}

/**
 * Tire une unité comme la boutique : d'abord un coût selon le niveau (parmi les coûts encore en stock),
 * puis une unité de ce coût, proportionnellement à ses exemplaires restants.
 * Ne retire rien du stock. Renvoie null si le stock est vide.
 */
export function drawUnitId(pool: ReadonlyMap<string, number>, level: number, rng: Rng): string | null {
  const odds = costOdds(level);
  const remainingByCost = (cost: number): number =>
    UNITS.filter((unit) => unit.cost === cost).reduce((sum, unit) => sum + (pool.get(unit.id) ?? 0), 0);
  const weights = odds.map((odd, index) => (remainingByCost(index + 1) > 0 ? odd : 0));
  let costIndex = weightedIndex(rng, weights);
  if (costIndex < 0) {
    // Plus rien aux coûts prévus par ce niveau : on prend n'importe quel coût encore en stock.
    costIndex = weightedIndex(rng, odds.map((_, index) => remainingByCost(index + 1)));
    if (costIndex < 0) return null;
  }
  const cost = (costIndex + 1) as UnitCost;
  const candidates = UNITS.filter((unit) => unit.cost === cost);
  const picked = candidates[weightedIndex(rng, candidates.map((unit) => pool.get(unit.id) ?? 0))];
  return picked?.id ?? null;
}

export function unitCost(unitId: string): number {
  return findUnit(unitId)?.cost ?? 0;
}
