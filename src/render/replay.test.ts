import { describe, expect, it } from 'vitest';
import { simulateCombat } from '../combat/simulate.ts';
import { createDemoSetup } from '../sandbox/presets.ts';
import { makeUnit, place } from '../test-utils/factories.ts';
import { summarizeUnits } from './combat-summary.ts';
import { createReplay } from './replay.ts';

describe('createReplay', () => {
  it('place les unités à leur position de départ au tick 0', () => {
    const result = simulateCombat(createDemoSetup(), 1);
    const frame = createReplay(result.events).frameAt(0);
    expect(frame.units).toHaveLength(10);
    expect(frame.units.every((unit) => unit.alive && unit.hp === unit.maxHp)).toBe(true);
  });

  it('montre un déplacement à mi-chemin', () => {
    const result = simulateCombat({ player: [place(makeUnit(), 3, 7)], enemy: [place(makeUnit(), 3, 0)] }, 1);
    const move = result.events.find((event) => event.type === 'move');
    if (move === undefined || move.type !== 'move') throw new Error('aucun déplacement');
    const unit = createReplay(result.events).frameAt(move.tick + move.durationTicks / 2).units.find((u) => u.uid === move.uid);
    expect(unit?.moving?.progress).toBeCloseTo(0.5);
  });

  it('affiche le vainqueur et les K.O. à la fin', () => {
    const result = simulateCombat(createDemoSetup(), 1);
    const replay = createReplay(result.events);
    const frame = replay.frameAt(replay.durationTicks);
    expect(frame.winner).toBe(result.winner);
    const loserSide = result.winner === 'player' ? 'enemy' : 'player';
    expect(frame.units.filter((unit) => unit.side === loserSide).every((unit) => !unit.alive)).toBe(true);
  });
});

describe('summarizeUnits', () => {
  it('additionne les dégâts infligés et subis de chaque unité', () => {
    const result = simulateCombat(createDemoSetup(), 1);
    const summaries = summarizeUnits(result.events);
    const dealt = summaries.reduce((total, unit) => total + unit.damageDealt, 0);
    const taken = summaries.reduce((total, unit) => total + unit.damageTaken, 0);
    expect(dealt).toBeGreaterThan(0);
    expect(dealt).toBeCloseTo(taken);
  });
});
