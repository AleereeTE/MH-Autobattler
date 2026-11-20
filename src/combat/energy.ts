import { ENERGY_PROFILES, type EnergyProfile } from '../data/energy-profiles.ts';
import { TICKS_PER_SECOND } from './constants.ts';
import type { CombatUnit } from './state.ts';

export function energyProfileOf(unit: CombatUnit): EnergyProfile {
  return ENERGY_PROFILES[unit.def.role];
}

/**
 * Ajoute de l'énergie à une unité, sans dépasser son maximum.
 * ✅ L'énergie est bloquée pendant qu'une compétence s'exécute.
 */
export function gainEnergy(unit: CombatUnit, amount: number): void {
  if (unit.cast !== null || amount <= 0) return;
  unit.energy = Math.min(unit.stats.maxEnergy, unit.energy + amount);
}

/** Énergie passive gagnée à chaque tick : gain du rôle + bonus (Extrait). */
export function passiveEnergyPerTick(unit: CombatUnit): number {
  return (energyProfileOf(unit).passivePerSecond + unit.stats.energyRegenBonus) / TICKS_PER_SECOND;
}

export function isEnergyFull(unit: CombatUnit): boolean {
  // Petite marge pour absorber les arrondis des nombres à virgule.
  return unit.energy >= unit.stats.maxEnergy - 1e-9;
}
