import { isInSideArea, type Placement } from '../combat/index.ts';
import { hexKey, isOnBoard, type Hex } from '../core/hex.ts';
import { RUN_STRUCTURE } from '../data/run-balance.ts';
import { findUnit } from '../data/units/index.ts';
import { BLACK_DRAGON_LIMIT_MESSAGE, exceedsBlackDragonLimit } from '../rules/board-limits.ts';
import { withdrawCompletedOffers } from './completed.ts';
import { copiesForRank, sellValue } from './economy.ts';
import { resolveMerges } from './merge.ts';
import { returnCopies } from './pool.ts';
import { OK, fail, type ActionResult, type Location, type RunState, type RunUnit } from './state.ts';
import { boardCapacity } from './talent-effects.ts';

/**
 * Unités du joueur : réserve (10 places), plateau (autant d'unités que le niveau de boutique), vente.
 */

export function sameLocation(a: Location, b: Location): boolean {
  if (a.area === 'bench' && b.area === 'bench') return a.index === b.index;
  if (a.area === 'board' && b.area === 'board') return hexKey(a.hex) === hexKey(b.hex);
  return false;
}

export function unitAt(state: RunState, location: Location): RunUnit | undefined {
  return state.units.find((unit) => sameLocation(unit.location, location));
}

export function findRunUnit(state: RunState, uid: number): RunUnit | undefined {
  return state.units.find((unit) => unit.uid === uid);
}

export function boardUnits(state: RunState): RunUnit[] {
  return state.units.filter((unit) => unit.location.area === 'board');
}

export function freeBenchIndex(state: RunState): number {
  for (let index = 0; index < RUN_STRUCTURE.benchSize; index++) {
    if (unitAt(state, { area: 'bench', index }) === undefined) return index;
  }
  return -1;
}

/** Une case du camp du joueur (rangées 4 à 7). */
export function isPlayerHex(hex: Hex): boolean {
  return isOnBoard(hex) && isInSideArea('player', hex);
}

/** Pose un exemplaire ★1 en réserve (ou en attente s'il fusionne aussitôt), puis applique les fusions. */
function placeOrMerge(state: RunState, unitId: string): boolean {
  const index = freeBenchIndex(state);
  const mergesAtOnce = state.units.filter((unit) => unit.unitId === unitId && unit.rank === 1).length >= 2;
  if (index < 0 && !mergesAtOnce) return false;
  // index −1 : place d'attente, consommée par la fusion qui suit.
  state.units.push({ uid: state.nextUid++, unitId, rank: 1, equipment: [], location: { area: 'bench', index } });
  resolveMerges(state);
  return true;
}

/**
 * Peut-on recevoir `copies` exemplaires ★1 de cette unité ? Oui s'il y a de la place en réserve,
 * ou si l'exemplaire déclenche une fusion (même réserve pleine). Vérifié en simulant sur une copie de l'état.
 */
export function canReceive(state: RunState, unitId: string, copies = 1): boolean {
  const simulation: RunState = {
    ...state,
    units: state.units.map((unit) => ({ ...unit })),
    inventory: [...state.inventory],
  };
  for (let i = 0; i < copies; i++) if (!placeOrMerge(simulation, unitId)) return false;
  return true;
}

/**
 * Ajoute un exemplaire ★1 (déjà retiré du stock) : en réserve, puis fusions automatiques.
 * Si une fusion donne un ★3, cette unité disparaît aussitôt de la boutique affichée.
 */
export function receiveUnit(state: RunState, unitId: string): ActionResult {
  if (!placeOrMerge(state, unitId)) return fail('La réserve est pleine.');
  withdrawCompletedOffers(state);
  return OK;
}

/**
 * Déplace une unité vers une place de réserve ou une case du plateau. Si la place est occupée,
 * les deux unités s'échangent. Poser une unité de plus sur le plateau demande un niveau suffisant.
 */
export function moveUnit(state: RunState, uid: number, to: Location): ActionResult {
  if (state.phase !== 'prep') return fail('Les unités se déplacent pendant la préparation.');
  const unit = findRunUnit(state, uid);
  if (unit === undefined) return fail('Unité introuvable.');
  if (to.area === 'board' && !isPlayerHex(to.hex)) return fail('Pose tes unités dans ton camp (les 4 rangées du bas).');
  if (to.area === 'bench' && (to.index < 0 || to.index >= RUN_STRUCTURE.benchSize)) return fail('Place de réserve invalide.');
  if (sameLocation(unit.location, to)) return OK;

  const occupant = unitAt(state, to);
  // ✅ Un seul Dragon noir sur le plateau : on regarde la composition qu'aurait le plateau après le déplacement (échange compris).
  const boardAfter = state.units.filter((candidate) => {
    const location = candidate === unit ? to : candidate === occupant ? unit.location : candidate.location;
    return location.area === 'board';
  });
  if (exceedsBlackDragonLimit(boardAfter.flatMap((candidate) => findUnit(candidate.unitId) ?? []))) {
    return fail(BLACK_DRAGON_LIMIT_MESSAGE);
  }
  if (occupant !== undefined) {
    occupant.location = unit.location;
    unit.location = to;
    return OK;
  }
  const capacity = boardCapacity(state);
  if (to.area === 'board' && unit.location.area === 'bench' && boardUnits(state).length >= capacity) {
    return fail(`Plateau complet : ${capacity} unités au plus. Améliore la boutique pour en poser plus.`);
  }
  unit.location = to;
  return OK;
}

/** Vend une unité : ses exemplaires retournent au stock, son équipement à l'inventaire. */
export function sellUnit(state: RunState, uid: number): ActionResult {
  if (state.phase !== 'prep') return fail('La vente se fait pendant la préparation.');
  const unit = findRunUnit(state, uid);
  const definition = unit === undefined ? undefined : findUnit(unit.unitId);
  if (unit === undefined || definition === undefined) return fail('Unité introuvable.');
  state.zennys += sellValue(definition.cost, unit.rank);
  returnCopies(state.pool, unit.unitId, copiesForRank(unit.rank));
  state.inventory.push(...unit.equipment);
  state.units = state.units.filter((other) => other !== unit);
  return OK;
}

/** Placements du joueur pour le moteur de combat. */
export function boardPlacements(state: RunState): Placement[] {
  return boardUnits(state).flatMap((unit) => {
    const definition = findUnit(unit.unitId);
    if (definition === undefined || unit.location.area !== 'board') return [];
    return [{ unit: definition, position: unit.location.hex, equipment: unit.equipment, rank: unit.rank }];
  });
}
