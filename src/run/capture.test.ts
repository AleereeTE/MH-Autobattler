import { describe, expect, it } from 'vitest';
import type { Placement } from '../combat/index.ts';
import { findUnit } from '../data/units/index.ts';
import { bench, giveUnit, makeRun } from '../test-utils/run.ts';
import { captureTargets, isCapturable } from './capture.ts';
import { chooseReward } from './flow.ts';
import { canTakeReward } from './rewards.ts';
import type { RunState } from './state.ts';

function placement(unitId: string, col: number, rank: 1 | 2 | 3 = 1): Placement {
  const unit = findUnit(unitId);
  if (unit === undefined) throw new Error(`unité inconnue : ${unitId}`);
  return { unit, position: { col, row: 0 }, rank };
}

/** Run en phase de récompense, avec une capture proposée sur l'escouade donnée. */
function captureRun(squad: Placement[], multiplier = 1): RunState {
  const state = makeRun();
  state.enemy = squad;
  state.phase = 'reward';
  state.rewards = [{ kind: 'capture', targets: captureTargets(state, squad, multiplier) }];
  return state;
}

describe('isCapturable', () => {
  it('accepte les monstres, jamais les chasseurs, les Dragons anciens ni les Dragons noirs', () => {
    const capturable = (id: string) => isCapturable(placement(id, 0).unit);
    expect(capturable('rathalos')).toBe(true);
    expect(capturable('lea')).toBe(false);
    expect(capturable('kirin')).toBe(false);
    expect(capturable('fatalis')).toBe(false);
  });
});

describe('captureTargets', () => {
  it('propose chaque monstre une seule fois, le plus fort des monstres capturables en premier', () => {
    const state = makeRun();
    const squad = [placement('khezu', 0), placement('khezu', 1), placement('rathalos', 2, 2), placement('kirin', 3, 2)];
    // Kirin (Dragon ancien) est la cible mais ne se capture pas : Rathalos ★2 passe devant Khezu.
    expect(captureTargets(state, squad)).toEqual([
      { unitId: 'rathalos', copies: 1 },
      { unitId: 'khezu', copies: 1 },
    ]);
  });

  it('écarte les monstres déjà obtenus au ★3 et ceux dont le stock est vide', () => {
    const state = makeRun();
    giveUnit(state, 'khezu', bench(0), 3);
    state.pool.set('rathalos', 0);
    expect(captureTargets(state, [placement('khezu', 0), placement('rathalos', 1), placement('anjanath', 2)])).toEqual([{ unitId: 'anjanath', copies: 1 }]);
  });

  it('multiplie les exemplaires après un boss ou une quête urgente, dans la limite du stock', () => {
    const state = makeRun();
    state.pool.set('khezu', 1);
    expect(captureTargets(state, [placement('rathalos', 0, 3), placement('khezu', 1)], 2)).toEqual([
      { unitId: 'rathalos', copies: 2 },
      { unitId: 'khezu', copies: 1 },
    ]);
  });
});

describe('capture choisie en récompense', () => {
  it('le monstre choisi rejoint la réserve au ★1, et ses exemplaires quittent le stock', () => {
    const state = captureRun([placement('rathalos', 0, 2), placement('khezu', 1)], 2);
    const stock = state.pool.get('khezu') ?? 0;
    expect(chooseReward(state, 0, 'khezu').ok).toBe(true);
    expect(state.units).toMatchObject([
      { unitId: 'khezu', rank: 1 },
      { unitId: 'khezu', rank: 1 },
    ]);
    expect(state.pool.get('khezu')).toBe(stock - 2);
    expect(state.phase).toBe('map');
  });

  it('refuse un monstre qui n’est pas proposé', () => {
    const state = captureRun([placement('khezu', 0)]);
    expect(chooseReward(state, 0, 'rathalos')).toMatchObject({ ok: false });
    expect(state.phase).toBe('reward');
  });

  it('demande de la place en réserve, sauf si la capture déclenche une fusion', () => {
    const state = captureRun([placement('khezu', 0), placement('rathalos', 1)]);
    for (let index = 0; index < 8; index++) giveUnit(state, 'minoto', bench(index), 3);
    giveUnit(state, 'rathalos', bench(8));
    giveUnit(state, 'rathalos', { area: 'board', hex: { col: 3, row: 5 } });
    const option = state.rewards?.[0];
    if (option === undefined) throw new Error('capture manquante');
    // Réserve pleine (à la place de la réserve près) : Khezu ne rentre pas, Rathalos fusionne en ★2.
    giveUnit(state, 'minoto', bench(9), 3);
    expect(canTakeReward(state, option, 'khezu')).toBe(false);
    expect(canTakeReward(state, option, 'rathalos')).toBe(true);
    expect(canTakeReward(state, option)).toBe(true);
    expect(chooseReward(state, 0, 'khezu')).toMatchObject({ ok: false });
    expect(chooseReward(state, 0, 'rathalos').ok).toBe(true);
    expect(state.units.filter((unit) => unit.unitId === 'rathalos')).toMatchObject([{ rank: 2 }]);
  });
});
