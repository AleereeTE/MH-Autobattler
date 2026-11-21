import { describe, expect, it } from 'vitest';
import { makeUnit, place } from '../test-utils/factories.ts';
import { findUnit } from '../data/units/index.ts';
import { createDemoSetup } from '../sandbox/presets.ts';
import { dealDamage } from './actions/damage.ts';
import { ENERGY_SNAPSHOT_TICKS, TICKS_PER_SECOND } from './constants.ts';
import { gainEnergy, isShielded } from './energy.ts';
import { createCombatState } from './setup.ts';
import { simulateCombat } from './simulate.ts';
import type { CombatState, CombatUnit } from './state.ts';
import { addShield } from './status/shields.ts';
import { step } from './step.ts';

/** Un tank (il gagne de l'énergie quand il est touché) face à un ennemi lointain. */
function duel(): { state: CombatState; tank: CombatUnit; enemy: CombatUnit } {
  const state = createCombatState(
    {
      player: [place(makeUnit({ id: 'tank', role: 'tank', stats: { maxEnergy: 1000 } }), 3, 7)],
      enemy: [place(makeUnit({ id: 'ennemi', stats: { range: 1, hp: 100_000 } }), 3, 0)],
    },
    1,
  );
  const [tank, enemy] = state.units as [CombatUnit, CombatUnit];
  return { state, tank, enemy };
}

const hit = (amount: number) => ({ amount, type: 'physical' as const, isCrit: false, cause: 'attack' as const });

describe('énergie bloquée par un bouclier', () => {
  it('aucune énergie tant que le bouclier tient, puis l’énergie revient', () => {
    const { tank } = duel();
    addShield(tank, 100, 40);
    expect(isShielded(tank)).toBe(true);
    gainEnergy(tank, 30);
    expect(tank.energy).toBe(0);

    tank.shields = [];
    gainEnergy(tank, 30);
    expect(tank.energy).toBe(30);
  });

  it('les coups subis ne donnent pas d’énergie tant que le bouclier tient, même celui qui le brise', () => {
    const { state, tank, enemy } = duel();
    addShield(tank, 50, 100);
    dealDamage(state, enemy, tank, hit(30));
    expect(tank.energy).toBe(0);
    expect(tank.hp).toBe(500);

    dealDamage(state, enemy, tank, hit(30)); // brise le bouclier (20 absorbés, 10 sur les PV)
    expect(isShielded(tank)).toBe(false);
    expect(tank.energy).toBe(0);
    expect(tank.hp).toBe(490);

    dealDamage(state, enemy, tank, hit(30)); // plus de bouclier : le tank gagne son énergie de coup subi
    expect(tank.energy).toBe(8);
  });

  it('l’énergie passive reprend quand le bouclier expire', () => {
    const { state, tank } = duel();
    addShield(tank, 1_000, TICKS_PER_SECOND); // 1 s, jamais touché (l'ennemi est loin)
    for (let tick = 0; tick < TICKS_PER_SECOND - 1; tick++) step(state);
    expect(isShielded(tank)).toBe(true);
    expect(tank.energy).toBe(0);

    for (let tick = 0; tick < TICKS_PER_SECOND; tick++) step(state);
    expect(isShielded(tank)).toBe(false);
    expect(tank.energy).toBeGreaterThan(0);
  });

  it('une compétence de bouclier bloque aussi l’énergie rendue après la compétence (Accumulateur)', () => {
    const state = createCombatState(
      {
        player: [
          place(
            makeUnit({
              id: 'barroth',
              role: 'tank',
              stats: { maxEnergy: 1, range: 10 },
              skill: { castTime: 0, effects: [{ kind: 'shield', base: [500, 500, 500], ratios: [], duration: 4 }] },
            }),
            3,
            7,
            [{ kind: 'object', materials: ['gem', 'extract'] }], // Accumulateur : +20 énergie après chaque compétence
          ),
        ],
        enemy: [place(makeUnit({ id: 'ennemi', stats: { hp: 100_000 } }), 3, 0)],
      },
      1,
    );
    const caster = state.units[0] as CombatUnit;
    expect(caster.stats.energyRefundOnCast).toBe(20);
    caster.energy = 1;
    step(state);
    expect(state.events.some((event) => event.type === 'shield' && event.uid === caster.uid)).toBe(true);
    expect(caster.energy).toBe(0);
  });
});

describe('relevés d’énergie (pour la barre d’énergie du replay)', () => {
  it('relève l’énergie des unités en vie toutes les 0,1 s, et plus celle des unités K.O.', () => {
    const result = simulateCombat(createDemoSetup('medium'), 1);
    const snapshots = result.events.filter((event) => event.type === 'energy');
    expect(snapshots.length).toBeGreaterThan(0);
    snapshots.forEach((event, index) => expect(event.tick).toBe((index + 1) * ENERGY_SNAPSHOT_TICKS));

    const death = result.events.find((event) => event.type === 'death');
    if (death === undefined || death.type !== 'death') throw new Error('aucun K.O.');
    for (const event of snapshots) {
      if (event.type !== 'energy') continue;
      const present = event.levels.some((level) => level.uid === death.uid);
      expect(present).toBe(event.tick < death.tick);
    }
  });

  it('donne exactement l’énergie du moteur, sans dépasser le maximum', () => {
    const { state, tank } = duel();
    for (let tick = 0; tick < ENERGY_SNAPSHOT_TICKS; tick++) step(state);
    const last = state.events.at(-1);
    expect(last?.type).toBe('energy');
    if (last?.type !== 'energy') return;
    expect(last.levels.find((level) => level.uid === tank.uid)?.energy).toBe(tank.energy);
    expect(tank.energy).toBeGreaterThan(0);
  });

  it('indique l’énergie de départ au début du combat (Calamité des Dragons anciens)', () => {
    const teostra = findUnit('teostra');
    if (teostra === undefined) throw new Error('Teostra manquant');
    const result = simulateCombat({ player: [place(teostra, 3, 7)], enemy: [place(makeUnit({ id: 'cible' }), 3, 0)] }, 1);
    const start = result.events[0];
    if (start?.type !== 'combatStart') throw new Error('pas de début de combat');
    const snapshot = start.units.find((unit) => unit.defId === 'teostra');
    expect(snapshot?.energy).toBeCloseTo((snapshot?.maxEnergy ?? 0) * 0.4);
    expect(start.units.find((unit) => unit.defId === 'cible')?.energy).toBe(0);
  });
});
