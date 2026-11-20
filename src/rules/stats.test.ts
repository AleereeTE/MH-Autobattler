import { describe, expect, it } from 'vitest';
import { makeUnit } from '../test-utils/factories.ts';
import { computeCombatStats, scaleBonus } from './stats.ts';

const base = makeUnit({ stats: { hp: 500, attack: 50, attackSpeed: 1 } }).stats;

describe('computeCombatStats', () => {
  it('reprend la fiche sans bonus', () => {
    const stats = computeCombatStats(base, []);
    expect(stats.attack).toBe(50);
    expect(stats.critMultiplier).toBe(1.5);
    expect(stats.damageReduction).toBe(0);
    expect(stats.skillsCanCrit).toBe(false);
  });

  it('ajoute les bonus fixes avant d’appliquer les pourcentages', () => {
    const stats = computeCombatStats(base, [{ attack: 10 }, { attackPercent: 0.5 }]);
    expect(stats.attack).toBe(90);
  });

  it('applique les pourcentages de vitesse d’attaque', () => {
    expect(computeCombatStats(base, [{ attackSpeedPercent: 0.1 }, { attackSpeedPercent: 0.15 }]).attackSpeed).toBeCloseTo(1.25);
  });

  it('augmente le multiplicateur critique', () => {
    expect(computeCombatStats(base, [{ critMultiplier: 0.3 }]).critMultiplier).toBeCloseTo(1.8);
  });

  it('plafonne la réduction de dégâts à 75 %', () => {
    expect(computeCombatStats(base, [{ damageReduction: 0.5 }, { damageReduction: 0.5 }]).damageReduction).toBe(0.75);
  });

  it('autorise les compétences critiques si un bonus le permet', () => {
    expect(computeCombatStats(base, [{ skillsCanCrit: true }]).skillsCanCrit).toBe(true);
  });
});

describe('scaleBonus', () => {
  it('multiplie chaque valeur et garde les autorisations', () => {
    expect(scaleBonus({ hpPercent: 0.06, skillsCanCrit: true }, 2)).toEqual({ hpPercent: 0.12, skillsCanCrit: true });
  });
});
