import { isTargetable, type CombatState, type CombatUnit } from '../state.ts';
import { isImmuneToStatuses } from '../status/ailments.ts';
import { applyBurn } from '../status/burn.ts';
import { addModifier } from '../status/modifiers.ts';

/** Effets des traits d'élément appliqués par chaque coup : brûlure (Feu), ralentissement (Glace). */
export function applyOnHitEffects(state: CombatState, source: CombatUnit, target: CombatUnit): void {
  // ✅ Anti-fléaux : ni brûlure ni ralentissement.
  if (!isTargetable(target) || isImmuneToStatuses(target)) return;
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
