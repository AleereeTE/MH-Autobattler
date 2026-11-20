import { isTargetable, type CombatState, type CombatUnit } from '../state.ts';
import { applyBurn } from '../status/burn.ts';
import { addModifier } from '../status/modifiers.ts';

/** Effets des traits d'élément appliqués par chaque coup : brûlure (Feu), ralentissement (Glace). */
export function applyOnHitEffects(state: CombatState, source: CombatUnit, target: CombatUnit): void {
  if (!isTargetable(target)) return;
  const { burn, chill } = source.onHit;

  if (burn !== undefined) {
    applyBurn(target, source.uid, burn);
    state.events.push({ type: 'status', tick: state.tick, uid: target.uid, status: 'burn', durationTicks: burn.durationTicks });
  }
  if (chill !== undefined) {
    addModifier(target, 'trait:chill', chill.attackSpeedPercent, chill.durationTicks);
    state.events.push({ type: 'status', tick: state.tick, uid: target.uid, status: 'chill', durationTicks: chill.durationTicks });
  }
}
