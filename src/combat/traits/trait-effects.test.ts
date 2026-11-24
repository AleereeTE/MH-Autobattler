import { describe, expect, it } from 'vitest';
import type { UnitOverrides } from '../../test-utils/factories.ts';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { TICKS_PER_SECOND } from '../constants.ts';
import type { CombatEvent } from '../events.ts';
import { createCombatState, type CombatSetup } from '../setup.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { step } from '../step.ts';

/** Deux unités différentes du joueur (pour activer un trait) contre une cible d'entraînement. */
function duoSetup(overrides: UnitOverrides): CombatSetup {
  return {
    player: [
      place(makeUnit({ ...overrides, id: 'duo-1', stats: { range: 10, ...overrides.stats } }), 3, 7),
      place(makeUnit({ ...overrides, id: 'duo-2', stats: { range: 10, ...overrides.stats } }), 4, 7),
    ],
    enemy: [place(makeUnit({ id: 'dummy', stats: { hp: 100_000, attack: 0, range: 10 } }), 3, 0)],
  };
}

function runFor(state: CombatState, seconds: number): void {
  for (let i = 0; i < seconds * TICKS_PER_SECOND; i++) step(state);
}

function enemyOf(state: CombatState): CombatUnit {
  const enemy = state.units.find((unit) => unit.side === 'enemy');
  if (enemy === undefined) throw new Error('ennemi manquant');
  return enemy;
}

function damageEvents(state: CombatState): Extract<CombatEvent, { type: 'damage' }>[] {
  return state.events.filter((event): event is Extract<CombatEvent, { type: 'damage' }> => event.type === 'damage');
}

describe('traits d’élément', () => {
  it('Feu : les coups brûlent la cible, qui subit des dégâts chaque seconde', () => {
    const state = createCombatState(duoSetup({ element: 'fire' }), 1);
    runFor(state, 3);
    const burns = damageEvents(state).filter((event) => event.cause === 'burn');
    expect(burns.length).toBeGreaterThan(0);
    expect(burns[0]?.amount).toBe(20);
  });

  it('Glace : les coups ralentissent la cible', () => {
    const state = createCombatState(duoSetup({ element: 'ice' }), 1);
    runFor(state, 1.5);
    expect(enemyOf(state).modifiers).toContainEqual(expect.objectContaining({ key: 'trait:chill', attackSpeedPercent: -0.2 }));
  });

  it('Foudre : un éclair tombe toutes les 4 secondes', () => {
    const state = createCombatState(duoSetup({ element: 'thunder' }), 1);
    runFor(state, 4);
    const strike = state.events.find((event) => event.type === 'lightning');
    expect(strike?.tick).toBe(4 * TICKS_PER_SECOND);
    expect(damageEvents(state).find((event) => event.cause === 'lightning')?.amount).toBe(80);
  });

  it('Sans élément : +15 % d’attaque brute', () => {
    const state = createCombatState(duoSetup({ element: null, stats: { attack: 100 } }), 1);
    expect(state.units[0]?.stats.attack).toBeCloseTo(115);
  });

  it('un trait n’est pas actif avec une seule unité', () => {
    const state = createCombatState(
      { player: [place(makeUnit({ element: 'fire', stats: { range: 10 } }), 3, 7)], enemy: [place(makeUnit({ stats: { hp: 100_000, range: 10 } }), 3, 0)] },
      1,
    );
    runFor(state, 3);
    expect(damageEvents(state).some((event) => event.cause === 'burn')).toBe(false);
  });
});

describe('traits secondaires', () => {
  it('Guilde : chaque objet porté par une unité Guilde renforce toutes les unités Guilde', () => {
    const setup = duoSetup({ element: 'water', traits: ['guild'] });
    const [first, second] = setup.player;
    if (first === undefined || second === undefined) throw new Error('placements manquants');
    const state = createCombatState(
      { ...setup, player: [{ ...first, equipment: [{ kind: 'object', materials: ['horn', 'fang'] }] }, second] },
      1,
    );
    // Palier 2 : +3 % par objet, y compris pour l'unité qui ne porte rien.
    expect(state.units[0]?.stats.hp).toBeCloseTo(500 * 1.03);
    expect(state.units[1]?.stats.hp).toBeCloseTo(500 * 1.03);
  });

  it('Guilde : 9 objets comptés au plus', () => {
    const fullKit = Array.from({ length: 3 }, () => ({ kind: 'object' as const, materials: ['horn', 'fang'] as const }));
    const hunters = [0, 1, 2, 3].map((col) => place(makeUnit({ id: `guilde-${col}`, element: 'water', traits: ['guild'] }), col, 7, fullKit));
    const state = createCombatState({ player: hunters, enemy: [place(makeUnit({ id: 'dummy' }), 3, 0)] }, 1);
    // Palier 4 : 4 % par objet ; 12 objets portés, mais seuls 9 comptent → +36 %.
    for (const unit of state.units.filter((u) => u.side === 'player')) expect(unit.stats.hp).toBeCloseTo(500 * 1.36);
  });

  it('Guilde : les objets portés par les autres unités ne comptent pas', () => {
    const setup = duoSetup({ element: 'water', traits: ['guild'] });
    const outsider = place(makeUnit({ id: 'hors-guilde', element: 'water' }), 5, 7, [{ kind: 'object', materials: ['horn', 'fang'] }]);
    const state = createCombatState({ ...setup, player: [...setup.player, outsider] }, 1);
    expect(state.units[0]?.stats.hp).toBe(500);
    expect(state.units[1]?.stats.hp).toBe(500);
  });

  it('Berserker : compétences critiques et multiplicateur augmenté', () => {
    const state = createCombatState(duoSetup({ element: 'water', traits: ['berserker'] }), 1);
    expect(state.units[0]?.stats).toMatchObject({ skillsCanCrit: true, critChance: 0.15 });
    expect(state.units[0]?.stats.critMultiplier).toBeCloseTo(1.7);
  });
});
