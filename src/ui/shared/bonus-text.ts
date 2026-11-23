import type { StatBonus } from '../../data/definitions.ts';
import {
  BLAST_EVERY_ATTACKS,
  LATENT_POWER_DELAY_SECONDS,
  PARALYSIS_SECONDS,
  POISON_HEALING_REDUCTION,
  POISON_SECONDS,
  POST_CAST_DEFENSE_SECONDS,
  WIDE_RANGE_RADIUS,
} from '../../data/items.ts';
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
  add(b.range !== 0, () => `${signed(b.range)} de portée`);
  add(b.maxEnergyPercent !== 0, () => `${signedPct(b.maxEnergyPercent)} d’énergie maximale`);
  add(b.onHitElementalRatio !== 0, () => `les attaques de base infligent en plus ${pct(b.onHitElementalRatio)} de la puissance élémentaire`);
  add(b.lifesteal !== 0, () => `se soigne de ${pct(b.lifesteal)} des dégâts infligés`);
  add(b.armorShredPerAttack !== 0, () => `chaque attaque de base retire ${frNumber(b.armorShredPerAttack)} armure à la cible (max −${frNumber(b.armorShredMax)})`);
  add(b.armorPenetration !== 0, () => `les attaques de base ignorent ${pct(b.armorPenetration)} de l’armure`);
  add(b.executeCritChance !== 0, () => `+${pct(b.executeCritChance)} de critique contre les cibles sous 50 % des PV`);
  add(b.attackSpeedPerCrit !== 0, () => `+${pct(b.attackSpeedPerCrit)} de vitesse d’attaque par coup critique (max +${pct(b.attackSpeedPerCritMax)})`);
  add(
    b.latentCritChance !== 0 || b.latentAttackSpeedPercent !== 0,
    () => `après ${LATENT_POWER_DELAY_SECONDS} s de combat : +${pct(b.latentCritChance)} de critique et +${pct(b.latentAttackSpeedPercent)} de vitesse d’attaque`,
  );
  add(
    b.blastDamage !== 0,
    () => `toutes les ${BLAST_EVERY_ATTACKS} attaques qui touchent : explosion de ${frNumber(b.blastDamage)} + ${pct(b.blastElementalRatio)} de la puissance élémentaire`,
  );
  add(b.guardReduction !== 0, () => `attaques de base subies : jamais critiques, −${pct(b.guardReduction)} de dégâts`);
  add(b.thornsRatio !== 0, () => `renvoie ${pct(b.thornsRatio)} des dégâts des attaques de base subies`);
  add(b.divineBlessingChance !== 0, () => `${pct(b.divineBlessingChance)} de chances de réduire de moitié les dégâts d’un coup subi`);
  add(b.regenPercentPerSecond !== 0, () => `régénère ${pct(b.regenPercentPerSecond)} des PV max par seconde`);
  add(
    b.attackSpeedPerHitTaken !== 0,
    () => `+${pct(b.attackSpeedPerHitTaken)} de vitesse d’attaque par coup subi (max +${pct(b.attackSpeedPerHitTakenMax)})`,
  );
  add(b.energyPerHitTaken !== 0, () => `+${frNumber(b.energyPerHitTaken)} énergie à chaque coup subi`);
  add(
    b.postCastDefense !== 0,
    () => `après chaque compétence : +${frNumber(b.postCastDefense)} armure et résistance élémentaire pendant ${POST_CAST_DEFENSE_SECONDS} s`,
  );
  add(b.healShieldBonus !== 0, () => `+${pct(b.healShieldBonus)} de soins et de boucliers de la compétence`);
  add(
    b.skillDamagePerCast !== 0,
    () => `+${pct(b.skillDamagePerCast)} de dégâts des compétences par compétence lancée (max +${pct(b.skillDamagePerCastMax)})`,
  );
  add(b.statusImmunity !== 0, () => 'immunité à la brûlure, aux ralentissements, au poison et à la paralysie');
  add(
    b.poisonDamage !== 0,
    () =>
      `les compétences empoisonnent : ${frNumber(b.poisonDamage)} + ${pct(b.poisonElementalRatio)} de la puissance élémentaire par seconde pendant ${frNumber(POISON_SECONDS)} s (soins reçus −${pct(POISON_HEALING_REDUCTION)})`,
  );
  add(b.paralysisChance !== 0, () => `${pct(b.paralysisChance)} de chances de paralyser la cible ${frNumber(PARALYSIS_SECONDS)} s`);
  add(b.energyDrainPerAttack !== 0, () => `les attaques de base retirent ${frNumber(b.energyDrainPerAttack)} énergie à la cible`);
  add(b.allyEnergyOnCast !== 0, () => `après sa compétence : +${frNumber(b.allyEnergyOnCast)} énergie aux alliés à ${WIDE_RANGE_RADIUS} cases`);
  add(b.energyPerCrit !== 0, () => `+${frNumber(b.energyPerCrit)} énergie par coup critique`);
  add(b.energyPerAttack !== 0, () => `+${frNumber(b.energyPerAttack)} énergie par attaque de base`);
  return lines;
}
