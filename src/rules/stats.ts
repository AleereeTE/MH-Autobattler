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
    range: base.range,
    maxEnergy: base.maxEnergy,
    energyRegenBonus: base.energyRegenBonus + b.energyRegen,
    critMultiplier: BALANCE.critMultiplier + b.critMultiplier,
    damageReduction: Math.min(BALANCE.maxDamageReduction, Math.max(0, b.damageReduction)),
    skillsCanCrit: bonuses.some((bonus) => bonus.skillsCanCrit === true),
    energyRefundOnCast: b.energyRefundOnCast,
    attackSpeedRampPerSecond: b.attackSpeedRampPerSecond,
    attackSpeedRampMax: b.attackSpeedRampMax,
  };
}
