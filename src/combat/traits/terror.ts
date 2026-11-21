import { BLACK_DRAGON_TRAIT } from '../../rules/board-limits.ts';
import { SIDES, isTargetable, type CombatState, type CombatUnit, type Side } from '../state.ts';

/**
 * ✅ Terreur (trait Dragon noir) : tant qu'un Dragon noir d'un camp est en vie,
 * toutes les unités du camp adverse infligent moins de dégâts (attaques, compétences, brûlures, éclairs).
 */

function opposite(side: Side): Side {
  return SIDES.find((other) => other !== side) ?? side;
}

/** Multiplicateur des dégâts infligés par `source` (1 = aucun effet). */
export function terrorMultiplier(state: CombatState, source: CombatUnit): number {
  const feared = opposite(source.side);
  const reduction = state.terror[feared];
  if (reduction <= 0) return 1;
  const blackDragonAlive = state.units.some(
    (unit) => unit.side === feared && isTargetable(unit) && unit.def.traits.includes(BLACK_DRAGON_TRAIT),
  );
  return blackDragonAlive ? 1 - reduction : 1;
}
