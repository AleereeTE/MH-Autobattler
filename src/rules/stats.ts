import { BALANCE } from '../data/balance.ts';
import type { StatBonus, Stats } from '../data/definitions.ts';

/** Statistiques d'une unité en combat : sa fiche + matériaux, objets et traits. */
export interface CombatStats extends Stats {
  readonly critMultiplier: number;
  readonly damageReduction: number;
  readonly skillsCanCrit: boolean;
  readonly energyRefundOnCast: number;
  readonly attackSpeedRampPerSecond: number;
  readonly attackSpeedRampMax: number;
  readonly lifeSourceRatio: number;
  readonly lowHpDamageBonus: number;
  readonly startingEnergyRatio: number;
  readonly dodgeChance: number;
  readonly onHitElementalRatio: number;
  readonly lifesteal: number;
  readonly armorShredPerAttack: number;
  readonly armorShredMax: number;
  readonly armorPenetration: number;
  readonly executeCritChance: number;
  readonly attackSpeedPerCrit: number;
  readonly attackSpeedPerCritMax: number;
  readonly latentCritChance: number;
  readonly latentAttackSpeedPercent: number;
  readonly blastDamage: number;
  readonly blastElementalRatio: number;
  readonly guardReduction: number;
  readonly thornsRatio: number;
  readonly divineBlessingChance: number;
  readonly regenPercentPerSecond: number;
  readonly attackSpeedPerHitTaken: number;
  readonly attackSpeedPerHitTakenMax: number;
  readonly energyPerHitTaken: number;
  readonly postCastDefense: number;
  readonly healShieldBonus: number;
  readonly skillDamagePerCast: number;
  readonly skillDamagePerCastMax: number;
  readonly statusImmunity: number;
  readonly poisonDamage: number;
  readonly poisonElementalRatio: number;
  readonly paralysisChance: number;
  readonly energyDrainPerAttack: number;
  readonly allyEnergyOnCast: number;
  readonly energyPerCrit: number;
  readonly energyPerAttack: number;
}

type NumericKey = Exclude<keyof StatBonus, 'skillsCanCrit'>;
type BonusTotals = Record<NumericKey, number>;

const NUMERIC_KEYS: readonly NumericKey[] = [
  'hp',
  'hpPercent',
  'attack',
  'attackPercent',
  'elementalPower',
  'elementalPowerPercent',
  'critChance',
  'critMultiplier',
  'armor',
  'elementalResist',
  'attackSpeedPercent',
  'energyRegen',
  'damageReduction',
  'energyRefundOnCast',
  'attackSpeedRampPerSecond',
  'attackSpeedRampMax',
  'lifeSourceRatio',
  'lowHpDamageBonus',
  'startingEnergyRatio',
  'dodgeChance',
  'range',
  'maxEnergyPercent',
  'onHitElementalRatio',
  'lifesteal',
  'armorShredPerAttack',
  'armorShredMax',
  'armorPenetration',
  'executeCritChance',
  'attackSpeedPerCrit',
  'attackSpeedPerCritMax',
  'latentCritChance',
  'latentAttackSpeedPercent',
  'blastDamage',
  'blastElementalRatio',
  'guardReduction',
  'thornsRatio',
  'divineBlessingChance',
  'regenPercentPerSecond',
  'attackSpeedPerHitTaken',
  'attackSpeedPerHitTakenMax',
  'energyPerHitTaken',
  'postCastDefense',
  'healShieldBonus',
  'skillDamagePerCast',
  'skillDamagePerCastMax',
  'statusImmunity',
  'poisonDamage',
  'poisonElementalRatio',
  'paralysisChance',
  'energyDrainPerAttack',
  'allyEnergyOnCast',
  'energyPerCrit',
  'energyPerAttack',
];

/** Additionne plusieurs bonus, champ par champ. */
export function sumBonuses(bonuses: readonly StatBonus[]): BonusTotals {
  const totals = Object.fromEntries(NUMERIC_KEYS.map((key) => [key, 0])) as BonusTotals;
  for (const bonus of bonuses) {
    for (const key of NUMERIC_KEYS) totals[key] += bonus[key] ?? 0;
  }
  return totals;
}

