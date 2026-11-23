import { PARALYSIS_SECONDS, POISON_SECONDS } from '../../data/items.ts';
import { dealDamage } from '../actions/damage.ts';
import { TICKS_PER_SECOND, secondsToTicks } from '../constants.ts';
import { findUnitByUid, isTargetable, type CombatState, type CombatUnit } from '../state.ts';

/**
 * Statuts apportés par les objets du lot 3 : poison (Attaque poison) et paralysie (Attaque paralysie).
 * ✅ Anti-fléaux rend immunisé à ces statuts, comme à la brûlure et aux ralentissements.
 */

/** L'unité est-elle immunisée aux statuts (Anti-fléaux) ? */
export function isImmuneToStatuses(unit: CombatUnit): boolean {
  return unit.stats.statusImmunity > 0;
}

/**
 * ✅ Attaque poison : la cible perd des PV chaque seconde pendant 4 s (dégâts élémentaires) et reçoit moins de soins.
 * Un nouveau poison remplace l'ancien et repart pour toute sa durée, sans décaler le prochain tic.
 */
export function applyPoison(state: CombatState, source: CombatUnit, target: CombatUnit): void {
  if (source.stats.poisonDamage <= 0 || !isTargetable(target) || isImmuneToStatuses(target)) return;
  const durationTicks = secondsToTicks(POISON_SECONDS);
  target.poison = {
    sourceUid: source.uid,
    damagePerSecond: source.stats.poisonDamage + source.stats.poisonElementalRatio * source.stats.elementalPower,
    remainingTicks: durationTicks,
    ticksUntilDamage: target.poison?.ticksUntilDamage ?? TICKS_PER_SECOND,
  };
  state.events.push({ type: 'status', tick: state.tick, uid: target.uid, status: 'poison', durationTicks });
}

/**
 * ✅ Attaque paralysie : une chance de paralyser la cible, qui n'agit plus pendant 1,5 s.
 * Le tirage n'a lieu que si l'attaquant porte l'objet.
 */
export function tryParalyze(state: CombatState, source: CombatUnit, target: CombatUnit): void {
  if (source.stats.paralysisChance <= 0 || !isTargetable(target) || isImmuneToStatuses(target)) return;
  if (!state.rng.chance(source.stats.paralysisChance)) return;
  const durationTicks = secondsToTicks(PARALYSIS_SECONDS);
  target.paralyzedTicks = Math.max(target.paralyzedTicks, durationTicks);
  state.events.push({ type: 'status', tick: state.tick, uid: target.uid, status: 'paralysis', durationTicks });
}

/** Le poison inflige ses dégâts une fois par seconde, puis s'arrête au bout de sa durée. */
export function tickPoison(state: CombatState, unit: CombatUnit): void {
  const poison = unit.poison;
  if (poison === null) return;
  poison.remainingTicks -= 1;
  poison.ticksUntilDamage -= 1;
  if (poison.ticksUntilDamage <= 0) {
    poison.ticksUntilDamage = TICKS_PER_SECOND;
    const source = findUnitByUid(state, poison.sourceUid);
    if (source !== undefined) dealDamage(state, source, unit, { amount: poison.damagePerSecond, type: 'elemental', isCrit: false, cause: 'poison' });
  }
  if (poison.remainingTicks <= 0) unit.poison = null;
}

/** La paralysie s'use à chaque tick. */
export function tickParalysis(unit: CombatUnit): void {
  if (unit.paralyzedTicks > 0) unit.paralyzedTicks -= 1;
}

/** Une unité paralysée n'agit pas (ni déplacement, ni attaque, ni incantation). */
export function isParalyzed(unit: CombatUnit): boolean {
  return unit.paralyzedTicks > 0;
}
