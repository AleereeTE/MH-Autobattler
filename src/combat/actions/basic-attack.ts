import { applyCrit } from '../../rules/damage.ts';
import { energyProfileOf, gainEnergy } from '../energy.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { dealDamage } from './damage.ts';

/** Attaque de base : ✅ dégâts physiques basés sur l'attaque brute, pouvant être critiques. */
export function basicAttack(state: CombatState, attacker: CombatUnit, target: CombatUnit): void {
  const isCrit = state.rng.chance(attacker.stats.critChance);
  const amount = isCrit ? applyCrit(attacker.stats.attack, attacker.stats.critMultiplier) : attacker.stats.attack;

  state.events.push({ type: 'attack', tick: state.tick, uid: attacker.uid, targetUid: target.uid });
  dealDamage(state, attacker, target, { amount, type: 'physical', isCrit, cause: 'attack' });
  gainEnergy(attacker, energyProfileOf(attacker).perAttack);
}
