import { hexDistance } from '../../core/hex.ts';
import { POST_CAST_DEFENSE_SECONDS, WIDE_RANGE_RADIUS } from '../../data/items.ts';
import { secondsToTicks } from '../constants.ts';
import { gainEnergy } from '../energy.ts';
import { isTargetable, type CombatState, type CombatUnit } from '../state.ts';
import { currentSkill } from './current-skill.ts';
import { applySkillEffect } from './effects.ts';

/**
 * Lance la compétence : l'énergie retombe à 0 et l'incantation commence.
 * ⚠️ Pendant l'incantation, l'unité n'attaque pas et ne se déplace pas ; l'effet
 * s'applique à la fin du temps d'incantation.
 */
export function startCast(state: CombatState, unit: CombatUnit): void {
  const skill = currentSkill(unit);
  const castTicks = secondsToTicks(skill.castTime);

  unit.energy = 0;
  unit.cast = { remainingTicks: castTicks, skill };
  state.events.push({
    type: 'skillCast',
    tick: state.tick,
    uid: unit.uid,
    skillId: skill.id,
    skillName: skill.name,
    castTicks,
    ...(skill === unit.def.masterSkill ? { master: true } : {}),
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
  const skill = currentSkill(unit);
  state.events.push({ type: 'skillResolve', tick: state.tick, uid: unit.uid, skillId: skill.id, skillName: skill.name });
  for (const effect of skill.effects) applySkillEffect(state, unit, effect);
  // ✅ Coalescence : la compétence suivante profitera d'une compétence lancée de plus.
  unit.skillsResolved += 1;
  // ✅ Garde renforcée : armure et résistance en plus pendant quelques secondes.
  if (unit.stats.postCastDefense > 0) {
    unit.defenseBuff = { amount: unit.stats.postCastDefense, remainingTicks: secondsToTicks(POST_CAST_DEFENSE_SECONDS) };
  }
  // ✅ Grand rayon : les alliés proches gagnent de l'énergie.
  if (unit.stats.allyEnergyOnCast > 0) {
    for (const ally of state.units) {
      if (ally === unit || ally.side !== unit.side || !isTargetable(ally)) continue;
      if (hexDistance(ally.position, unit.position) <= WIDE_RANGE_RADIUS) gainEnergy(ally, unit.stats.allyEnergyOnCast);
    }
  }
  // ✅ L'énergie reste bloquée jusqu'à la fin de la compétence, effets compris.
  unit.cast = null;
  // Accumulateur : une partie de l'énergie revient après la compétence.
  gainEnergy(unit, unit.stats.energyRefundOnCast);
}
