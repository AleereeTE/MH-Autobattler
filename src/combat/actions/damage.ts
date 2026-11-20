import type { DamageType } from '../../data/definitions.ts';
import { mitigate } from '../../rules/damage.ts';
import { suddenDeathDamageMultiplier } from '../../rules/sudden-death.ts';
import { energyProfileOf, gainEnergy } from '../energy.ts';
import type { DamageCause } from '../events.ts';
import { elapsedSeconds, type CombatState, type CombatUnit } from '../state.ts';
import { absorbWithShields } from '../status/shields.ts';
import { applyOnHitEffects } from './on-hit.ts';

export interface Hit {
  /** Dégâts avant réduction par la défense. */
  readonly amount: number;
  readonly type: DamageType;
  readonly isCrit: boolean;
  readonly cause: DamageCause;
}

/**
 * Applique un coup à une cible et renvoie les dégâts infligés (bouclier compris).
 * 1. ✅ l'armure réduit les dégâts physiques, la résistance élémentaire les dégâts élémentaires ;
 * 2. ✅ la mort subite augmente les dégâts ; la réduction de dégâts (Bastion) les diminue ;
 * 3. les boucliers absorbent ce qu'ils peuvent, le reste retire des PV ;
 * 4. ✅ la cible gagne l'énergie prévue par son rôle pour un coup subi ;
 * 5. une attaque ou une compétence applique les effets d'élément (brûlure, ralentissement).
 * Le K.O. éventuel est résolu plus tard, en fin de tick.
 */
export function dealDamage(state: CombatState, source: CombatUnit, target: CombatUnit, hit: Hit): number {
  const defense = hit.type === 'physical' ? target.stats.armor : target.stats.elementalResist;
  const amount =
    mitigate(hit.amount, defense) *
    suddenDeathDamageMultiplier(elapsedSeconds(state)) *
    (1 - target.stats.damageReduction);

  const absorbed = absorbWithShields(target, amount);
  target.hp -= amount - absorbed;
  gainEnergy(target, energyProfileOf(target).perHitTaken);

  state.events.push({
    type: 'damage',
    tick: state.tick,
    sourceUid: source.uid,
    targetUid: target.uid,
    amount,
    absorbed,
    damageType: hit.type,
    cause: hit.cause,
    isCrit: hit.isCrit,
    hpAfter: Math.max(0, target.hp),
  });

  if (hit.cause === 'attack' || hit.cause === 'skill') applyOnHitEffects(state, source, target);
  return amount;
}
