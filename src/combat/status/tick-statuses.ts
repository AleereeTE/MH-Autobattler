import { dealDamage } from '../actions/damage.ts';
import { TICKS_PER_SECOND } from '../constants.ts';
import { findUnitByUid, type CombatState, type CombatUnit } from '../state.ts';
import { tickModifiers } from './modifiers.ts';
import { tickShields } from './shields.ts';

/** Fait vieillir les effets temporaires d'une unité ; la brûlure inflige ses dégâts chaque seconde. */
export function tickStatuses(state: CombatState, unit: CombatUnit): void {
  tickModifiers(unit);
  tickShields(unit);
  tickBurn(state, unit);
}

function tickBurn(state: CombatState, unit: CombatUnit): void {
  const burn = unit.burn;
  if (burn === null) return;

  burn.remainingTicks -= 1;
  burn.ticksUntilDamage -= 1;
  if (burn.ticksUntilDamage <= 0) {
    burn.ticksUntilDamage = TICKS_PER_SECOND;
    const source = findUnitByUid(state, burn.sourceUid);
    if (source !== undefined) {
      dealDamage(state, source, unit, { amount: burn.damagePerSecond, type: 'elemental', isCrit: false, cause: 'burn' });
    }
  }
  if (burn.remainingTicks <= 0) unit.burn = null;
}
