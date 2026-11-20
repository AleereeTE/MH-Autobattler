import { describe, expect, it } from 'vitest';
import { pickOne, randomInt, weightedIndex } from './random.ts';
import { createRng } from './rng.ts';

describe('tirages à graine', () => {
  it('randomInt reste dans [0, max[ et couvre toutes les valeurs', () => {
    const rng = createRng(1);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const value = randomInt(rng, 4);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(4);
      seen.add(value);
    }
    expect(seen.size).toBe(4);
  });

  it('pickOne renvoie undefined pour une liste vide', () => {
    expect(pickOne(createRng(1), [])).toBeUndefined();
    expect(['a', 'b']).toContain(pickOne(createRng(1), ['a', 'b']));
  });

  it('weightedIndex ne tire jamais un poids nul et respecte les proportions', () => {
    const rng = createRng(7);
    const counts = [0, 0, 0];
    for (let i = 0; i < 4000; i++) counts[weightedIndex(rng, [3, 0, 1])]! += 1;
    expect(counts[1]).toBe(0);
    expect(counts[0]! / counts[2]!).toBeGreaterThan(2.5);
    expect(counts[0]! / counts[2]!).toBeLessThan(3.5);
    expect(weightedIndex(rng, [0, 0])).toBe(-1);
  });

  it('donne la même suite avec la même graine', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect(Array.from({ length: 5 }, () => randomInt(a, 100))).toEqual(Array.from({ length: 5 }, () => randomInt(b, 100)));
  });
});
