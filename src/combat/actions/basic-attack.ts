import { applyCrit } from '../../rules/damage.ts';
import { energyProfileOf, gainEnergy } from '../energy.ts';
import { critChanceAgainst, registerCrit } from '../items/item-stats.ts';
import { afterBasicAttackHit } from '../items/on-attack.ts';
import { elapsedSeconds, type CombatState, type CombatUnit } from '../state.ts';
import { dealDamage } from './damage.ts';

/**
 * Attaque de base : ✅ dégâts physiques basés sur l'attaque brute, pouvant être critiques.
 * ✅ La cible peut l'esquiver (Léviathan) : ni dégâts ni effet d'élément.
 * ⚠️ L'attaquant gagne son énergie même si l'attaque est esquivée.
 * Objets : chance de critique selon la cible et le temps (Pouvoir latent, Faiblesse exploitée), armure
 * ignorée (Œil de l'esprit), puis effets d'une attaque qui touche (Éveil élémentaire, Briseur, Attaque explosion).
 */
export function basicAttack(state: CombatState, attacker: CombatUnit, target: CombatUnit): void {
  // ✅ Garde : une cible qui la porte ne subit jamais de critique d'attaque de base (le tirage a lieu quand même).
  const isCrit = state.rng.chance(critChanceAgainst(attacker, target, elapsedSeconds(state))) && target.stats.guardReduction <= 0;
  const amount = isCrit ? applyCrit(attacker.stats.attack, attacker.stats.critMultiplier) : attacker.stats.attack;

  state.events.push({ type: 'attack', tick: state.tick, uid: attacker.uid, targetUid: target.uid });
  // Le tirage d'esquive n'a lieu que si la cible peut esquiver : les autres combats restent identiques à graine égale.
  if (target.stats.dodgeChance > 0 && state.rng.chance(target.stats.dodgeChance)) {
    state.events.push({ type: 'dodge', tick: state.tick, sourceUid: attacker.uid, targetUid: target.uid });
  } else {
    dealDamage(state, attacker, target, { amount, type: 'physical', isCrit, cause: 'attack', armorPenetration: attacker.stats.armorPenetration });
    if (isCrit) registerCrit(attacker);
    afterBasicAttackHit(state, attacker, target);
  }
  // ✅ Récupération d'endurance : de l'énergie en plus à chaque attaque de base.
  gainEnergy(attacker, energyProfileOf(attacker).perAttack + attacker.stats.energyPerAttack);
}
