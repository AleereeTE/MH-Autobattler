import type { StatBonus } from '../data/definitions.ts';
import { MATERIAL_IDS, MATERIALS, type MaterialId, type ObjectDefinition } from '../data/items.ts';
import { objectFor } from './equipment.ts';

/**
 * Recettes : les objets qu'un matériau permet de fabriquer (en le fusionnant avec chacun des 8 matériaux).
 */

export interface Recipe {
  /** Le second matériau de la recette. */
  readonly other: MaterialId;
  readonly object: ObjectDefinition;
  /** Tout ce que l'objet apporte : les statistiques de ses deux matériaux, plus son effet propre. */
  readonly bonuses: readonly StatBonus[];
}

/** Bonus complets d'un objet : ses deux matériaux + son effet. */
export function objectBonuses(materials: readonly [MaterialId, MaterialId]): StatBonus[] {
  return [MATERIALS[materials[0]].bonus, MATERIALS[materials[1]].bonus, objectFor(materials).effect];
}

/** Les 8 objets qu'on peut faire avec ce matériau, les objets à effet propre en premier. */
export function recipesWith(material: MaterialId): Recipe[] {
  const recipes = MATERIAL_IDS.map((other) => {
    const materials = [material, other] as const;
    return { other, object: objectFor(materials), bonuses: objectBonuses(materials) };
  });
  return [...recipes.filter((recipe) => !recipe.object.generic), ...recipes.filter((recipe) => recipe.object.generic)];
}
