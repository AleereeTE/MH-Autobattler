import { describe, expect, it } from 'vitest';
import { hexDistance } from '../core/hex.ts';
import { areaCells } from './skill-area.ts';

const center = { col: 3, row: 3 };

describe('areaCells', () => {
  it('n’affiche rien au tout début ni à la fin de l’animation', () => {
    expect(areaCells(center, 1, 0)).toEqual([]);
    expect(areaCells(center, 1, 1)).toEqual([]);
  });

  it('allume le centre avant les anneaux extérieurs', () => {
    const early = areaCells(center, 2, 0.1);
    expect(early.length).toBeGreaterThan(0);
    expect(early.every((cell) => hexDistance(center, cell.hex) === 0)).toBe(true);
  });

  it('finit par atteindre toutes les cases du rayon', () => {
    const reached = new Set<string>();
    for (let age = 0; age <= 1; age += 0.02) {
      for (const cell of areaCells(center, 2, age)) reached.add(`${cell.hex.col},${cell.hex.row}`);
    }
    expect(reached.size).toBe(19);
  });

  it('garde des intensités entre 0 et 1', () => {
    for (let age = 0; age <= 1; age += 0.05) {
      for (const cell of areaCells(center, 1, age)) {
        expect(cell.intensity).toBeGreaterThan(0);
        expect(cell.intensity).toBeLessThanOrEqual(1);
      }
    }
  });
});
