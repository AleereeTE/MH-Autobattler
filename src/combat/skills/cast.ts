import { secondsToTicks } from '../constants.ts';
import { gainEnergy } from '../energy.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { applySkillEffect } from './effects.ts';

/**
 * Lance la compétence : l'énergie retombe à 0 et l'incantation commence.
 * ⚠️ Pendant l'incantation, l'unité n'attaque pas et ne se déplace pas ; l'effet
 * s'applique à la fin du temps d'incantation.
 */
export function startCast(state: CombatState, unit: CombatUnit): void {
  const { skill } = unit.def;
  const castTicks = secondsToTicks(skill.castTime);

  unit.energy = 0;
  unit.cast = { remainingTicks: castTicks };
  state.events.push({
    type: 'skillCast',
    tick: state.tick,
    uid: unit.uid,
    skillId: skill.id,
    skillName: skill.name,
    castTicks,
  });

  if (castTicks <= 0) finishCast(state, unit);
}

/** Fait avancer l'incantation en cours ; la compétence prend effet quand elle se termine. */
export function progressCast(state: CombatState, unit: CombatUnit): void {
  if (unit.cast === null) return;
  unit.cast.remainingTicks -= 1;
  if (unit.cast.remainingTicks <= 0) finishCast(state, unit);
}

function finishCast(state: CombatState, unit: CombatUnit): void {
  const { skill } = unit.def;
  state.events.push({ type: 'skillResolve', tick: state.tick, uid: unit.uid, skillId: skill.id, skillName: skill.name });
  for (const effect of skill.effects) applySkillEffect(state, unit, effect);
  // ✅ L'énergie reste bloquée jusqu'à la fin de la compétence, effets compris.
  unit.cast = null;
  // Accumulateur : une partie de l'énergie revient après la compétence.
  gainEnergy(unit, unit.stats.energyRefundOnCast);
}
