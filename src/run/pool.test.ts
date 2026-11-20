import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng.ts';
import { findUnit } from '../data/units/index.ts';
import { createPool, drawUnitId, returnCopies, takeCopies } from './pool.ts';

describe('stock commun', () => {
  it('contient 18, 15 ou 12 exemplaires selon le coût', () => {
    const pool = createPool();
    expect(pool.get('barroth')).toBe(18); // coût 1
    expect(pool.get('anjanath')).toBe(15); // coût 2
    expect(pool.get('rathalos')).toBe(12); // coût 3
  });

  it('retire et remet des exemplaires, sans descendre sous zéro', () => {
    const pool = createPool();
    expect(takeCopies(pool, 'rathalos', 12)).toBe(true);
    expect(takeCopies(pool, 'rathalos', 1)).toBe(false);
    returnCopies(pool, 'rathalos', 3);
    expect(pool.get('rathalos')).toBe(3);
  });

  it('ne propose que des unités de coût 1 aux niveaux 1 et 2', () => {
    const pool = createPool();
    const rng = createRng(3);
    for (let i = 0; i < 100; i++) expect(findUnit(drawUnitId(pool, 2, rng) ?? '')?.cost).toBe(1);
  });

  it('suit à peu près les probabilités du niveau', () => {
    const pool = createPool();
    const rng = createRng(11);
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) counts[(findUnit(drawUnitId(pool, 9, rng) ?? '')?.cost ?? 1) - 1]! += 1;
    expect(counts[0]! / 3000).toBeCloseTo(0.15, 1);
    expect(counts[2]! / 3000).toBeCloseTo(0.5, 1);
  });

  it('ne propose jamais une unité épuisée, et prend un autre coût si besoin', () => {
    const pool = createPool();
    for (const id of ['barroth', 'khezu', 'helga', 'lysa', 'sylvain']) takeCopies(pool, id, 18);
    const rng = createRng(5);
    const drawn = drawUnitId(pool, 2, rng);
    expect(drawn).not.toBeNull();
    expect(findUnit(drawn ?? '')?.cost).not.toBe(1);
    expect(drawUnitId(new Map(), 2, rng)).toBeNull();
  });
});
