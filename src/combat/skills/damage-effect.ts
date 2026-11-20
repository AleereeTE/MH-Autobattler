import { hexDistance } from '../../core/hex.ts';
import type { DamageEffect } from '../../data/definitions.ts';
import { applyCrit, scaledAmount } from '../../rules/damage.ts';
import { dealDamage } from '../actions/damage.ts';
import { leapNextTo } from '../actions/leap.ts';
import { livingEnemies, selectTarget } from '../behaviors/targeting.ts';
import { secondsToTicks } from '../constants.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { addModifier } from '../status/modifiers.ts';

/** Ennemis touchés : la cible principale (et ses voisins si rayon), ou la zone autour du lanceur. */
function findVictims(state: CombatState, caster: CombatUnit, effect: DamageEffect): CombatUnit[] {
  const radius = effect.radius ?? 0;
  if (effect.target === 'self') {
    return livingEnemies(caster, state.units).filter((enemy) => hexDistance(enemy.position, caster.position) <= radius);
  }

  const mainTarget = selectTarget(effect.target, caster, state.units);
  if (mainTarget === null) return [];
  if (effect.leap === true) leapNextTo(state, caster, mainTarget);
  if (radius <= 0) return [mainTarget];
  return livingEnemies(caster, state.units).filter((enemy) => hexDistance(enemy.position, mainTarget.position) <= radius);
}

export function applyDamageEffect(state: CombatState, caster: CombatUnit, effect: DamageEffect): void {
  const amount = scaledAmount(effect, caster.stats);

  for (const victim of findVictims(state, caster, effect)) {
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
