import { describe, expect, it } from 'vitest';
import { hexKey } from '../core/hex.ts';
import { createRng } from '../core/rng.ts';
import { BOSS_VERSION } from '../data/boss-version.ts';
import { copiesForRank } from './economy.ts';
import { generateSquad, huntBudget, maxEnemyUnits } from './enemies.ts';

const squadValue = (hunt: number, seed: number): number =>
  generateSquad(hunt, createRng(seed)).reduce((sum, placement) => sum + placement.unit.cost * copiesForRank(placement.rank ?? 1), 0);

describe('escouades ennemies', () => {
  it('suit le budget et le nombre de monstres prévus', () => {
    expect([1, 9, 30].map(huntBudget)).toEqual([2, 12, 38]);
    expect([1, 5, 9, 30].map(maxEnemyUnits)).toEqual([2, 3, 4, 8]);
  });

  it('ne dépasse jamais le budget ni le nombre de monstres (chasses classiques)', () => {
    for (const hunt of [1, 4, 9, 15, 25, 29]) {
      for (const seed of [1, 2, 3]) {
        expect(squadValue(hunt, seed), `chasse ${hunt}`).toBeLessThanOrEqual(huntBudget(hunt));
        expect(generateSquad(hunt, createRng(seed)).length).toBeLessThanOrEqual(maxEnemyUnits(hunt));
      }
    }
  });

  it('ne met que des monstres, de coût 2 et de rang ★2 au plus pendant le stage 1', () => {
    for (let hunt = 1; hunt <= 9; hunt++) {
      for (const placement of generateSquad(hunt, createRng(hunt))) {
        expect(placement.unit.kind).toBe('monster');
        expect(placement.unit.cost).toBeLessThanOrEqual(2);
        expect(placement.rank ?? 1).toBeLessThanOrEqual(2);
      }
    }
  });

  it('place chaque monstre sur une case différente du camp ennemi', () => {
    const squad = generateSquad(29, createRng(4));
    const cells = new Set(squad.map((placement) => hexKey(placement.position)));
    expect(cells.size).toBe(squad.length);
    for (const placement of squad) expect(placement.position.row).toBeLessThanOrEqual(3);
  });

  it('le boss est en version boss (bonus de statistiques), avec une escorte réduite', () => {
    for (const hunt of [10, 20, 30, 40]) {
      for (const seed of [1, 2, 3]) {
        const squad = generateSquad(hunt, createRng(seed));
        const bosses = squad.filter((placement) => placement.boss === true);
        expect(bosses).toHaveLength(1);
        expect(squad[0]?.boss).toBe(true);
        expect(squad[0]?.bonus?.hpPercent).toBeGreaterThan(1);
        const usualEscort = maxEnemyUnits(hunt) - 1;
        expect(squad.length - 1).toBe(Math.max(1, Math.floor(usualEscort * BOSS_VERSION.escortShare)));
        expect(squad.slice(1).every((placement) => placement.boss === undefined)).toBe(true);
      }
    }
    // Les chasses normales n'ont pas de boss.
    expect(generateSquad(9, createRng(1)).some((placement) => placement.boss === true)).toBe(false);
  });

  it('donne aux boss des stages 1 et 2 un monstre de coût 3 au ★3, avec une escorte', () => {
    for (const hunt of [10, 20]) {
      const squad = generateSquad(hunt, createRng(hunt));
      expect(squad[0]).toMatchObject({ rank: 3 });
      expect(squad[0]?.unit.cost).toBe(3);
      expect(squad.length).toBeGreaterThan(1);
    }
  });

  it('fait toujours du boss du stage 3 un Dragon ancien ★2, jamais un Dragon noir', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const boss = generateSquad(30, createRng(seed))[0];
      expect(boss?.unit.traits).toContain('elder-dragon');
      expect(boss?.rank).toBe(2);
    }
  });

  it('en mode infini, le boss est un Dragon ancien ★2, ou parfois (15 %) un Dragon noir ★1', () => {
    let blackDragons = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const boss = generateSquad(40, createRng(seed))[0];
      if (boss?.unit.traits.includes('black-dragon')) {
        blackDragons += 1;
        expect(boss.rank).toBe(1);
      } else {
        expect(boss?.unit.traits).toContain('elder-dragon');
        expect(boss?.rank).toBe(2);
      }
    }
    expect(blackDragons / 400).toBeGreaterThan(0.1);
    expect(blackDragons / 400).toBeLessThan(0.2);
  });

  it('peut mettre des monstres de coût 4 aux stages 2 et 3, mais jamais de Dragon ancien hors boss', () => {
    const costs = new Set<number>();
    for (let hunt = 11; hunt <= 29; hunt++) {
      if (hunt === 20) continue;
      for (const seed of [1, 2, 3]) {
        for (const placement of generateSquad(hunt, createRng(seed * 100 + hunt))) {
          costs.add(placement.unit.cost);
          expect(placement.unit.traits).not.toContain('elder-dragon');
          expect(placement.unit.traits).not.toContain('black-dragon');
        }
      }
    }
    expect(costs.has(4)).toBe(true);
    expect(costs.has(5)).toBe(false);
  });

  it('donne la même escouade avec la même graine', () => {
    const names = (seed: number) => generateSquad(12, createRng(seed)).map((p) => `${p.unit.id}${p.rank}@${hexKey(p.position)}`);
    expect(names(8)).toEqual(names(8));
  });
});
