import type { StarRank } from '../data/definitions.ts';
import type { Equipment } from '../data/items.ts';
import { createRun } from '../run/flow.ts';
import type { Location, RunState, RunUnit } from '../run/state.ts';

/** Run de test : graine fixe, sans unités, avec beaucoup de zennys et le niveau maximum. */
export function makeRun(overrides: Partial<Pick<RunState, 'zennys' | 'level'>> = {}): RunState {
  const state = createRun(1);
  state.zennys = overrides.zennys ?? 100;
  state.level = overrides.level ?? 9;
  return state;
}

/** Ajoute directement une unité possédée (sans passer par la boutique ni les fusions). */
export function giveUnit(state: RunState, unitId: string, location: Location, rank: StarRank = 1, equipment: Equipment = []): RunUnit {
  const unit: RunUnit = { uid: state.nextUid++, unitId, rank, equipment, location };
  state.units.push(unit);
  return unit;
}

export const bench = (index: number): Location => ({ area: 'bench', index });
export const board = (col: number, row: number): Location => ({ area: 'board', hex: { col, row } });
