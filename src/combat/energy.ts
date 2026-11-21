import { ENERGY_PROFILES, type EnergyProfile } from '../data/energy-profiles.ts';
import { TICKS_PER_SECOND } from './constants.ts';
import type { CombatUnit } from './state.ts';

export function energyProfileOf(unit: CombatUnit): EnergyProfile {
  return ENERGY_PROFILES[unit.def.role];
}

/**
 * Ajoute de l'énergie à une unité, sans dépasser son maximum.
 * ✅ L'énergie est bloquée pendant qu'une compétence s'exécute.
 * ✅ Elle est aussi bloquée tant que l'unité porte un bouclier (jusqu'à ce qu'il soit détruit ou expire) :
 * aucune source ne passe, ni l'énergie passive, ni les attaques, ni les coups subis, ni l'Accumulateur.
 */
export function gainEnergy(unit: CombatUnit, amount: number): void {
  if (unit.cast !== null || isShielded(unit) || amount <= 0) return;
  unit.energy = Math.min(unit.stats.maxEnergy, unit.energy + amount);
}

/** Énergie passive gagnée à chaque tick : gain du rôle + bonus (Extrait). */
export function passiveEnergyPerTick(unit: CombatUnit): number {
  return (energyProfileOf(unit).passivePerSecond + unit.stats.energyRegenBonus) / TICKS_PER_SECOND;
}

/** L'unité porte-t-elle encore un bouclier ? (Les boucliers vides ou expirés sont retirés aussitôt.) */
export function isShielded(unit: CombatUnit): boolean {
  return unit.shields.length > 0;
}

export function isEnergyFull(unit: CombatUnit): boolean {
  // Petite marge pour absorber les arrondis des nombres à virgule.
  return unit.energy >= unit.stats.maxEnergy - 1e-9;
}
