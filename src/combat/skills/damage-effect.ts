import { hexDistance, type Hex } from '../../core/hex.ts';
import type { DamageEffect } from '../../data/definitions.ts';
import { applyCrit, scaledAmount } from '../../rules/damage.ts';
import { dealDamage } from '../actions/damage.ts';
import { leapNextTo } from '../actions/leap.ts';
import { livingEnemies, selectTarget } from '../behaviors/targeting.ts';
import { secondsToTicks } from '../constants.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { addModifier } from '../status/modifiers.ts';
import { pushSkillArea } from './area.ts';

/** Centre de la zone : le lanceur pour une zone autour de lui, sinon la cible principale (null s'il n'y en a pas). */
function findCenter(state: CombatState, caster: CombatUnit, effect: DamageEffect): Hex | null {
  if (effect.target === 'self') return caster.position;
  const mainTarget = selectTarget(effect.target, caster, state.units);
  if (mainTarget === null) return null;
  if (effect.leap === true) leapNextTo(state, caster, mainTarget);
  return mainTarget.position;
}

/** Ennemis touchés : ceux qui se trouvent dans le rayon autour du centre. */
function findVictims(state: CombatState, caster: CombatUnit, center: Hex, radius: number): CombatUnit[] {
  return livingEnemies(caster, state.units).filter((enemy) => hexDistance(enemy.position, center) <= radius);
}

export function applyDamageEffect(state: CombatState, caster: CombatUnit, effect: DamageEffect): void {
  const center = findCenter(state, caster, effect);
  if (center === null) return;
  const radius = effect.radius ?? 0;
  pushSkillArea(state, caster, 'damage', center, radius);
  const amount = scaledAmount(effect, caster.stats, caster.rank);

  for (const victim of findVictims(state, caster, center, radius)) {
    // ✅ Par défaut une compétence ne peut pas être critique ; certains traits (Berserker) le permettent.
    const isCrit = caster.stats.skillsCanCrit && state.rng.chance(caster.stats.critChance);
    dealDamage(state, caster, victim, {
      amount: isCrit ? applyCrit(amount, caster.stats.critMultiplier) : amount,
      type: effect.damageType,
      isCrit,
      cause: 'skill',
    });

    if (effect.slow !== undefined) {
      const durationTicks = secondsToTicks(effect.slow.duration);
      addModifier(victim, `skill:${caster.def.skill.id}`, effect.slow.attackSpeedPercent, durationTicks);
      state.events.push({ type: 'status', tick: state.tick, uid: victim.uid, status: 'chill', durationTicks });
    }
  }
}
