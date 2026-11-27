import { describe, expect, it } from 'vitest';
import { findUnit } from '../../data/units/index.ts';
import { ULTIMATE_BANNER_TICKS, createReplay } from '../../render/replay.ts';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { createCombatState } from '../setup.ts';
import { simulateCombat } from '../simulate.ts';
import type { CombatUnit } from '../state.ts';
import { step } from '../step.ts';
import { currentSkill } from './current-skill.ts';

function rathalos() {
  const unit = findUnit('rathalos');
  if (unit === undefined) throw new Error('Rathalos manquant');
  return unit;
}

/** Rathalos (version boss ou non) contre une cible solide qui ne riposte presque pas. */
function rathalosState(boss: boolean) {
  const target = makeUnit({ id: 'cible', stats: { hp: 100_000, attack: 1 } });
  const state = createCombatState({ player: [place(target, 3, 6)], enemy: [{ ...place(rathalos(), 3, 1), rank: 3, boss }] }, 1);
  const unit = state.units.find((candidate) => candidate.def.id === 'rathalos') as CombatUnit;
  return { state, unit };
}

describe('rage des boss', () => {
  it('à mi-vie, un boss s’enrage une seule fois : énergie pleine et compétence de boss', () => {
    const { state, unit } = rathalosState(true);
    expect(currentSkill(unit).name).toBe('Boule de feu');
    unit.hp = unit.stats.hp * 0.6;
    step(state);
    expect(unit.enraged).toBe(false);

    unit.hp = unit.stats.hp * 0.5;
    step(state);
    expect(unit.enraged).toBe(true);
    expect(currentSkill(unit).name).toBe('Triple boule de feu');
    const rages = state.events.filter((event) => event.type === 'enrage');
    expect(rages).toEqual([{ type: 'enrage', tick: state.tick, uid: unit.uid, skillName: 'Triple boule de feu' }]);

    step(state);
    expect(state.events.filter((event) => event.type === 'enrage')).toHaveLength(1);
  });

  it('remplit son énergie : il lance sa compétence de boss dès qu’il peut', () => {
    const { state, unit } = rathalosState(true);
    unit.hp = unit.stats.hp * 0.4;
    step(state);
    expect(unit.energy).toBe(unit.stats.maxEnergy);
    for (let i = 0; i < 200 && !state.events.some((event) => event.type === 'skillCast'); i++) step(state);
    expect(state.events.find((event) => event.type === 'skillCast')).toMatchObject({ uid: unit.uid, skillName: 'Triple boule de feu' });
  });

  it('la même unité hors version boss ne s’enrage jamais', () => {
    const { state, unit } = rathalosState(false);
    unit.hp = unit.stats.hp * 0.1;
    step(state);
    expect(unit.enraged).toBe(false);
    expect(state.events.some((event) => event.type === 'enrage')).toBe(false);
  });

  it('une incantation commencée avant la rage garde sa compétence', () => {
    const { state, unit } = rathalosState(true);
    unit.cast = { remainingTicks: 5, skill: unit.def.skill };
    unit.hp = unit.stats.hp * 0.3;
    step(state);
    expect(unit.enraged).toBe(true);
    expect(currentSkill(unit).name).toBe('Boule de feu');
  });

  it('en combat complet : compétence normale avant la rage, compétence de boss après', () => {
    const team = [0, 2, 4, 6].map((col) => place(makeUnit({ id: `chasseur-${col}`, stats: { hp: 5000, attack: 60, attackSpeed: 1 } }), col, 5));
    const result = simulateCombat({ player: team, enemy: [{ ...place(rathalos(), 3, 1), rank: 3, boss: true }] }, 3);
    const rage = result.events.find((event) => event.type === 'enrage');
    expect(rage).toBeDefined();
    const casts = result.events.filter((event) => event.type === 'skillCast' && event.uid === rage?.uid);
    for (const cast of casts) {
      expect(cast.type === 'skillCast' && cast.skillName).toBe(cast.tick < (rage?.tick ?? 0) ? 'Boule de feu' : 'Triple boule de feu');
    }
    expect(casts.some((cast) => cast.tick >= (rage?.tick ?? 0))).toBe(true);
  });

  it('le replay montre l’anneau du boss, puis le bandeau « s’enrage ! » avec sa compétence de boss', () => {
    const { state, unit } = rathalosState(true);
    unit.hp = unit.stats.hp * 0.5;
    step(state);
    const replay = createReplay(state.events);
    const before = replay.frameAt(0).units.find((frameUnit) => frameUnit.uid === unit.uid);
    expect(before).toMatchObject({ boss: true, enraged: false });
    const frame = replay.frameAt(state.tick);
    expect(frame.units.find((frameUnit) => frameUnit.uid === unit.uid)).toMatchObject({ enraged: true });
    expect(frame.ultimate).toMatchObject({ unitName: 'Rathalos', headline: 'Rathalos s’enrage !', skillName: 'Triple boule de feu', side: 'enemy', age: 0 });
    expect(replay.frameAt(state.tick + ULTIMATE_BANNER_TICKS).ultimate).toBeNull();
  });
});