/** Multiplie chaque valeur d'un bonus (utile pour « X par objet porté »). */
export function scaleBonus(bonus: StatBonus, factor: number): StatBonus {
  const scaled: Partial<Record<NumericKey, number>> = {};
  for (const key of NUMERIC_KEYS) {
    const value = bonus[key];
    if (value !== undefined && value !== 0) scaled[key] = value * factor;
  }
  return bonus.skillsCanCrit === true ? { ...scaled, skillsCanCrit: true } : scaled;
}

/**
 * Calcule les statistiques de combat : les bonus fixes s'ajoutent d'abord,
 * puis les pourcentages s'appliquent au total.
 */
export function computeCombatStats(base: Stats, bonuses: readonly StatBonus[]): CombatStats {
  const b = sumBonuses(bonuses);
  return {
    hp: (base.hp + b.hp) * (1 + b.hpPercent),
    attack: (base.attack + b.attack) * (1 + b.attackPercent),
    elementalPower: (base.elementalPower + b.elementalPower) * (1 + b.elementalPowerPercent),
    critChance: Math.min(1, Math.max(0, base.critChance + b.critChance)),
    armor: base.armor + b.armor,
    elementalResist: base.elementalResist + b.elementalResist,
    attackSpeed: base.attackSpeed * (1 + b.attackSpeedPercent),
    range: base.range + b.range,
    // Concentration : l'énergie maximale baisse, sans descendre sous 10 % de celle de la fiche.
    maxEnergy: base.maxEnergy * Math.max(0.1, 1 + b.maxEnergyPercent),
    energyRegenBonus: base.energyRegenBonus + b.energyRegen,
    critMultiplier: BALANCE.critMultiplier + b.critMultiplier,
    damageReduction: Math.min(BALANCE.maxDamageReduction, Math.max(0, b.damageReduction)),
    skillsCanCrit: bonuses.some((bonus) => bonus.skillsCanCrit === true),
    energyRefundOnCast: b.energyRefundOnCast,
    attackSpeedRampPerSecond: b.attackSpeedRampPerSecond,
    attackSpeedRampMax: b.attackSpeedRampMax,
    lifeSourceRatio: b.lifeSourceRatio,
    lowHpDamageBonus: b.lowHpDamageBonus,
    startingEnergyRatio: Math.min(1, Math.max(0, b.startingEnergyRatio)),
    dodgeChance: Math.min(BALANCE.maxDodgeChance, Math.max(0, b.dodgeChance)),
    onHitElementalRatio: b.onHitElementalRatio,
    lifesteal: b.lifesteal,
    armorShredPerAttack: b.armorShredPerAttack,
    armorShredMax: b.armorShredMax,
    armorPenetration: Math.min(1, Math.max(0, b.armorPenetration)),
    executeCritChance: b.executeCritChance,
    attackSpeedPerCrit: b.attackSpeedPerCrit,
    attackSpeedPerCritMax: b.attackSpeedPerCritMax,
    latentCritChance: b.latentCritChance,
    latentAttackSpeedPercent: b.latentAttackSpeedPercent,
    blastDamage: b.blastDamage,
    blastElementalRatio: b.blastElementalRatio,
    guardReduction: Math.min(1, Math.max(0, b.guardReduction)),
    thornsRatio: b.thornsRatio,
    divineBlessingChance: Math.min(1, Math.max(0, b.divineBlessingChance)),
    regenPercentPerSecond: b.regenPercentPerSecond,
    attackSpeedPerHitTaken: b.attackSpeedPerHitTaken,
    attackSpeedPerHitTakenMax: b.attackSpeedPerHitTakenMax,
    energyPerHitTaken: b.energyPerHitTaken,
    postCastDefense: b.postCastDefense,
    healShieldBonus: b.healShieldBonus,
    skillDamagePerCast: b.skillDamagePerCast,
    skillDamagePerCastMax: b.skillDamagePerCastMax,
    statusImmunity: Math.min(1, Math.max(0, b.statusImmunity)),
    poisonDamage: b.poisonDamage,
    poisonElementalRatio: b.poisonElementalRatio,
    paralysisChance: Math.min(1, Math.max(0, b.paralysisChance)),
    energyDrainPerAttack: b.energyDrainPerAttack,
    allyEnergyOnCast: b.allyEnergyOnCast,
    energyPerCrit: b.energyPerCrit,
    energyPerAttack: b.energyPerAttack,
  };
}
