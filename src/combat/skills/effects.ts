import type { SkillEffect } from '../../data/definitions.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { applyDamageEffect } from './damage-effect.ts';
import { applyBuffEffect, applyHealEffect, applyShieldEffect } from './support-effects.ts';

/** Applique un effet de compétence. Chaque type d'effet a sa propre fonction. */
export function applySkillEffect(state: CombatState, caster: CombatUnit, effect: SkillEffect): void {
  switch (effect.kind) {
    case 'damage':
      applyDamageEffect(state, caster, effect);
      break;
    case 'shield':
      applyShieldEffect(state, caster, effect);
      break;
    case 'heal':
      applyHealEffect(state, caster, effect);
      break;
    case 'buff':
      applyBuffEffect(state, caster, effect);
      break;
  }
}
