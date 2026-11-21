import { describe, expect, it } from 'vitest';
import { TICKS_PER_SECOND } from '../../combat/index.ts';
import { simulateCombat } from '../../combat/simulate.ts';
import { createDemoSetup } from '../../sandbox/presets.ts';
import { summarizeUnits } from '../../render/combat-summary.ts';
import { outcomeLine, standingCount } from './results-view.ts';

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

describe('standingCount', () => {
  it('compte les unités encore debout d’un camp', () => {
    const result = simulateCombat(createDemoSetup(), 1);
    const start = summarizeUnits(result.events, 0);
    const players = start.filter((unit) => unit.side === 'player');
    expect(standingCount(players)).toBe(`${players.length} / ${players.length} debout`);

    const end = summarizeUnits(result.events);
    const loserSide = result.winner === 'player' ? 'enemy' : 'player';
    const losers = end.filter((unit) => unit.side === loserSide);
    expect(standingCount(losers)).toBe(`0 / ${losers.length} debout`);
  });

  it('affiche 0 / 0 pour un camp vide', () => {
    expect(standingCount([])).toBe('0 / 0 debout');
  });
});
