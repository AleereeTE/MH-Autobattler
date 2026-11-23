import { describe, expect, it } from 'vitest';
import type { SkillEffect } from '../../data/definitions.ts';
import type { MaterialId } from '../../data/items.ts';
import { makeUnit, place, type UnitOverrides } from '../../test-utils/factories.ts';
import { basicAttack } from '../actions/basic-attack.ts';
import { dealDamage } from '../actions/damage.ts';
import { TICKS_PER_SECOND } from '../constants.ts';
import { createCombatState } from '../setup.ts';
import { startCast } from '../skills/cast.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { addShield } from '../status/shields.ts';
import { tickStatuses } from '../status/tick-statuses.ts';
import { itemAttackSpeedBonus } from './item-stats.ts';

/** Un porteur d'objet (côté joueur) et un adversaire juste en face. */
function duel(materials: readonly [MaterialId, MaterialId], holder: UnitOverrides = {}, opponent: UnitOverrides = {}) {
  const state = createCombatState(
    {
      player: [place(makeUnit({ id: 'porteur', ...holder }), 3, 4, [{ kind: 'object', materials }])],
      enemy: [place(makeUnit({ id: 'adversaire', ...opponent }), 3, 3)],
    },
    1,
  );
  const [bearer, enemy] = state.units as [CombatUnit, CombatUnit];
  return { state, bearer, enemy };
}

const hit = (amount: number, cause: 'attack' | 'skill' | 'burn' = 'attack') => ({ amount, type: 'physical' as const, isCrit: false, cause });
const damageEvents = (state: CombatState, targetUid: number) =>
  state.events.flatMap((event) => (event.type === 'damage' && event.targetUid === targetUid ? [event] : []));

/** Compétence instantanée (sans incantation) pour tester les effets de fin de compétence. */
const instantSkill = (effects: SkillEffect[]) => ({ castTime: 0, effects });
const damageSkill: SkillEffect = { kind: 'damage', target: 'currentTarget', damageType: 'physical', base: [100, 100, 100], ratios: [] };

describe('objets du lot 2 — quand l’unité est touchée', () => {
  it('Garde : attaques de base subies jamais critiques et −20 % de dégâts', () => {
    const { state, bearer, enemy } = duel(['horn', 'horn'], {}, { stats: { critChance: 1 } });
    basicAttack(state, enemy, bearer);
    const [attack] = damageEvents(state, bearer.uid);
    // Armure : 20 + 20 (Cornes) = 40 → 50 × 100 / 140, puis −20 %.
    expect(attack).toMatchObject({ isCrit: false });
    expect(attack?.amount).toBeCloseTo(((50 * 100) / 140) * 0.8);
    // Les compétences ne sont pas concernées.
    expect(dealDamage(state, enemy, bearer, hit(140, 'skill'))).toBeCloseTo(100);
  });

  it('Contre-attaque : renvoie 30 % des dégâts des attaques de base subies', () => {
    const { state, bearer, enemy } = duel(['bone', 'horn']);
    basicAttack(state, enemy, bearer);
    const [taken] = damageEvents(state, bearer.uid);
    const [reflected] = damageEvents(state, enemy.uid);
    expect(reflected).toMatchObject({ cause: 'item', damageType: 'physical' });
    expect(reflected?.amount).toBeCloseTo((taken?.amount ?? 0) * 0.3);
    // Une compétence n'est pas renvoyée.
    dealDamage(state, enemy, bearer, hit(100, 'skill'));
    expect(damageEvents(state, enemy.uid)).toHaveLength(1);
  });

  it('Bénédiction divine : environ 1 coup sur 4 ne fait que la moitié de ses dégâts (pas la brûlure)', () => {
    const { state, bearer, enemy } = duel(['carapace', 'horn']);
    const amounts = Array.from({ length: 400 }, () => dealDamage(state, enemy, bearer, hit(120, 'skill')));
    const full = (120 * 100) / 120; // armure 20 (Corne)
    const halved = amounts.filter((amount) => Math.abs(amount - full / 2) < 1e-6).length;
    expect(amounts.every((amount) => Math.abs(amount - full) < 1e-6 || Math.abs(amount - full / 2) < 1e-6)).toBe(true);
    expect(halved / amounts.length).toBeGreaterThan(0.18);
    expect(halved / amounts.length).toBeLessThan(0.32);
    expect(dealDamage(state, enemy, bearer, { ...hit(120, 'burn'), type: 'elemental' })).toBeCloseTo(120);
  });

  it('Récupération : rend 1,5 % des PV max une fois par seconde', () => {
    const { state, bearer } = duel(['carapace', 'fang']);
    bearer.hp = 100;
    state.tick = TICKS_PER_SECOND - 1;
    tickStatuses(state, bearer);
    expect(bearer.hp).toBe(100);
    state.tick = TICKS_PER_SECOND;
    tickStatuses(state, bearer);
    // PV max : 500 + 150 (Carapace) = 650 → 9,75 PV par seconde.
    expect(bearer.hp).toBeCloseTo(100 + 650 * 0.015);
  });

  it('Ressentiment : +2 % de vitesse d’attaque par coup subi (pas la brûlure), 40 % au plus', () => {
    const { state, bearer, enemy } = duel(['carapace', 'feather']);
    for (let i = 0; i < 5; i++) dealDamage(state, enemy, bearer, hit(1));
    dealDamage(state, enemy, bearer, { ...hit(1, 'burn'), type: 'elemental' });
    expect(itemAttackSpeedBonus(bearer, 0)).toBeCloseTo(0.1);
    for (let i = 0; i < 30; i++) dealDamage(state, enemy, bearer, hit(1));
    expect(itemAttackSpeedBonus(bearer, 0)).toBeCloseTo(0.4);
  });

  it('Garde offensive : +4 énergie par coup subi, même pour un rôle qui n’en gagne pas, sauf derrière un bouclier', () => {
    const { state, bearer, enemy } = duel(['carapace', 'extract'], { role: 'dps' });
    dealDamage(state, enemy, bearer, hit(10));
    expect(bearer.energy).toBe(4);
    addShield(bearer, 1000, 100);
    dealDamage(state, enemy, bearer, hit(10));
    expect(bearer.energy).toBe(4);
  });
});

