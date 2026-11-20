import { describe, expect, it } from 'vitest';
import { createDemoSetup } from '../sandbox/presets.ts';
import { makeUnit, place } from '../test-utils/factories.ts';
import { TICKS_PER_SECOND } from './constants.ts';
import type { CombatEvent } from './events.ts';
import { createCombatState } from './setup.ts';
import { simulateCombat } from './simulate.ts';
import { step } from './step.ts';

function eventsOf<T extends CombatEvent['type']>(events: readonly CombatEvent[], type: T) {
  return events.filter((event): event is Extract<CombatEvent, { type: T }> => event.type === type);
}

describe('simulateCombat', () => {
  it('rejoue exactement le même combat avec la même graine', () => {
    const first = simulateCombat(createDemoSetup(), 7);
    const second = simulateCombat(createDemoSetup(), 7);
    expect(second.events).toEqual(first.events);
    expect(first.reason).toBe('elimination');
  });

  it('fait gagner le camp nettement plus fort', () => {
    const strong = makeUnit({ stats: { hp: 2000, attack: 120 } });
    const weak = makeUnit({ stats: { hp: 300, attack: 20 } });

    expect(simulateCombat({ player: [place(strong, 3, 5)], enemy: [place(weak, 3, 1)] }, 1).winner).toBe('player');
    expect(simulateCombat({ player: [place(weak, 3, 5)], enemy: [place(strong, 3, 1)] }, 1).winner).toBe('enemy');
  });

  it('une unité au corps à corps se déplace avant d’attaquer', () => {
    const result = simulateCombat({ player: [place(makeUnit(), 3, 7)], enemy: [place(makeUnit(), 3, 0)] }, 1);
    const firstMove = result.events.findIndex((e) => e.type === 'move' && e.uid === 1);
    const firstAttack = result.events.findIndex((e) => e.type === 'attack' && e.uid === 1);
    expect(firstMove).toBeGreaterThan(-1);
    expect(firstAttack).toBeGreaterThan(firstMove);
  });

  it('une unité à distance attaque sans bouger quand la cible est à portée', () => {
    const archer = makeUnit({ stats: { range: 10 } });
    const result = simulateCombat({ player: [place(archer, 3, 7)], enemy: [place(archer, 3, 0)] }, 1);
    expect(eventsOf(result.events, 'move')).toHaveLength(0);
    expect(eventsOf(result.events, 'attack').length).toBeGreaterThan(0);
  });

  it('applique le multiplicateur ×1,5 aux coups critiques', () => {
    const critter = makeUnit({ stats: { critChance: 1, attack: 100, range: 10 } });
    const dummy = makeUnit({ stats: { hp: 10_000, attack: 0, range: 10 } });
    const result = simulateCombat({ player: [place(critter, 3, 7)], enemy: [place(dummy, 3, 0)] }, 1);
    const hits = eventsOf(result.events, 'damage').filter((e) => e.sourceUid === 1);
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits.slice(0, 5)) expect(hit).toMatchObject({ amount: 150, isCrit: true });
  });

  it('lance la compétence quand l’énergie est pleine', () => {
    const caster = makeUnit({
      role: 'dps', // +10 énergie par attaque
      element: 'thunder',
      stats: { maxEnergy: 20, range: 10 },
      skill: {
        id: 'eclair',
        name: 'Éclair',
        castTime: 0,
        effects: [{ kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [100, 100, 100], ratios: [] }],
      },
    });
    const dummy = makeUnit({ stats: { hp: 10_000, attack: 0, range: 10 } });
    const result = simulateCombat({ player: [place(caster, 3, 7)], enemy: [place(dummy, 3, 0)] }, 1);

    const firstCast = eventsOf(result.events, 'skillCast').find((e) => e.uid === 1);
    expect(firstCast?.tick).toBe(2 * TICKS_PER_SECOND + 1); // juste après la 2ᵉ attaque
    const skillHit = eventsOf(result.events, 'damage').find((e) => e.damageType === 'elemental');
    expect(skillHit).toMatchObject({ sourceUid: 1, amount: 100, isCrit: false });
  });

  it('bloque l’énergie pendant toute l’incantation', () => {
    const tank = makeUnit({
      role: 'tank', // gagne de l'énergie en subissant des coups + gain passif
      stats: { hp: 10_000, maxEnergy: 10, range: 10 },
      skill: { id: 'garde', name: 'Garde', castTime: 1, effects: [] },
    });
    const attacker = makeUnit({ stats: { hp: 10_000, attack: 1, attackSpeed: 4, range: 10 } });
    const state = createCombatState({ player: [place(tank, 3, 7)], enemy: [place(attacker, 3, 0)] }, 1);
    const castingTank = state.units[0];
    if (castingTank === undefined) throw new Error('tank manquant');

    while (castingTank.cast === null) step(state);
    const castStart = state.tick;
    for (let i = 0; i < TICKS_PER_SECOND - 1; i++) {
      step(state);
      expect(castingTank.energy).toBe(0);
    }
    step(state);
    expect(eventsOf(state.events, 'skillResolve').at(-1)?.tick).toBe(castStart + TICKS_PER_SECOND);
  });

  it('compte une égalité comme une victoire du joueur', () => {
    const glassCannon = makeUnit({ stats: { hp: 50, attack: 100 } });
    const result = simulateCombat({ player: [place(glassCannon, 3, 4)], enemy: [place(glassCannon, 3, 3)] }, 1);
    expect(eventsOf(result.events, 'death')).toHaveLength(2);
    expect(result.winner).toBe('player');
    expect(result.reason).toBe('elimination');
  });

  it('la mort subite finit par départager deux unités très résistantes', () => {
    const wall = makeUnit({ stats: { hp: 20_000, attack: 10 } });
    const result = simulateCombat({ player: [place(wall, 3, 4)], enemy: [place(wall, 3, 3)] }, 1);
    expect(eventsOf(result.events, 'suddenDeath')).toEqual([{ type: 'suddenDeath', tick: 60 * TICKS_PER_SECOND }]);
    expect(result.durationTicks).toBeGreaterThan(60 * TICKS_PER_SECOND);
    expect(result.reason).toBe('elimination');
  });
});
