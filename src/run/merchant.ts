import { pickOne } from '../core/random.ts';
import type { Rng } from '../core/rng.ts';
import { MATERIAL_IDS, type MaterialId } from '../data/items.ts';
import { MERCHANT } from '../data/run-balance.ts';
import { currentNode } from './map.ts';
import { OK, fail, type ActionResult, type RunState } from './state.ts';

/**
 * Marchand (game-design §2.1, case sans combat) : ⚠️ 4 matériaux tirés au hasard à 3 zennys pièce,
 * et un retire-objet à 4 zennys.
 */

export interface MerchantStock {
  /** Matériaux proposés (null = déjà acheté). */
  readonly offers: (MaterialId | null)[];
  itemRemoverSold: boolean;
}

export function drawMerchantStock(rng: Rng): MerchantStock {
  const offers = Array.from({ length: MERCHANT.materialsOffered }, () => pickOne(rng, MATERIAL_IDS) ?? null);
  return { offers, itemRemoverSold: false };
}

/** Le joueur est-il chez le marchand (et peut-il encore acheter) ? */
export function isAtMerchant(state: RunState): boolean {
  return state.phase === 'prep' && currentNode(state)?.kind === 'merchant' && state.merchant !== null;
}

export function buyMaterial(state: RunState, offerIndex: number): ActionResult {
  if (!isAtMerchant(state) || state.merchant === null) return fail('Le marchand n’est pas là.');
  const material = state.merchant.offers[offerIndex];
  if (material === undefined || material === null) return fail('Ce matériau est déjà vendu.');
  if (state.zennys < MERCHANT.materialPrice) return fail(`Il faut ${MERCHANT.materialPrice} zennys.`);
  state.zennys -= MERCHANT.materialPrice;
  state.merchant.offers[offerIndex] = null;
  state.inventory.push({ kind: 'material', material });
  return OK;
}

export function buyItemRemover(state: RunState): ActionResult {
  if (!isAtMerchant(state) || state.merchant === null) return fail('Le marchand n’est pas là.');
  if (state.merchant.itemRemoverSold) return fail('Le retire-objet est déjà vendu.');
  if (state.zennys < MERCHANT.itemRemoverPrice) return fail(`Il faut ${MERCHANT.itemRemoverPrice} zennys.`);
  state.zennys -= MERCHANT.itemRemoverPrice;
  state.merchant.itemRemoverSold = true;
  state.itemRemovers += 1;
  return OK;
}