describe('objets du lot 2 — compétences, soins et boucliers', () => {
  it('Garde renforcée : +30 armure et résistance pendant 4 s après chaque compétence', () => {
    const { state, bearer, enemy } = duel(['horn', 'extract'], { skill: instantSkill([damageSkill]), stats: { range: 3 } });
    bearer.targetUid = enemy.uid;
    startCast(state, bearer);
    expect(bearer.defenseBuff).toEqual({ amount: 30, remainingTicks: 4 * TICKS_PER_SECOND });
    // Armure : 20 (Corne) + 30 → 100 dégâts physiques deviennent 100 × 100 / 150.
    expect(dealDamage(state, enemy, bearer, hit(100, 'skill'))).toBeCloseTo((100 * 100) / 150);
    for (let tick = 0; tick < 4 * TICKS_PER_SECOND; tick++) tickStatuses(state, bearer);
    expect(bearer.defenseBuff).toBeNull();
  });

  it('Bonus soin : boucliers et soins de la compétence +30 %', () => {
    const shield: SkillEffect = { kind: 'shield', base: [100, 100, 100], ratios: [], duration: 4 };
    const { state, bearer } = duel(['gem', 'carapace'], { skill: instantSkill([shield]) });
    startCast(state, bearer);
    expect(bearer.shields[0]?.amount).toBeCloseTo(130);

    const heal: SkillEffect = { kind: 'heal', base: [100, 100, 100], ratios: [], radius: 2 };
    const healer = duel(['gem', 'carapace'], { skill: instantSkill([heal]) });
    healer.bearer.hp = 100;
    startCast(healer.state, healer.bearer);
    expect(healer.bearer.hp).toBeCloseTo(230);
  });

  it('Coalescence : +10 % de dégâts des compétences par compétence déjà lancée, 50 % au plus', () => {
    const { state, bearer, enemy } = duel(['gem', 'horn'], { skill: instantSkill([damageSkill]), stats: { range: 3 } }, { stats: { hp: 100_000 } });
    bearer.targetUid = enemy.uid;
    const skillDamage = () => {
      startCast(state, bearer);
      return damageEvents(state, enemy.uid).at(-1)?.amount ?? 0;
    };
    expect(skillDamage()).toBeCloseTo(100);
    expect(skillDamage()).toBeCloseTo(110);
    for (let i = 0; i < 6; i++) skillDamage();
    expect(skillDamage()).toBeCloseTo(150);
  });
});
