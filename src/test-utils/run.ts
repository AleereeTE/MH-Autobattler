import type { StarRank } from '../data/definitions.ts';
import type { Equipment } from '../data/items.ts';
import { chooseNode, createRun, startRound } from '../run/flow.ts';
import type { MapNodeKind } from '../run/map.ts';
import type { Location, RunState, RunUnit } from '../run/state.ts';

/** Écarte le choix de talent du début de stage, pour tester la run sans talent. */
export function skipTalentChoice(state: RunState): RunState {
  state.talentChoice = null;
  state.phase = 'map';
  return state;
}

/**
 * Run de test : graine fixe, sans unités ni talent, avec beaucoup de zennys et le niveau maximum,
 * déjà en préparation sur la première case de la carte (une chasse normale).
 */
export function makeRun(overrides: Partial<Pick<RunState, 'zennys' | 'level'>> = {}): RunState {
  const state = skipTalentChoice(createRun(1));
  chooseNode(state, 0);
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

/**
 * Place directement le joueur sur une case de la carte (étape `step`, position `index`) et commence son tour,
 * sans vérifier les chemins : pratique pour tester une case précise.
 */
export function placeOnNode(state: RunState, step: number, index: number): void {
  state.path = [...Array.from({ length: step - 1 }, () => 0), index];
  state.hunt = (state.map.stage - 1) * 10 + step;
  startRound(state);
}

/** Première case d'un type donné sur la carte du stage (étape et position), ou null. */
export function findNode(state: RunState, kind: MapNodeKind): { step: number; index: number } | null {
  for (const row of state.map.steps) {
    const node = row.find((candidate) => candidate.kind === kind);
    if (node !== undefined) return { step: node.step, index: node.index };
  }
  return null;
}
