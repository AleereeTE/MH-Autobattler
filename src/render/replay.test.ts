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
    defId: 'minoto',
    name: 'Minoto',
    side: 'player',
    kind: 'hunter',
    role: 'support',
    element: 'fire',
    cost: 2,
    rank: 1,
    position: { col: 3, row: 6 },
    maxHp: 500,
    maxEnergy: 60,
    energy: 0,
    equipment: [],
    stats: { hp: 500, attack: 50, elementalPower: 30, critChance: 0, armor: 0, elementalResist: 0, attackSpeed: 1, range: 2, maxEnergy: 60 },
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

  it('ne compte que les événements survenus jusqu’à l’instant demandé', () => {
    const result = simulateCombat(createDemoSetup(), 1);
    const middle = Math.floor(result.durationTicks / 2);
    const total = (untilTick?: number) =>
      summarizeUnits(result.events, untilTick).reduce((sum, unit) => sum + unit.damageDealt, 0);
    const expectedAtMiddle = result.events
      .filter((event) => event.type === 'damage' && event.tick <= middle)
      .reduce((sum, event) => sum + (event.type === 'damage' ? event.amount : 0), 0);

    expect(total(0)).toBe(0);
    expect(total(middle)).toBeCloseTo(expectedAtMiddle);
    expect(total(middle)).toBeLessThan(total());
    expect(summarizeUnits(result.events, middle).some((unit) => unit.knockedOutAt !== null && unit.knockedOutAt > middle)).toBe(false);
  });
});

describe('énergie', () => {
  const unit: UnitSnapshot = {
    uid: 1,
    defId: 'kirin',
    name: 'Kirin',
    side: 'player',
    kind: 'monster',
    role: 'dps',
    element: 'thunder',
    cost: 5,
    rank: 1,
    position: { col: 3, row: 6 },
    maxHp: 500,
    maxEnergy: 100,
    energy: 40,
    equipment: [],
    stats: { hp: 500, attack: 50, elementalPower: 30, critChance: 0, armor: 0, elementalResist: 0, attackSpeed: 1, range: 3, maxEnergy: 100 },
  };
  const events: CombatEvent[] = [
    { type: 'combatStart', tick: 0, units: [unit], traits: { player: [], enemy: [] } },
    { type: 'energy', tick: 2, levels: [{ uid: 1, energy: 60 }] },
    { type: 'energy', tick: 4, levels: [{ uid: 1, energy: 100 }] },
    { type: 'skillCast', tick: 5, uid: 1, skillId: 'foudre', skillName: 'Foudre divine', castTicks: 0 },
    { type: 'energy', tick: 6, levels: [{ uid: 1, energy: 3 }] },
    { type: 'combatEnd', tick: 20, winner: 'player', reason: 'elimination' },
  ];
  const energyAt = (tick: number) => createReplay(events).frameAt(tick).units[0]?.energy;

  it('part de l’énergie de départ, puis suit les relevés du moteur', () => {
    expect(energyAt(0)).toBe(40);
    expect(energyAt(3)).toBe(60);
    expect(energyAt(4)).toBe(100);
    expect(createReplay(events).frameAt(0).units[0]?.maxEnergy).toBe(100);
  });

  it('retombe à 0 dès le lancement d’une compétence, sans attendre le relevé suivant', () => {
    expect(energyAt(5)).toBe(0);
    expect(energyAt(6)).toBe(3);
  });
});

describe('statuts des objets', () => {
  const unit: UnitSnapshot = {
    uid: 1,
    defId: 'khezu',
    name: 'Khezu',
    side: 'enemy',
    kind: 'monster',
    role: 'tank',
    element: 'thunder',
    cost: 1,
    rank: 1,
    position: { col: 3, row: 2 },
    maxHp: 500,
    maxEnergy: 80,
    energy: 0,
    equipment: [],
    stats: { hp: 500, attack: 50, elementalPower: 30, critChance: 0, armor: 0, elementalResist: 0, attackSpeed: 1, range: 1, maxEnergy: 80 },
  };
  const events: CombatEvent[] = [
    { type: 'combatStart', tick: 0, units: [unit], traits: { player: [], enemy: [] } },
    { type: 'status', tick: 10, uid: 1, status: 'poison', durationTicks: 80 },
    { type: 'status', tick: 20, uid: 1, status: 'paralysis', durationTicks: 30 },
    { type: 'combatEnd', tick: 200, winner: 'player', reason: 'elimination' },
  ];
  const at = (tick: number) => createReplay(events).frameAt(tick).units[0];

  it('affiche le poison et la paralysie pendant leur durée', () => {
    expect(at(15)).toMatchObject({ poisoned: true, paralyzed: false });
    expect(at(30)).toMatchObject({ poisoned: true, paralyzed: true });
    expect(at(50)).toMatchObject({ poisoned: true, paralyzed: false });
    expect(at(90)).toMatchObject({ poisoned: false, paralyzed: false });
  });
});
