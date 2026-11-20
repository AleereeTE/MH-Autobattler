import { describe, expect, it } from 'vitest';
import { hexDistance, hexesWithin, neighbors } from './hex.ts';

describe('hexDistance', () => {
  it('vaut 0 pour une même case', () => {
    expect(hexDistance({ col: 3, row: 3 }, { col: 3, row: 3 })).toBe(0);
  });

  it('vaut 1 entre deux cases voisines de part et d’autre de la ligne médiane', () => {
    expect(hexDistance({ col: 3, row: 4 }, { col: 3, row: 3 })).toBe(1);
  });

  it('est symétrique', () => {
    const a = { col: 1, row: 6 };
    const b = { col: 5, row: 1 };
    expect(hexDistance(a, b)).toBe(hexDistance(b, a));
  });

  it('mesure la diagonale complète du plateau', () => {
    expect(hexDistance({ col: 0, row: 0 }, { col: 6, row: 7 })).toBe(10);
  });
});

describe('neighbors', () => {
  it('donne 6 voisins à distance 1 pour une case centrale', () => {
    const center = { col: 3, row: 3 };
    const result = neighbors(center);
    expect(result).toHaveLength(6);
    for (const hex of result) expect(hexDistance(center, hex)).toBe(1);
  });

  it('ne renvoie que des cases du plateau pour un coin', () => {
    expect(neighbors({ col: 0, row: 0 })).toEqual([
      { col: 1, row: 0 },
      { col: 0, row: 1 },
    ]);
  });
});

describe('hexesWithin', () => {
  it('donne le centre seul pour un rayon de 0', () => {
    expect(hexesWithin({ col: 3, row: 3 }, 0)).toEqual([{ col: 3, row: 3 }]);
  });

  it('donne le centre et ses 6 voisins pour un rayon de 1', () => {
    expect(hexesWithin({ col: 3, row: 3 }, 1)).toHaveLength(7);
  });

  it('ne sort pas du plateau', () => {
    expect(hexesWithin({ col: 0, row: 0 }, 1)).toHaveLength(3);
  });
});
