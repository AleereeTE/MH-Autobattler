import { pickOne } from '../core/random.ts';
import { MATERIAL_IDS, type MaterialId } from '../data/items.ts';
import { REWARDS } from '../data/run-balance.ts';
import { drawUnitId, takeCopies } from './pool.ts';
import { canReceive, receiveUnit } from './roster.ts';
import { OK, fail, type ActionResult, type RewardOption, type RunState } from './state.ts';

/**
 * Récompenses « 1 parmi 3 » simplifiées (game-design §11) : un matériau, des zennys ou une unité ★1.
 * ⚠️ Après un boss, les quantités sont doublées.
 */

export function drawRewards(state: RunState, boss: boolean): RewardOption[] {
  const multiplier = boss ? REWARDS.bossMultiplier : 1;
  const materials: MaterialId[] = [];
  for (let i = 0; i < REWARDS.materials * multiplier; i++) {
    const material = pickOne(state.rng, MATERIAL_IDS);
    if (material !== undefined) materials.push(material);
  }
  const options: RewardOption[] = [
    { kind: 'materials', materials },
    { kind: 'zennys', amount: REWARDS.zennys * multiplier },
  ];
  const unitId = drawUnitId(state.pool, state.level, state.rng);
  if (unitId !== null) {
    const copies = Math.min(REWARDS.unitCopies * multiplier, state.pool.get(unitId) ?? 0);
    options.push({ kind: 'unit', unitId, copies });
  }
  return options;
}

/** Peut-on prendre cette récompense ? (une unité demande de la place en réserve, ou une fusion) */
export function canTakeReward(state: RunState, option: RewardOption): boolean {
  return option.kind !== 'unit' || canReceive(state, option.unitId, option.copies);
}

export function applyReward(state: RunState, option: RewardOption): ActionResult {
  switch (option.kind) {
    case 'materials':
      state.inventory.push(...option.materials.map((material) => ({ kind: 'material' as const, material })));
      return OK;
    case 'zennys':
      state.zennys += option.amount;
      return OK;
    case 'unit': {
      if (!canReceive(state, option.unitId, option.copies)) return fail('Pas assez de place en réserve pour cette unité.');
      if (!takeCopies(state.pool, option.unitId, option.copies)) return fail('Cette unité n’est plus disponible.');
      for (let i = 0; i < option.copies; i++) receiveUnit(state, option.unitId);
      return OK;
    }
  }
}
