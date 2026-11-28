import { describe, expect, it } from 'vitest';
import { createRng } from './rng.ts';

function sequence(seed: number, length = 10): number[] {
  const rng = createRng(seed);
  return Array.from({ length }, () => rng.next());
}

describe('createRng', () => {
  it('produit la même suite pour la même graine', () => {
    expect(sequence(42)).toEqual(sequence(42));
  });

  it('produit des suites différentes pour des graines différentes', () => {
    expect(sequence(1)).not.toEqual(sequence(2));
  });

  it('reste dans l’intervalle [0, 1[', () => {
    for (const value of sequence(7, 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('chance(0) est toujours faux et chance(1) toujours vrai', () => {
    const rng = createRng(3);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('state() permet de reprendre exactement la même suite', () => {
    const rng = createRng(11);
    for (let i = 0; i < 7; i++) rng.next();
    const resumed = createRng(rng.state());
    expect(Array.from({ length: 10 }, () => resumed.next())).toEqual(Array.from({ length: 10 }, () => rng.next()));
  });
});
