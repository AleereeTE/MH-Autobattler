import { BALANCE } from '../../data/balance.ts';
import { LATENT_POWER_DELAY_SECONDS } from '../../data/items.ts';
import { gainEnergy } from '../energy.ts';
import type { CombatUnit } from '../state.ts';

/**
 * Statistiques qui changent pendant le combat à cause des objets (lot 1) :
 * chance de critique (Pouvoir latent, Faiblesse exploitée) et vitesse d'attaque (Furie, Pouvoir latent).
 */

/** ✅ Pouvoir latent : actif après quelques secondes de combat. */
export function isLatentPowerActive(elapsedSeconds: number): boolean {
  return elapsedSeconds >= LATENT_POWER_DELAY_SECONDS;
}

/**
 * Chance de critique d'une unité contre une cible : sa statistique, plus le Pouvoir latent
 * une fois actif, plus Faiblesse exploitée si la cible est sous 50 % de ses PV.
 */
export function critChanceAgainst(unit: CombatUnit, target: CombatUnit, elapsedSeconds: number): number {
  let chance = unit.stats.critChance;
  if (isLatentPowerActive(elapsedSeconds)) chance += unit.stats.latentCritChance;
  if (target.hp < target.stats.hp * BALANCE.rageHpThreshold) chance += unit.stats.executeCritChance;
  return Math.min(1, Math.max(0, chance));
}

/**
 * Un coup critique de l'unité (attaque ou compétence) : Furie compte un critique de plus,
 * Coups en chaîne rend de l'énergie (bloquée, comme toujours, pendant une compétence ou derrière un bouclier).
 */
export function registerCrit(unit: CombatUnit): void {
  if (unit.stats.attackSpeedPerCrit > 0) unit.critStacks += 1;
  gainEnergy(unit, unit.stats.energyPerCrit);
}

/** Vitesse d'attaque en plus venant des objets : Furie (par critique), Ressentiment (par coup subi), Pouvoir latent. */
export function itemAttackSpeedBonus(unit: CombatUnit, elapsedSeconds: number): number {
  const fury = Math.min(unit.stats.attackSpeedPerCritMax, unit.stats.attackSpeedPerCrit * unit.critStacks);
  const resentment = Math.min(unit.stats.attackSpeedPerHitTakenMax, unit.stats.attackSpeedPerHitTaken * unit.hitsTaken);
  const latent = isLatentPowerActive(elapsedSeconds) ? unit.stats.latentAttackSpeedPercent : 0;
  return fury + resentment + latent;
}

/** ✅ Coalescence : dégâts des compétences en plus, selon le nombre de compétences déjà lancées (plafonné). */
export function skillDamageMultiplier(unit: CombatUnit): number {
  return 1 + Math.min(unit.stats.skillDamagePerCastMax, unit.stats.skillDamagePerCast * unit.skillsResolved);
}

/** ✅ Bonus soin : soins et boucliers de la compétence en plus. */
export function healShieldMultiplier(unit: CombatUnit): number {
  return 1 + unit.stats.healShieldBonus;
}
