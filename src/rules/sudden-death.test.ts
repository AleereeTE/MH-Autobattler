import { describe, expect, it } from 'vitest';
import { suddenDeathDamageMultiplier, suddenDeathHealingMultiplier } from './sudden-death.ts';

describe('mort subite', () => {
  it('ne change rien avant 60 secondes', () => {
    expect(suddenDeathDamageMultiplier(30)).toBe(1);
    expect(suddenDeathDamageMultiplier(60)).toBe(1);
    expect(suddenDeathHealingMultiplier(60)).toBe(1);
  });

  it('augmente progressivement les dégâts après 60 secondes', () => {
    expect(suddenDeathDamageMultiplier(65)).toBeCloseTo(2);
    expect(suddenDeathDamageMultiplier(70)).toBeGreaterThan(suddenDeathDamageMultiplier(65));
  });

  it('réduit progressivement les soins jusqu’à 0', () => {
    expect(suddenDeathHealingMultiplier(70)).toBeCloseTo(0.5);
    expect(suddenDeathHealingMultiplier(200)).toBe(0);
  });
});
