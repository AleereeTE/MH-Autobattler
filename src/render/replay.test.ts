import { describe, expect, it } from 'vitest';
import type { CombatEvent, UnitSnapshot } from '../combat/index.ts';
import { simulateCombat } from '../combat/simulate.ts';
import { createDemoSetup } from '../sandbox/presets.ts';
import { makeUnit, place } from '../test-utils/factories.ts';
import { summarizeUnits } from './combat-summary.ts';
import { AREA_LIFETIME_TICKS, createReplay } from './replay.ts';

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

describe('zones d’effet', () => {
  const caster: UnitSnapshot = {
    uid: 1,
    defId: 'odette',
    name: 'Odette',
    side: 'player',
    kind: 'hunter',
    role: 'support',
    element: 'fire',
    cost: 2,
    rank: 1,
    position: { col: 3, row: 6 },
    maxHp: 500,
    maxEnergy: 60,
  };
  const events: CombatEvent[] = [
    { type: 'combatStart', tick: 0, units: [caster], traits: { player: [], enemy: [] } },
    { type: 'skillArea', tick: 10, uid: 1, effect: 'heal', center: { col: 3, row: 6 }, radius: 2 },
    { type: 'combatEnd', tick: 60, winner: 'player', reason: 'elimination' },
  ];

  it('n’affiche pas la zone avant que la compétence prenne effet', () => {
    expect(createReplay(events).frameAt(9).areas).toEqual([]);
  });

  it('affiche la zone pendant sa courte animation, avec la couleur du lanceur', () => {
    const area = createReplay(events).frameAt(10 + AREA_LIFETIME_TICKS / 2).areas[0];
    expect(area).toMatchObject({ uid: 1, side: 'player', element: 'fire', effect: 'heal', radius: 2 });
    expect(area?.age).toBeCloseTo(0.5);
  });

  it('retire la zone une fois l’animation terminée', () => {
    expect(createReplay(events).frameAt(10 + AREA_LIFETIME_TICKS).areas).toEqual([]);
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
