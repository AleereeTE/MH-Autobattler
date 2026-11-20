import { applyCrit } from '../../rules/damage.ts';
import { energyProfileOf, gainEnergy } from '../energy.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { dealDamage } from './damage.ts';

/**
 * Attaque de base : ✅ dégâts physiques basés sur l'attaque brute, pouvant être critiques.
 * ✅ La cible peut l'esquiver (Léviathan) : ni dégâts ni effet d'élément.
 * ⚠️ L'attaquant gagne son énergie même si l'attaque est esquivée.
 */
export function basicAttack(state: CombatState, attacker: CombatUnit, target: CombatUnit): void {
  const isCrit = state.rng.chance(attacker.stats.critChance);
  const amount = isCrit ? applyCrit(attacker.stats.attack, attacker.stats.critMultiplier) : attacker.stats.attack;

  state.events.push({ type: 'attack', tick: state.tick, uid: attacker.uid, targetUid: target.uid });
  // Le tirage d'esquive n'a lieu que si la cible peut esquiver : les autres combats restent identiques à graine égale.
  if (target.stats.dodgeChance > 0 && state.rng.chance(target.stats.dodgeChance)) {
    state.events.push({ type: 'dodge', tick: state.tick, sourceUid: attacker.uid, targetUid: target.uid });
  } else {
    dealDamage(state, attacker, target, { amount, type: 'physical', isCrit, cause: 'attack' });
  }
  gainEnergy(attacker, energyProfileOf(attacker).perAttack);
}
