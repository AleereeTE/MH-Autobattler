import { BALANCE } from '../../data/balance.ts';
import type { DamageType } from '../../data/definitions.ts';
import { mitigate } from '../../rules/damage.ts';
import { suddenDeathDamageMultiplier } from '../../rules/sudden-death.ts';
import { energyProfileOf, gainEnergy } from '../energy.ts';
import type { DamageCause } from '../events.ts';
import { elapsedSeconds, isTargetable, type CombatState, type CombatUnit } from '../state.ts';
import { absorbWithShields } from '../status/shields.ts';
import { terrorMultiplier } from '../traits/terror.ts';
import { healUnit } from './heal.ts';
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
 * 5. une attaque ou une compétence applique les effets d'élément (brûlure, ralentissement, Source de vie).
 * ✅ Rage draconique : une unité Dragon sous 50 % de ses PV inflige des dégâts en plus.
 * ✅ Terreur : tant qu'un Dragon noir adverse est en vie, la source inflige moins de dégâts.
 * Le K.O. éventuel est résolu plus tard, en fin de tick.
 */
export function dealDamage(state: CombatState, source: CombatUnit, target: CombatUnit, hit: Hit): number {
  const defense = hit.type === 'physical' ? target.stats.armor : target.stats.elementalResist;
  const amount =
    mitigate(hit.amount, defense) *
    rageMultiplier(source) *
    terrorMultiplier(state, source) *
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

  if (hit.cause === 'attack' || hit.cause === 'skill') {
    applyOnHitEffects(state, source, target);
    lifeSource(state, source, amount);
  }
  return amount;
}

/** Bonus de la Rage draconique si l'unité est sous le seuil de PV. */
function rageMultiplier(source: CombatUnit): number {
  if (source.stats.lowHpDamageBonus <= 0 || source.hp >= source.stats.hp * BALANCE.rageHpThreshold) return 1;
  return 1 + source.stats.lowHpDamageBonus;
}

/**
 * ✅ Source de vie (Eau) : une part des dégâts infligés soigne l'allié le plus blessé.
 * ⚠️ « Le plus blessé » = le plus petit pourcentage de PV, l'unité elle-même comprise ; à égalité, le plus petit identifiant.
 */
function lifeSource(state: CombatState, source: CombatUnit, damage: number): void {
  if (source.stats.lifeSourceRatio <= 0 || !isTargetable(source)) return;
  let mostWounded: CombatUnit | null = null;
  for (const ally of state.units) {
    if (ally.side !== source.side || !isTargetable(ally) || ally.hp >= ally.stats.hp) continue;
    if (mostWounded === null || ally.hp / ally.stats.hp < mostWounded.hp / mostWounded.stats.hp) mostWounded = ally;
  }
  if (mostWounded !== null) healUnit(state, source, mostWounded, damage * source.stats.lifeSourceRatio);
}
