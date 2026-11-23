import { dealDamage } from '../actions/damage.ts';
import { healUnit } from '../actions/heal.ts';
import { TICKS_PER_SECOND } from '../constants.ts';
import { findUnitByUid, type CombatState, type CombatUnit } from '../state.ts';
import { tickParalysis, tickPoison } from './ailments.ts';
import { tickModifiers } from './modifiers.ts';
import { tickShields } from './shields.ts';

/**
 * Fait vieillir les effets temporaires d'une unité ; la brûlure inflige ses dégâts chaque seconde,
 * et la Récupération rend des PV chaque seconde.
 */
export function tickStatuses(state: CombatState, unit: CombatUnit): void {
  tickModifiers(unit);
  tickShields(unit);
  tickBurn(state, unit);
  tickDefenseBuff(unit);
  tickRegeneration(state, unit);
  tickPoison(state, unit);
  tickParalysis(unit);
}

/** Garde renforcée : le bonus d'armure et de résistance s'arrête au bout de sa durée. */
function tickDefenseBuff(unit: CombatUnit): void {
  if (unit.defenseBuff === null) return;
  unit.defenseBuff.remainingTicks -= 1;
  if (unit.defenseBuff.remainingTicks <= 0) unit.defenseBuff = null;
}

/** ✅ Récupération : une part des PV max rendue une fois par seconde (un seul événement de soin par seconde). */
function tickRegeneration(state: CombatState, unit: CombatUnit): void {
  if (unit.stats.regenPercentPerSecond <= 0 || state.tick % TICKS_PER_SECOND !== 0 || unit.hp >= unit.stats.hp) return;
  healUnit(state, unit, unit, unit.stats.hp * unit.stats.regenPercentPerSecond);
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
