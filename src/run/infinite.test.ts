import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng.ts';
import { makeRun } from '../test-utils/run.ts';
import { generateSquad } from './enemies.ts';
import { applyCombatResult, chooseNode, chooseReward, continueInfinite } from './flow.ts';
import { canContinueInfinite, infiniteEnemyBonus, infiniteGrowth, isInfiniteHunt } from './infinite.ts';

/** Run qui vient de battre le boss de l'étape 30. */
function wonRun(defeats = 0) {
  const state = makeRun();
  state.hunt = 30;
  state.defeats = defeats;
  applyCombatResult(state, 'player');
  return state;
}

describe('mode infini — renforcement des ennemis', () => {
  it('commence après l’étape 30 : +5 % par étape', () => {
    expect(isInfiniteHunt(30)).toBe(false);
    expect(isInfiniteHunt(31)).toBe(true);
    expect(infiniteGrowth(12)).toBe(0);
    expect(infiniteGrowth(30)).toBe(0);
    expect(infiniteGrowth(31)).toBeCloseTo(0.05);
    expect(infiniteGrowth(40)).toBeCloseTo(0.5);
    expect(infiniteEnemyBonus(30)).toBeNull();
    expect(infiniteEnemyBonus(34)).toEqual({ hpPercent: 0.2, attackPercent: 0.2, elementalPowerPercent: 0.2 });
  });

  it('les escouades de la run ne sont pas renforcées, celles du mode infini le sont', () => {
    expect(generateSquad(29, createRng(3)).every((placement) => placement.bonus === undefined)).toBe(true);
    const squad = generateSquad(36, createRng(3));
    expect(squad.every((placement) => placement.bonus?.hpPercent !== undefined && Math.abs(placement.bonus.hpPercent - 0.3) < 1e-9)).toBe(true);
    // Quête urgente : renforcée comme 3 étapes plus loin.
    const urgent = generateSquad(36, createRng(3), 3);
    expect(urgent[0]?.bonus?.attackPercent).toBeCloseTo(0.45);
  });

  it('au-delà du stage 3, les escouades suivent ses règles : coût 4 et rang ★3 au plus, boss Dragon ancien ou Dragon noir', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const squad = generateSquad(45, createRng(seed));
      expect(squad.every((placement) => placement.unit.cost <= 4 && (placement.rank ?? 1) <= 3)).toBe(true);
      const boss = generateSquad(50, createRng(seed))[0];
      expect(boss?.unit.traits.some((trait) => trait === 'elder-dragon' || trait === 'black-dragon')).toBe(true);
    }
  });

  it('le moteur compte le renforcement dans les statistiques', () => {
    const [placement] = generateSquad(40, createRng(5));
    if (placement === undefined) throw new Error('escouade vide');
    expect(placement.bonus).toEqual({ hpPercent: 0.5, attackPercent: 0.5, elementalPowerPercent: 0.5 });
  });
});

describe('mode infini — déroulement', () => {
  it('ne se propose qu’à la fin d’une run gagnée', () => {
    expect(canContinueInfinite(makeRun())).toBe(false);
    expect(continueInfinite(makeRun())).toMatchObject({ ok: false });
    const lost = makeRun();
    lost.defeats = 2;
    applyCombatResult(lost, 'enemy');
    expect(lost.outcome).toBe('defeat');
    expect(canContinueInfinite(lost)).toBe(false);
    expect(canContinueInfinite(wonRun())).toBe(true);
  });

  it('donne les récompenses du boss de l’étape 30, puis la carte du stage 4', () => {
    const state = wonRun();
    const removers = state.itemRemovers;
    expect(continueInfinite(state).ok).toBe(true);
    expect(state).toMatchObject({ infinite: true, outcome: null, phase: 'reward', hunt: 31, itemRemovers: removers + 1 });
    expect(state.rewards).toHaveLength(3);
    expect(canContinueInfinite(state)).toBe(false);

    const zennys = state.rewards?.findIndex((option) => option.kind === 'zennys') ?? -1;
    expect(chooseReward(state, Math.max(0, zennys)).ok).toBe(true);
    expect(state.phase).toBe('map');
    expect(state.map.stage).toBe(4);
    expect(chooseNode(state, 0).ok).toBe(true);
    expect(state.enemy.every((placement) => placement.bonus?.hpPercent !== undefined)).toBe(true);
  });

  it('une victoire contre le boss d’un stage infini ne termine pas la partie', () => {
    const state = wonRun();
    continueInfinite(state);
    state.hunt = 40;
    applyCombatResult(state, 'player');
    expect(state).toMatchObject({ phase: 'reward', hunt: 41, outcome: null });
  });

  it('garde le compteur de défaites de la run : la 3e défaite termine le mode infini', () => {
    const state = wonRun(2);
    continueInfinite(state);
    state.phase = 'prep';
    applyCombatResult(state, 'enemy');
    expect(state).toMatchObject({ phase: 'over', outcome: 'defeat', infinite: true, defeats: 3, hunt: 31 });
    expect(canContinueInfinite(state)).toBe(false);
  });
});
