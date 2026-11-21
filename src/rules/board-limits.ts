import { BALANCE } from '../data/balance.ts';
import type { UnitDefinition } from '../data/definitions.ts';

/**
 * ✅ Limites de composition d'un plateau (game-design §4) : un seul Dragon noir par camp.
 * Vérifiées par le mode run et le bac à sable au moment de poser une unité, et par le moteur au début du combat.
 */

export const BLACK_DRAGON_TRAIT = 'black-dragon';

export const BLACK_DRAGON_LIMIT_MESSAGE = 'Un seul Dragon noir par plateau.';

export function isBlackDragon(unit: UnitDefinition): boolean {
  return unit.traits.includes(BLACK_DRAGON_TRAIT);
}

/** true si ces unités (un même camp) comptent plus de Dragons noirs que permis. */
export function exceedsBlackDragonLimit(units: readonly UnitDefinition[]): boolean {
  return units.filter(isBlackDragon).length > BALANCE.maxBlackDragonsPerSide;
}
