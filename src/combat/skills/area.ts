import type { Hex } from '../../core/hex.ts';
import type { SkillEffectKind } from '../events.ts';
import type { CombatState, CombatUnit } from '../state.ts';

/** Signale la zone touchée par un effet de compétence, pour que le rendu puisse l'afficher. */
export function pushSkillArea(
  state: CombatState,
  caster: CombatUnit,
  effect: SkillEffectKind,
  center: Hex,
  radius: number,
): void {
  state.events.push({ type: 'skillArea', tick: state.tick, uid: caster.uid, effect, center: { ...center }, radius });
}
