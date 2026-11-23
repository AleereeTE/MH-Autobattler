import { BALANCE } from '../../data/balance.ts';
import { itemAttackSpeedBonus } from '../items/item-stats.ts';
import type { CombatUnit } from '../state.ts';

/** Ajoute un bonus ou un ralentissement temporaire ; remplace celui de même clé (pas de cumul). */
export function addModifier(unit: CombatUnit, key: string, attackSpeedPercent: number, durationTicks: number): void {
  unit.modifiers = unit.modifiers.filter((modifier) => modifier.key !== key);
  unit.modifiers.push({ key, attackSpeedPercent, remainingTicks: durationTicks });
}

export function tickModifiers(unit: CombatUnit): void {
  for (const modifier of unit.modifiers) modifier.remainingTicks -= 1;
  unit.modifiers = unit.modifiers.filter((modifier) => modifier.remainingTicks > 0);
}

export function hasModifier(unit: CombatUnit, predicate: (percent: number) => boolean): boolean {
  return unit.modifiers.some((modifier) => predicate(modifier.attackSpeedPercent));
}

/**
 * Vitesse d'attaque actuelle : base × (1 + bonus et ralentissements + montée de l'Agitateur
 * + objets : Furie et Pouvoir latent). Elle ne descend jamais sous 25 % de la vitesse de base.
 */
export function attackSpeedOf(unit: CombatUnit, elapsedSeconds: number): number {
  const fromModifiers = unit.modifiers.reduce((total, modifier) => total + modifier.attackSpeedPercent, 0);
  const ramp = Math.min(unit.stats.attackSpeedRampMax, unit.stats.attackSpeedRampPerSecond * elapsedSeconds);
  const items = itemAttackSpeedBonus(unit, elapsedSeconds);
  return unit.stats.attackSpeed * Math.max(BALANCE.minAttackSpeedMultiplier, 1 + fromModifiers + ramp + items);
}
