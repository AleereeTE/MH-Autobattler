import { ECONOMY, RUN_STRUCTURE } from '../data/run-balance.ts';
import { levelUpCost } from './economy.ts';
import { drawUnitId, returnCopies, takeCopies, unitCost } from './pool.ts';
import { canReceive, receiveUnit } from './roster.ts';
import { OK, fail, type ActionResult, type RunState } from './state.ts';

/**
 * Boutique : 5 unités tirées du stock selon le niveau. Les unités proposées sont retirées du stock
 * tant qu'elles sont affichées, et y retournent si la boutique est relancée sans les acheter.
 */

/** Renouvelle les 5 offres (gratuit : utilisé au début de chaque tour et par la relance). */
export function refreshShop(state: RunState): void {
  for (const unitId of state.shop) if (unitId !== null) returnCopies(state.pool, unitId, 1);
  state.shop = Array.from({ length: RUN_STRUCTURE.shopSize }, () => {
    const unitId = drawUnitId(state.pool, state.level, state.rng);
    if (unitId === null || !takeCopies(state.pool, unitId, 1)) return null;
    return unitId;
  });
}

/** Relance payante. */
export function reroll(state: RunState): ActionResult {
  if (state.phase !== 'prep') return fail('La boutique est fermée pendant cette phase.');
  if (state.zennys < ECONOMY.rerollCost) return fail(`Il faut ${ECONOMY.rerollCost} zennys pour relancer.`);
  state.zennys -= ECONOMY.rerollCost;
  refreshShop(state);
  return OK;
}

/** Achète l'unité de l'emplacement `slot` ; elle rejoint la réserve et peut fusionner aussitôt. */
export function buy(state: RunState, slot: number): ActionResult {
  if (state.phase !== 'prep') return fail('La boutique est fermée pendant cette phase.');
  const unitId = state.shop[slot];
  if (unitId === null || unitId === undefined) return fail('Cet emplacement est vide.');
  const cost = unitCost(unitId);
  if (state.zennys < cost) return fail(`Il faut ${cost} zennys.`);
  if (!canReceive(state, unitId)) return fail('La réserve est pleine.');
  state.zennys -= cost;
  state.shop[slot] = null;
  return receiveUnit(state, unitId);
}

/** Améliore la boutique d'un niveau (une unité de plus sur le plateau, des unités plus chères). */
export function levelUp(state: RunState): ActionResult {
  if (state.phase !== 'prep') return fail('La boutique est fermée pendant cette phase.');
  const cost = levelUpCost(state.level);
  if (cost === null) return fail('La boutique est déjà au niveau maximum.');
  if (state.zennys < cost) return fail(`Il faut ${cost} zennys pour passer au niveau ${state.level + 1}.`);
  state.zennys -= cost;
  state.level += 1;
  return OK;
}
