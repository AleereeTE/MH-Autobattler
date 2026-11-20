import { describe, expect, it } from 'vitest';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { TICKS_PER_SECOND } from '../constants.ts';
import { createCombatState } from '../setup.ts';
import type { CombatUnit } from '../state.ts';
import { step } from '../step.ts';
import { attackSpeedOf } from '../status/modifiers.ts';
import { applySkillEffect } from './effects.ts';

function setupWithAllies() {
  const state = createCombatState(
    {
      player: [
        place(makeUnit({ id: 'caster' }), 3, 6),
        place(makeUnit({ id: 'near' }), 3, 5), // à 1 case
        place(makeUnit({ id: 'far' }), 0, 4), // à plus de 2 cases
      ],
      enemy: [place(makeUnit({ id: 'enemy' }), 3, 0)],
    },
    1,
  );
  const [caster, near, far] = state.units as [CombatUnit, CombatUnit, CombatUnit];
  return { state, caster, near, far };
}

describe('effets de soutien', () => {
  it('bouclier : protège le lanceur pendant la durée prévue', () => {
    const { state, caster } = setupWithAllies();
    applySkillEffect(state, caster, { kind: 'shield', base: [100, 100, 100], ratios: [{ stat: 'hp', ratio: 0.1 }], duration: 2 });
    expect(caster.shields).toEqual([{ amount: 150, remainingTicks: 2 * TICKS_PER_SECOND }]);
    expect(state.events.at(-1)).toMatchObject({ type: 'shield', uid: caster.uid, amount: 150 });
  });

  it('soin : soigne les alliés proches sans dépasser leurs PV max', () => {
    const { state, caster, near, far } = setupWithAllies();
    near.hp = 400;
    far.hp = 400;
    applySkillEffect(state, caster, { kind: 'heal', base: [300, 300, 300], ratios: [], radius: 2 });
    expect(near.hp).toBe(500);
    expect(far.hp).toBe(400);
  });

  it('soin, bouclier et bonus signalent leur zone, centrée sur le lanceur', () => {
    const { state, caster } = setupWithAllies();
    applySkillEffect(state, caster, { kind: 'heal', base: [10, 10, 10], ratios: [], radius: 2 });
    applySkillEffect(state, caster, { kind: 'shield', base: [10, 10, 10], ratios: [], duration: 1 });
    applySkillEffect(state, caster, { kind: 'buff', attackSpeedPercent: 0.1, duration: 1 });
    const areas = state.events.filter((event) => event.type === 'skillArea');
    expect(areas).toMatchObject([
      { effect: 'heal', center: { col: 3, row: 6 }, radius: 2 },
      { effect: 'shield', center: { col: 3, row: 6 }, radius: 0 },
      { effect: 'buff', center: { col: 3, row: 6 }, radius: 0 },
    ]);
  });

  it('bonus : augmente temporairement la vitesse d’attaque du lanceur', () => {
    const { state, caster } = setupWithAllies();
    applySkillEffect(state, caster, { kind: 'buff', attackSpeedPercent: 0.6, duration: 1 });
    expect(attackSpeedOf(caster, 0)).toBeCloseTo(1.6);
    for (let i = 0; i < TICKS_PER_SECOND; i++) step(state);
    expect(attackSpeedOf(caster, 1)).toBeCloseTo(1);
  });
});

describe('effets de dégâts particuliers', () => {
  it('zone autour du lanceur : touche les ennemis adjacents seulement', () => {
    const state = createCombatState(
      {
        player: [place(makeUnit({ id: 'khezu', stats: { elementalPower: 10 } }), 3, 4)],
        enemy: [place(makeUnit({ id: 'adjacent' }), 3, 3), place(makeUnit({ id: 'loin' }), 3, 0)],
      },
      1,
    );
    const [caster] = state.units as [CombatUnit];
    applySkillEffect(state, caster, {
      kind: 'damage',
      target: 'self',
      damageType: 'elemental',
      base: [50, 50, 50],
      ratios: [{ stat: 'elementalPower', ratio: 1 }],
      radius: 1,
    });
    const hits = state.events.filter((event) => event.type === 'damage');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ targetUid: 2, amount: 60 });
  });

  it('bond : le lanceur se place à côté de sa cible avant de frapper', () => {
    const state = createCombatState(
      { player: [place(makeUnit({ id: 'tobi' }), 3, 7)], enemy: [place(makeUnit({ id: 'cible' }), 3, 0)] },
      1,
    );
    const [caster, target] = state.units as [CombatUnit, CombatUnit];
    applySkillEffect(state, caster, { kind: 'damage', target: 'lowestHpEnemy', damageType: 'elemental', base: [10, 10, 10], ratios: [], leap: true });
    expect(state.events.some((event) => event.type === 'leap')).toBe(true);
    expect(Math.abs(caster.position.row - target.position.row)).toBeLessThanOrEqual(1);
  });

  it('ralentissement : réduit la vitesse d’attaque des ennemis touchés', () => {
    const state = createCombatState(
      { player: [place(makeUnit({ id: 'legiana' }), 3, 4)], enemy: [place(makeUnit({ id: 'cible' }), 3, 3)] },
      1,
    );
    const [caster, target] = state.units as [CombatUnit, CombatUnit];
    applySkillEffect(state, caster, {
      kind: 'damage',
      target: 'currentTarget',
      damageType: 'elemental',
      base: [10, 10, 10],
      ratios: [],
      slow: { attackSpeedPercent: -0.3, duration: 3 },
    });
    expect(attackSpeedOf(target, 0)).toBeCloseTo(0.7);
  });
});

describe('objets à effet', () => {
  it('Accumulateur : regagne 20 énergie après chaque compétence', () => {
    const caster = makeUnit({ id: 'caster', stats: { maxEnergy: 30, range: 10 } });
    const state = createCombatState(
      {
        player: [place(caster, 3, 7, [{ kind: 'object', materials: ['gem', 'extract'] }])],
        enemy: [place(makeUnit({ id: 'cible', stats: { hp: 100_000, range: 10 } }), 3, 0)],
      },
      1,
    );
    const [unit] = state.units as [CombatUnit];
    while (!state.events.some((event) => event.type === 'skillResolve')) step(state);
    expect(unit.energy).toBe(20);
  });

  it('Agitateur : la vitesse d’attaque augmente avec le temps, jusqu’à +45 %', () => {
    const state = createCombatState(
      {
        player: [place(makeUnit({ id: 'agitator' }), 3, 7, [{ kind: 'object', materials: ['feather', 'bone'] }])],
        enemy: [place(makeUnit({ id: 'cible' }), 3, 0)],
      },
      1,
    );
    const [unit] = state.units as [CombatUnit];
    expect(attackSpeedOf(unit, 10)).toBeCloseTo(1.1 * 1.3);
    expect(attackSpeedOf(unit, 100)).toBeCloseTo(1.1 * 1.45);
  });
});
