import { BALANCE } from '../../data/balance.ts';
import { DIVINE_BLESSING_DAMAGE_FACTOR } from '../../data/items.ts';
import type { DamageType } from '../../data/definitions.ts';
import { mitigate } from '../../rules/damage.ts';
import { suddenDeathDamageMultiplier } from '../../rules/sudden-death.ts';
import { energyProfileOf, gainEnergy } from '../energy.ts';
import type { DamageCause } from '../events.ts';
import { elapsedSeconds, isTargetable, type CombatState, type CombatUnit } from '../state.ts';
import { lifestealOf } from '../status/modifiers.ts';
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
  /** Part de l'armure ignorée (Œil de l'esprit, attaques de base seulement). */
  readonly armorPenetration?: number;
}

/**
 * Applique un coup à une cible et renvoie les dégâts infligés (bouclier compris).
 * 1. ✅ l'armure réduit les dégâts physiques, la résistance élémentaire les dégâts élémentaires ;
 * 2. ✅ la mort subite augmente les dégâts ; la réduction de dégâts (Bastion) les diminue ;
 * 3. ✅ la cible gagne l'énergie prévue par son rôle pour un coup subi, sauf si un bouclier la protège
 *    au moment du coup (même le coup qui brise le bouclier ne donne pas d'énergie) ;
 * 4. les boucliers absorbent ce qu'ils peuvent, le reste retire des PV ;
 * 5. une attaque ou une compétence applique les effets d'élément (brûlure, ralentissement, Source de vie).
 * ✅ Rage draconique : une unité Dragon sous 50 % de ses PV inflige des dégâts en plus.
 * ✅ Terreur : tant qu'un Dragon noir adverse est en vie, la source inflige moins de dégâts.
 * Le K.O. éventuel est résolu plus tard, en fin de tick.
 */
export function dealDamage(state: CombatState, source: CombatUnit, target: CombatUnit, hit: Hit): number {
  // ✅ Objets : l'armure perdue (Briseur) et l'armure ignorée (Œil de l'esprit) ne valent que contre les dégâts physiques ;
  // le bonus de Garde renforcée s'ajoute à l'armure comme à la résistance.
  const buff = target.defenseBuff?.amount ?? 0;
  const armor = Math.max(0, target.stats.armor + buff - target.armorShred) * (1 - (hit.armorPenetration ?? 0));
  const defense = hit.type === 'physical' ? armor : target.stats.elementalResist + buff;
  const amount =
    mitigate(hit.amount, defense) *
    rageMultiplier(source) *
    terrorMultiplier(state, source) *
    suddenDeathDamageMultiplier(elapsedSeconds(state)) *
    (1 - target.stats.damageReduction) *
    guardMultiplier(target, hit) *
    blessingMultiplier(state, target, hit);

  // ✅ Garde offensive : de l'énergie en plus à chaque coup subi (toujours bloquée par un bouclier).
  gainEnergy(target, energyProfileOf(target).perHitTaken + target.stats.energyPerHitTaken);
  if (!isDamageOverTime(hit)) target.hitsTaken += 1;
  const absorbed = absorbWithShields(target, amount);
  target.hp -= amount - absorbed;

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
  // ✅ Contre-attaque : une part des dégâts d'une attaque de base revient à l'attaquant (dégâts physiques d'objet).
  if (hit.cause === 'attack' && target.stats.thornsRatio > 0 && isTargetable(source)) {
    dealDamage(state, target, source, { amount: amount * target.stats.thornsRatio, type: 'physical', isCrit: false, cause: 'item' });
  }
  // ✅ Soif de sang (et furie de Lea) : l'unité se soigne d'une part des dégâts de ses attaques, compétences et effets d'objets.
  const lifesteal = lifestealOf(source);
  if (!isDamageOverTime(hit) && hit.cause !== 'lightning' && lifesteal > 0 && isTargetable(source) && source.hp < source.stats.hp) {
    healUnit(state, source, source, amount * lifesteal);
  }
  return amount;
}

/** Dégâts sur la durée (brûlure, poison) : ce ne sont pas des « coups » pour les objets. */
function isDamageOverTime(hit: Hit): boolean {
  return hit.cause === 'burn' || hit.cause === 'poison';
}

/** ✅ Garde : les attaques de base subies font moins de dégâts (et ne sont jamais critiques, voir basicAttack). */
function guardMultiplier(target: CombatUnit, hit: Hit): number {
  return hit.cause === 'attack' ? 1 - target.stats.guardReduction : 1;
}

/**
 * ✅ Bénédiction divine : une chance de réduire de moitié les dégâts d'un coup (pas d'un tic de brûlure).
 * Le tirage n'a lieu que si l'unité porte l'objet : les autres combats restent identiques à graine égale.
 */
function blessingMultiplier(state: CombatState, target: CombatUnit, hit: Hit): number {
  if (isDamageOverTime(hit) || target.stats.divineBlessingChance <= 0) return 1;
  return state.rng.chance(target.stats.divineBlessingChance) ? DIVINE_BLESSING_DAMAGE_FACTOR : 1;
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
