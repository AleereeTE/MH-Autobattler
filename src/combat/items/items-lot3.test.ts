import { describe, expect, it } from 'vitest';
import type { SkillEffect } from '../../data/definitions.ts';
import type { Equipment, MaterialId } from '../../data/items.ts';
import { makeUnit, place, type UnitOverrides } from '../../test-utils/factories.ts';
import { basicAttack } from '../actions/basic-attack.ts';
import { healUnit } from '../actions/heal.ts';
import { TICKS_PER_SECOND } from '../constants.ts';
import { createCombatState } from '../setup.ts';
import { startCast } from '../skills/cast.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { tickStatuses } from '../status/tick-statuses.ts';
import { updateUnit } from '../unit-turn.ts';

const object = (materials: readonly [MaterialId, MaterialId]): Equipment => [{ kind: 'object', materials }];

/** Un porteur d'objet (côté joueur) et un adversaire juste en face. */
function duel(materials: readonly [MaterialId, MaterialId], holder: UnitOverrides = {}, opponent: UnitOverrides = {}, opponentEquipment: Equipment = []) {
  const state = createCombatState(
    {
      player: [place(makeUnit({ id: 'porteur', ...holder }), 3, 4, object(materials))],
      enemy: [place(makeUnit({ id: 'adversaire', ...opponent }), 3, 3, opponentEquipment)],
    },
    1,
  );
  const [bearer, enemy] = state.units as [CombatUnit, CombatUnit];
  return { state, bearer, enemy };
}

const instantSkill = (effects: SkillEffect[]) => ({ castTime: 0, effects });
const damageSkill: SkillEffect = { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [10, 10, 10], ratios: [] };
const statusEvents = (state: CombatState, status: string) => state.events.filter((event) => event.type === 'status' && event.status === status);

describe('objets du lot 3 — statuts', () => {
  it('Attaque poison : la compétence empoisonne (20 + 20 % de la puissance élémentaire par seconde pendant 4 s)', () => {
    const { state, bearer, enemy } = duel(['gem', 'fang'], { skill: instantSkill([damageSkill]), stats: { range: 3, elementalPower: 35 } }, { stats: { hp: 100_000 } });
    bearer.targetUid = enemy.uid;
    startCast(state, bearer);
    // Puissance élémentaire : 35 + 15 (Gemme) = 50 → 20 + 10 = 30 par seconde.
    expect(enemy.poison).toMatchObject({ sourceUid: bearer.uid, damagePerSecond: 30, remainingTicks: 4 * TICKS_PER_SECOND });
    expect(statusEvents(state, 'poison')).toHaveLength(1);

    for (let tick = 0; tick < TICKS_PER_SECOND; tick++) tickStatuses(state, enemy);
    const poisonHits = state.events.filter((event) => event.type === 'damage' && event.cause === 'poison');
    expect(poisonHits).toHaveLength(1);
    expect(poisonHits[0]).toMatchObject({ amount: 30, damageType: 'elemental' });

    for (let tick = 0; tick < 3 * TICKS_PER_SECOND; tick++) tickStatuses(state, enemy);
    expect(enemy.poison).toBeNull();
  });

  it('Attaque poison : une unité empoisonnée reçoit 40 % de soins en moins', () => {
    const { state, bearer, enemy } = duel(['gem', 'fang'], { skill: instantSkill([damageSkill]), stats: { range: 3 } }, { stats: { hp: 1000 } });
    bearer.targetUid = enemy.uid;
    startCast(state, bearer);
    enemy.hp = 500;
    expect(healUnit(state, enemy, enemy, 100)).toBeCloseTo(60);
  });

  it('Attaque paralysie : environ 1 attaque sur 10 paralyse la cible 1,5 s', () => {
    const { state, bearer, enemy } = duel(['horn', 'feather'], {}, { stats: { hp: 1_000_000 } });
    for (let i = 0; i < 500; i++) basicAttack(state, bearer, enemy);
    const paralyses = statusEvents(state, 'paralysis');
    expect(paralyses.length / 500).toBeGreaterThan(0.06);
    expect(paralyses.length / 500).toBeLessThan(0.14);
    expect(paralyses[0]).toMatchObject({ uid: enemy.uid, durationTicks: 1.5 * TICKS_PER_SECOND });
  });

  it('une unité paralysée n’agit plus jusqu’à la fin de la paralysie', () => {
    const { state, bearer, enemy } = duel(['horn', 'feather'], {}, { stats: { range: 1, attackSpeed: 10 } });
    enemy.paralyzedTicks = 3;
    for (let i = 0; i < 2; i++) updateUnit(state, enemy);
    expect(state.events.some((event) => event.type === 'attack' && event.uid === enemy.uid)).toBe(false);
    updateUnit(state, enemy);
    updateUnit(state, enemy);
    expect(state.events.some((event) => event.type === 'attack' && event.uid === enemy.uid)).toBe(true);
    expect(bearer.hp).toBeLessThan(bearer.stats.hp);
  });

  it('Anti-fléaux : ni poison, ni paralysie, ni ralentissement de compétence', () => {
    const slowSkill: SkillEffect = { ...damageSkill, slow: { attackSpeedPercent: -0.3, duration: 3 } } as SkillEffect;
    const poisoner = duel(['gem', 'fang'], { skill: instantSkill([slowSkill]), stats: { range: 3 } }, {}, object(['fang', 'fang']));
    poisoner.bearer.targetUid = poisoner.enemy.uid;
    startCast(poisoner.state, poisoner.bearer);
    expect(poisoner.enemy.poison).toBeNull();
    expect(poisoner.enemy.modifiers).toEqual([]);

    const paralyzer = duel(['horn', 'feather'], {}, { stats: { hp: 1_000_000 } }, object(['fang', 'fang']));
    for (let i = 0; i < 200; i++) basicAttack(paralyzer.state, paralyzer.bearer, paralyzer.enemy);
    expect(statusEvents(paralyzer.state, 'paralysis')).toEqual([]);
  });

  it('Anti-fléaux : pas de brûlure du trait Feu', () => {
    const state = createCombatState(
      {
        player: [place(makeUnit({ id: 'feu-1', element: 'fire' }), 3, 4), place(makeUnit({ id: 'feu-2', element: 'fire' }), 4, 4)],
        enemy: [place(makeUnit({ id: 'immunise' }), 3, 3, object(['fang', 'fang'])), place(makeUnit({ id: 'normal' }), 4, 3)],
      },
      1,
    );
    const [fire, , immune, normal] = state.units as [CombatUnit, CombatUnit, CombatUnit, CombatUnit];
    basicAttack(state, fire, immune);
    basicAttack(state, fire, normal);
    expect(immune.burn).toBeNull();
    expect(normal.burn).not.toBeNull();
  });
});

