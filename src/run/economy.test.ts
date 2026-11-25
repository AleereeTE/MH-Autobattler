import { describe, expect, it } from 'vitest';
import { copiesForRank, interest, levelUpCost, roundIncome, sellValue } from './economy.ts';

describe('économie', () => {
  it('verse 1 zenny d’intérêts par tranche de 10, 5 au maximum', () => {
    expect([0, 9, 10, 29, 50, 120].map((zennys) => interest(zennys))).toEqual([0, 0, 1, 2, 5, 5]);
  });

  it('le plafond des intérêts peut être relevé (Banquier félyne)', () => {
    expect(interest(120, 8)).toBe(8);
    expect(interest(60, 8)).toBe(6);
    expect(roundIncome(100, false, 8)).toBe(5 + 8);
  });

  it('ajoute le bonus de victoire au revenu de base et aux intérêts', () => {
    expect(roundIncome(0, false)).toBe(5);
    expect(roundIncome(23, true)).toBe(5 + 1 + 2);
  });

  it('revend une unité au prix de ses exemplaires', () => {
    expect([1, 2, 3].map((rank) => copiesForRank(rank as 1 | 2 | 3))).toEqual([1, 3, 9]);
    expect(sellValue(2, 1)).toBe(2);
    expect(sellValue(2, 2)).toBe(6);
    expect(sellValue(3, 3)).toBe(27);
  });

  it('a un prix d’amélioration croissant, et aucun au niveau 10', () => {
    const costs = [2, 3, 4, 5, 6, 7, 8, 9].map((level) => levelUpCost(level));
    expect(costs).toEqual([4, 8, 12, 20, 28, 36, 48, 64]);
    expect(levelUpCost(10)).toBeNull();
  });
});
