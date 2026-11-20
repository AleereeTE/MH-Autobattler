import { BALANCE } from '../data/balance.ts';

/** Secondes écoulées depuis le début de la mort subite (0 avant). */
function suddenDeathSeconds(elapsedSeconds: number): number {
  return Math.max(0, elapsedSeconds - BALANCE.combatDuration);
}

/** ✅ Après 60 s, les dégâts infligés augmentent progressivement. */
export function suddenDeathDamageMultiplier(elapsedSeconds: number): number {
  return 1 + BALANCE.suddenDeathDamageRampPerSecond * suddenDeathSeconds(elapsedSeconds);
}

/** ✅ Après 60 s, les soins diminuent progressivement, jusqu'à 0. */
export function suddenDeathHealingMultiplier(elapsedSeconds: number): number {
  return Math.max(0, 1 - BALANCE.suddenDeathHealingDecayPerSecond * suddenDeathSeconds(elapsedSeconds));
}