describe('objets du lot 3 — énergie', () => {
  it('Intimidateur : chaque attaque qui touche retire 5 énergie à la cible', () => {
    const { state, bearer, enemy } = duel(['fang', 'feather']);
    enemy.energy = 30;
    basicAttack(state, bearer, enemy);
    expect(enemy.energy).toBe(25);
  });

  it('Récupération d’endurance : +3 énergie par attaque de base', () => {
    const { state, bearer, enemy } = duel(['feather', 'extract']);
    basicAttack(state, bearer, enemy);
    // Bruiser : 8 énergie par attaque, +3.
    expect(bearer.energy).toBe(11);
  });

  it('Coups en chaîne : +5 énergie par coup critique', () => {
    const { state, bearer, enemy } = duel(['membrane', 'extract'], { stats: { critChance: 1 } });
    basicAttack(state, bearer, enemy);
    expect(bearer.energy).toBe(8 + 5);
  });

  it('Grand rayon : après sa compétence, les alliés à 2 cases ou moins gagnent 10 énergie', () => {
    const state = createCombatState(
      {
        player: [
          place(makeUnit({ id: 'porteur', skill: instantSkill([{ kind: 'shield', base: [10, 10, 10], ratios: [], duration: 1 }]) }), 3, 6, object(['fang', 'extract'])),
          place(makeUnit({ id: 'proche' }), 3, 5),
          place(makeUnit({ id: 'loin' }), 0, 7),
        ],
        enemy: [place(makeUnit({ id: 'ennemi' }), 3, 0)],
      },
      1,
    );
    const [bearer, near, far] = state.units as [CombatUnit, CombatUnit, CombatUnit];
    startCast(state, bearer);
    expect(near.energy).toBe(10);
    expect(far.energy).toBe(0);
    expect(bearer.energy).toBe(0);
  });
});
