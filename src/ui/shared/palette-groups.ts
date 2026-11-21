import type { UnitCost, UnitDefinition } from '../../data/definitions.ts';

/** Filtre de la liste des unités : un coût précis, ou `null` pour tout afficher. */
export type CostFilter = UnitCost | null;

export interface PaletteGroup {
  readonly cost: UnitCost;
  readonly units: readonly UnitDefinition[];
}

/** Coûts présents parmi les unités, du moins cher au plus cher (un bouton de filtre par coût). */
export function availableCosts(units: readonly UnitDefinition[]): UnitCost[] {
  return [...new Set(units.map((unit) => unit.cost))].sort((a, b) => a - b);
}

/**
 * Groupes de la liste du bac à sable : un groupe par coût, du moins cher au plus cher,
 * unités triées par nom. Avec un filtre, seul le groupe du coût choisi reste.
 */
export function paletteGroups(units: readonly UnitDefinition[], filter: CostFilter): PaletteGroup[] {
  return availableCosts(units)
    .filter((cost) => filter === null || cost === filter)
    .map((cost) => ({
      cost,
      units: units.filter((unit) => unit.cost === cost).sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

/** Nouveau filtre après un clic sur le bouton d'un coût : recliquer sur le coût actif réaffiche tout. */
export function toggleCostFilter(current: CostFilter, clicked: CostFilter): CostFilter {
  return clicked === current ? null : clicked;
}
