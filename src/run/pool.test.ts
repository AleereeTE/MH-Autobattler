import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng.ts';
import { UNITS, findUnit } from '../data/units/index.ts';
import { createPool, drawUnitId, returnCopies, takeCopies } from './pool.ts';

describe('stock commun', () => {
  it('contient 18, 15 ou 12 exemplaires selon le coût', () => {
    const pool = createPool();
    expect(pool.get('barroth')).toBe(18); // coût 1
    expect(pool.get('anjanath')).toBe(15); // coût 2
    expect(pool.get('rathalos')).toBe(12); // coût 3
    expect(pool.get('zinogre')).toBe(10); // coût 4
    expect(pool.get('teostra')).toBe(8); // coût 5
    expect(pool.get('fatalis')).toBe(3); // coût 6 : Dragon noir
  });

  it('ne propose de Dragon noir qu’au niveau 9, environ 3 fois sur 100', () => {
    const pool = createPool();
    const rng = createRng(17);
    for (let level = 1; level <= 8; level++) {
      for (let i = 0; i < 300; i++) expect(findUnit(drawUnitId(pool, level, rng) ?? '')?.cost).not.toBe(6);
    }
    let blackDragons = 0;
    for (let i = 0; i < 6000; i++) if (findUnit(drawUnitId(pool, 9, rng) ?? '')?.cost === 6) blackDragons += 1;
    expect(blackDragons / 6000).toBeGreaterThan(0.02);
    expect(blackDragons / 6000).toBeLessThan(0.04);
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
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < 3000; i++) counts[(findUnit(drawUnitId(pool, 9, rng) ?? '')?.cost ?? 1) - 1]! += 1;
    expect(counts[0]! / 3000).toBeCloseTo(0.1, 1);
    expect(counts[3]! / 3000).toBeCloseTo(0.35, 1);
    expect(counts[4]! / 3000).toBeCloseTo(0.1, 1);
  });

  it('ne propose jamais une unité épuisée, et prend un autre coût si besoin', () => {
    const pool = createPool();
    for (const unit of UNITS.filter((u) => u.cost === 1)) takeCopies(pool, unit.id, 18); // plus aucun coût 1
    const rng = createRng(5);
    const drawn = drawUnitId(pool, 2, rng);
    expect(drawn).not.toBeNull();
    expect(findUnit(drawn ?? '')?.cost).not.toBe(1);
    expect(drawUnitId(new Map(), 2, rng)).toBeNull();
  });
});
