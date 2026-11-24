import type { TraitId, UnitDefinition } from '../data/definitions.ts';
import type { Equipment } from '../data/items.ts';
import { elementTraitId, findTrait, type TraitDefinition, type TraitTier } from '../data/traits.ts';
import { countObjects } from './equipment.ts';

/** Traits d'une unité : son élément (trait principal) puis ses traits secondaires. */
export function unitTraitIds(unit: UnitDefinition): TraitId[] {
  return [elementTraitId(unit.element), ...unit.traits];
}

/** Unités en plus pour certains traits (talents de chasseur Insigne, Blason, Couronne). */
export type TraitCountBonus = Readonly<Record<TraitId, number>>;

/**
 * Compte les unités de chaque trait dans une équipe.
 * ⚠️ Comme dans TFT, deux exemplaires de la même unité ne comptent qu'une fois.
 * ✅ `bonus` (talents) s'ajoute aux traits qui ont au moins une unité dans l'équipe.
 */
export function countTraits(units: readonly UnitDefinition[], bonus: TraitCountBonus = {}): Map<TraitId, number> {
  const seen = new Set<string>();
  const counts = new Map<TraitId, number>();
  for (const unit of units) {
    if (seen.has(unit.id)) continue;
    seen.add(unit.id);
    for (const id of unitTraitIds(unit)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const [id, extra] of Object.entries(bonus)) {
    const count = counts.get(id);
    if (count !== undefined && extra > 0) counts.set(id, count + extra);
  }
  return counts;
}

/**
 * Nombre d'objets complets portés par les unités de chaque trait d'une équipe (Guilde).
 * Contrairement au décompte des unités, chaque exemplaire compte : ce sont les objets qu'on additionne.
 */
export function objectsWornByTrait(members: readonly { readonly unit: UnitDefinition; readonly equipment?: Equipment }[]): Map<TraitId, number> {
  const objects = new Map<TraitId, number>();
  for (const { unit, equipment = [] } of members) {
    const count = countObjects(equipment);
    if (count === 0) continue;
    for (const id of unitTraitIds(unit)) objects.set(id, (objects.get(id) ?? 0) + count);
  }
  return objects;
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
export function traitStatuses(units: readonly UnitDefinition[], bonus: TraitCountBonus = {}): TraitStatus[] {
  const statuses: TraitStatus[] = [];
  for (const [id, count] of countTraits(units, bonus)) {
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
