import { suddenDeathHealingMultiplier } from '../../rules/sudden-death.ts';
import { elapsedSeconds, type CombatState, type CombatUnit } from '../state.ts';

/** Soigne une unité sans dépasser ses PV max. ✅ Les soins diminuent pendant la mort subite. */
export function healUnit(state: CombatState, source: CombatUnit, target: CombatUnit, rawAmount: number): number {
  const amount = rawAmount * suddenDeathHealingMultiplier(elapsedSeconds(state));
  const healed = Math.max(0, Math.min(target.stats.hp - target.hp, amount));
  target.hp += healed;
  state.events.push({
    type: 'heal',
    tick: state.tick,
    sourceUid: source.uid,
    targetUid: target.uid,
    amount: healed,
    hpAfter: target.hp,
  });
  return healed;
}
