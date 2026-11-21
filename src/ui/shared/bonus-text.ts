import type { StatBonus } from '../../data/definitions.ts';
import { sumBonuses } from '../../rules/stats.ts';

/**
 * Transforme des bonus de statistiques en phrases courtes : « +15 attaque brute », « +10 % de vitesse d'attaque »…
 * Plusieurs bonus sont d'abord additionnés (utile pour un objet : ses deux matériaux + son effet).
 */

/** Nombre à la française : 0,3 plutôt que 0.3 ; sans décimales inutiles. */
function frNumber(value: number): string {
  return String(Math.round(value * 100) / 100).replace('.', ',');
}

const pct = (value: number): string => `${frNumber(value * 100)} %`;
const signed = (value: number): string => (value >= 0 ? `+${frNumber(value)}` : `−${frNumber(-value)}`);
const signedPct = (value: number): string => (value >= 0 ? `+${pct(value)}` : `−${pct(-value)}`);

export function describeBonuses(bonuses: readonly StatBonus[]): string[] {
  const b = sumBonuses(bonuses);
  const lines: string[] = [];
  const add = (condition: boolean, text: () => string): void => {
    if (condition) lines.push(text());
  };
  add(b.hp !== 0, () => `${signed(b.hp)} PV`);
  add(b.hpPercent !== 0, () => `${signedPct(b.hpPercent)} de PV max`);
  add(b.attack !== 0, () => `${signed(b.attack)} attaque brute`);
  add(b.attackPercent !== 0, () => `${signedPct(b.attackPercent)} d’attaque brute`);
  add(b.elementalPower !== 0, () => `${signed(b.elementalPower)} puissance élémentaire`);
  add(b.elementalPowerPercent !== 0, () => `${signedPct(b.elementalPowerPercent)} de puissance élémentaire`);
  add(b.critChance !== 0, () => `${signedPct(b.critChance)} de chance de critique`);
  add(b.critMultiplier !== 0, () => `multiplicateur critique ${signed(b.critMultiplier)}`);
  add(b.armor !== 0, () => `${signed(b.armor)} armure`);
  add(b.elementalResist !== 0, () => `${signed(b.elementalResist)} résistance élémentaire`);
  add(b.attackSpeedPercent !== 0, () => `${signedPct(b.attackSpeedPercent)} de vitesse d’attaque`);
  add(b.energyRegen !== 0, () => `${signed(b.energyRegen)} énergie par seconde`);
  add(b.damageReduction !== 0, () => `−${pct(b.damageReduction)} de dégâts subis`);
  add(bonuses.some((bonus) => bonus.skillsCanCrit === true), () => 'compétences critiques possibles');
  add(b.energyRefundOnCast !== 0, () => `regagne ${frNumber(b.energyRefundOnCast)} énergie après chaque compétence`);
  add(
    b.attackSpeedRampPerSecond !== 0,
    () => `+${pct(b.attackSpeedRampPerSecond)} de vitesse d’attaque par seconde de combat (max +${pct(b.attackSpeedRampMax)})`,
  );
  add(b.lifeSourceRatio !== 0, () => `soigne l’allié le plus blessé de ${pct(b.lifeSourceRatio)} des dégâts infligés`);
  add(b.lowHpDamageBonus !== 0, () => `+${pct(b.lowHpDamageBonus)} de dégâts sous 50 % des PV`);
  add(b.startingEnergyRatio !== 0, () => `commence le combat avec ${pct(b.startingEnergyRatio)} d’énergie`);
  add(b.dodgeChance !== 0, () => `${pct(b.dodgeChance)} d’esquive des attaques de base`);
  return lines;
}
