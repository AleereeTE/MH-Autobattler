import { hexDistance } from '../core/hex.ts';
import { basicAttack } from './actions/basic-attack.ts';
import { progressMove, startMove } from './actions/move.ts';
import { acquireTarget } from './behaviors/targeting.ts';
import { TICKS_PER_SECOND } from './constants.ts';
import { gainEnergy, isEnergyFull, passiveEnergyPerTick } from './energy.ts';
import { progressCast, startCast } from './skills/cast.ts';
import { elapsedSeconds, type CombatState, type CombatUnit } from './state.ts';
import { attackSpeedOf } from './status/modifiers.ts';
import { tickStatuses } from './status/tick-statuses.ts';

/**
 * Ce que fait une unité pendant un tick, par ordre de priorité :
 * 1. faire vieillir ses effets temporaires (bonus, boucliers, brûlure) ;
 * 2. gagner son énergie passive ;
 * 3. poursuivre une incantation ou un déplacement en cours ;
 * 4. sinon : se rapprocher de sa cible, lancer sa compétence, ou attaquer.
 */
export function updateUnit(state: CombatState, unit: CombatUnit): void {
  tickStatuses(state, unit);
  gainEnergy(unit, passiveEnergyPerTick(unit));

  if (unit.cast !== null) {
    progressCast(state, unit);
    return;
  }
  if (unit.move !== null) {
    progressMove(unit);
    return;
  }

  const target = acquireTarget(unit, state.units);
  if (target === null) return;

  if (hexDistance(unit.position, target.position) > unit.stats.range) {
    startMove(state, unit, target);
    return;
  }

  // ⚠️ La compétence n'est lancée que lorsque la cible est à portée.
  if (isEnergyFull(unit)) {
    startCast(state, unit);
    return;
  }

  // ⚠️ La première attaque part après un intervalle complet (1 / vitesse d'attaque).
  unit.attackProgress += attackSpeedOf(unit, elapsedSeconds(state)) / TICKS_PER_SECOND;
  if (unit.attackProgress >= 1 - 1e-9) {
    unit.attackProgress = Math.max(0, unit.attackProgress - 1);
    basicAttack(state, unit, target);
  }
}
