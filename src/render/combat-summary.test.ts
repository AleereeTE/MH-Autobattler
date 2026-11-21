import { describe, expect, it } from 'vitest';
import { simulateCombat } from '../combat/simulate.ts';
import { createDemoSetup } from '../sandbox/presets.ts';
import { summariesBySide, summarizeUnits, type UnitSummary } from './combat-summary.ts';

const summary = (uid: number, side: UnitSummary['side'], damageDealt: number): UnitSummary => ({
  uid,
  name: `Unité ${uid}`,
  rank: 1,
  side,
  damageDealt,
  damageTaken: 0,
  healingDone: 0,
  shieldingDone: 0,
  skillCasts: 0,
  knockedOutAt: null,
});

describe('summariesBySide', () => {
  it('sépare les alliés des ennemis, chaque camp trié par dégâts infligés décroissants', () => {
    const units = [summary(1, 'player', 100), summary(2, 'enemy', 300), summary(3, 'player', 500), summary(4, 'enemy', 50)];
    const bySide = summariesBySide(units);
    expect(bySide.player.map((unit) => unit.uid)).toEqual([3, 1]);
    expect(bySide.enemy.map((unit) => unit.uid)).toEqual([2, 4]);
  });

  it('garde un camp vide quand il n’a aucune unité', () => {
    expect(summariesBySide([summary(1, 'player', 10)]).enemy).toEqual([]);
  });

  it('répartit toutes les unités d’un vrai combat, sans en perdre ni en mélanger', () => {
    const result = simulateCombat(createDemoSetup(), 1);
    const all = summarizeUnits(result.events);
    const bySide = summariesBySide(all);
    expect(bySide.player.length + bySide.enemy.length).toBe(all.length);
    expect(bySide.player.every((unit) => unit.side === 'player')).toBe(true);
    expect(bySide.enemy.every((unit) => unit.side === 'enemy')).toBe(true);
  });
});
