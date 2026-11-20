import { describe, expect, it } from 'vitest';
import { TICKS_PER_SECOND } from '../../combat/index.ts';
import { simulateCombat } from '../../combat/simulate.ts';
import { createDemoSetup } from '../../sandbox/presets.ts';
import { outcomeLine } from './results-view.ts';

describe('outcomeLine', () => {
  const result = simulateCombat(createDemoSetup(), 1);

  it('n’annonce pas le résultat tant que le replay n’est pas terminé', () => {
    expect(outcomeLine(result, 30)).toBe('Combat en cours · 1.5 s');
  });

  it('annonce le résultat et la durée à la fin', () => {
    const outcome = result.winner === 'player' ? 'Victoire' : 'Défaite';
    const seconds = (result.durationTicks / TICKS_PER_SECOND).toFixed(1);
    expect(outcomeLine(result, result.durationTicks)).toBe(`${outcome} en ${seconds} s`);
    expect(outcomeLine(result, Infinity)).toBe(outcomeLine(result, result.durationTicks));
  });
});
