import { hexDistance } from '../../core/hex.ts';
import type { BuffEffect, HealEffect, ShieldEffect } from '../../data/definitions.ts';
import { scaledAmount } from '../../rules/damage.ts';
import { healUnit } from '../actions/heal.ts';
import { secondsToTicks } from '../constants.ts';
import { isTargetable, type CombatState, type CombatUnit } from '../state.ts';
import { addModifier } from '../status/modifiers.ts';
import { addShield } from '../status/shields.ts';
import { pushSkillArea } from './area.ts';

export function applyShieldEffect(state: CombatState, caster: CombatUnit, effect: ShieldEffect): void {
  const amount = scaledAmount(effect, caster.stats);
  const durationTicks = secondsToTicks(effect.duration);
  pushSkillArea(state, caster, 'shield', caster.position, 0);
  addShield(caster, amount, durationTicks);
  state.events.push({ type: 'shield', tick: state.tick, uid: caster.uid, amount, durationTicks });
}

export function applyHealEffect(state: CombatState, caster: CombatUnit, effect: HealEffect): void {
  const amount = scaledAmount(effect, caster.stats);
  pushSkillArea(state, caster, 'heal', caster.position, effect.radius);
  const allies = state.units.filter(
    (unit) =>
      unit.side === caster.side && isTargetable(unit) && hexDistance(unit.position, caster.position) <= effect.radius,
  );
  for (const ally of allies) healUnit(state, caster, ally, amount);
}

export function applyBuffEffect(state: CombatState, caster: CombatUnit, effect: BuffEffect): void {
  const durationTicks = secondsToTicks(effect.duration);
  pushSkillArea(state, caster, 'buff', caster.position, 0);
  addModifier(caster, `skill:${caster.def.skill.id}`, effect.attackSpeedPercent, durationTicks);
  state.events.push({ type: 'status', tick: state.tick, uid: caster.uid, status: 'haste', durationTicks });
}
