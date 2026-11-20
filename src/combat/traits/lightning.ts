import { dealDamage } from '../actions/damage.ts';
import { livingEnemies } from '../behaviors/targeting.ts';
import { SIDES, isTargetable, type CombatState } from '../state.ts';

/**
 * ✅ Trait Foudre : à intervalles réguliers, un éclair frappe un ennemi tiré au hasard.
 * L'éclair est attribué à la première unité Foudre encore debout ; s'il n'y en a plus, il ne tombe pas.
 */
export function tickLightning(state: CombatState): void {
  for (const side of SIDES) {
    const lightning = state.lightning[side];
    if (lightning === null) continue;

    lightning.ticksUntilStrike -= 1;
    if (lightning.ticksUntilStrike > 0) continue;
    lightning.ticksUntilStrike = lightning.intervalTicks;

    const caller = state.units.find((unit) => unit.side === side && isTargetable(unit) && unit.def.element === 'thunder');
    if (caller === undefined) continue;
    const enemies = livingEnemies(caller, state.units);
    const target = enemies[Math.floor(state.rng.next() * enemies.length)];
    if (target === undefined) continue;

    state.events.push({ type: 'lightning', tick: state.tick, sourceUid: caller.uid, targetUid: target.uid });
    dealDamage(state, caller, target, { amount: lightning.damage, type: 'elemental', isCrit: false, cause: 'lightning' });
  }
}
