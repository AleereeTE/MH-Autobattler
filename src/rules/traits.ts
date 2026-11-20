import type { TraitId, UnitDefinition } from '../data/definitions.ts';
import { elementTraitId, findTrait, type TraitDefinition, type TraitTier } from '../data/traits.ts';

/** Traits d'une unité : son élément (trait principal) puis ses traits secondaires. */
export function unitTraitIds(unit: UnitDefinition): TraitId[] {
  return [elementTraitId(unit.element), ...unit.traits];
}

/**
 * Compte les unités de chaque trait dans une équipe.
 * ⚠️ Comme dans TFT, deux exemplaires de la même unité ne comptent qu'une fois.
 */
export function countTraits(units: readonly UnitDefinition[]): Map<TraitId, number> {
  const seen = new Set<string>();
  const counts = new Map<TraitId, number>();
  for (const unit of units) {
    if (seen.has(unit.id)) continue;
    seen.add(unit.id);
    for (const id of unitTraitIds(unit)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Palier atteint pour un nombre d'unités donné (le plus haut), ou null. */
export function activeTier(trait: TraitDefinition, count: number): TraitTier | null {
  let active: TraitTier | null = null;
  for (const tier of trait.tiers) {
    if (count >= tier.count) active = tier;
  }
  return active;
}

export interface TraitStatus {
  readonly trait: TraitDefinition;
  readonly count: number;
  readonly tier: TraitTier | null;
}

/** État de tous les traits présents dans une équipe : actifs d'abord, puis par nombre d'unités. */
export function traitStatuses(units: readonly UnitDefinition[]): TraitStatus[] {
  const statuses: TraitStatus[] = [];
  for (const [id, count] of countTraits(units)) {
    const trait = findTrait(id);
    if (trait !== undefined) statuses.push({ trait, count, tier: activeTier(trait, count) });
  }
  return statuses.sort(
    (a, b) =>
      Number(b.tier !== null) - Number(a.tier !== null) || b.count - a.count || a.trait.name.localeCompare(b.trait.name),
  );
}

/** Paliers actifs d'une équipe, par trait. */
export function activeTiers(units: readonly UnitDefinition[]): Map<TraitId, TraitTier> {
  const active = new Map<TraitId, TraitTier>();
  for (const status of traitStatuses(units)) {
    if (status.tier !== null) active.set(status.trait.id, status.tier);
  }
  return active;
}
