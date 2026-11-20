import type { CombatUnit } from '../state.ts';

export function addShield(unit: CombatUnit, amount: number, durationTicks: number): void {
  unit.shields.push({ amount, remainingTicks: durationTicks });
}

/** Les boucliers absorbent les dégâts, le plus ancien d'abord. Renvoie la part absorbée. */
export function absorbWithShields(unit: CombatUnit, amount: number): number {
  let remaining = amount;
  for (const shield of unit.shields) {
    if (remaining <= 0) break;
    const used = Math.min(shield.amount, remaining);
    shield.amount -= used;
    remaining -= used;
  }
  unit.shields = unit.shields.filter((shield) => shield.amount > 0);
  return amount - remaining;
}

export function tickShields(unit: CombatUnit): void {
  for (const shield of unit.shields) shield.remainingTicks -= 1;
  unit.shields = unit.shields.filter((shield) => shield.remainingTicks > 0);
}

export function shieldTotal(unit: CombatUnit): number {
  return unit.shields.reduce((total, shield) => total + shield.amount, 0);
}
