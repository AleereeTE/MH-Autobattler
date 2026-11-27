import { pickOne, weightedIndex } from '../core/random.ts';
import { MATERIAL_IDS, SIGNATURE_OBJECTS, type MaterialId } from '../data/items.ts';
import { REWARDS, type DrawnRewardKind } from '../data/run-balance.ts';
import { captureTargets } from './capture.ts';
import { completedUnitIds } from './completed.ts';
import { drawUnitId, takeCopies } from './pool.ts';
import { canReceive, receiveUnit } from './roster.ts';
import { OK, fail, type ActionResult, type CaptureTarget, type RewardOption, type RunState } from './state.ts';

/**
 * Récompenses « 1 parmi 3 » (game-design §11) : la capture d'un monstre de l'escouade vaincue, toujours proposée
 * quand c'est possible, et des choix tirés au hasard parmi unité, objet, matériaux, retire-objet et zennys
 * (types différents). Après un boss ou une quête urgente, les quantités sont multipliées (`multiplier`, ×2).
 */

const OPTIONS_COUNT = 3;

/** Ordre d'affichage des choix. */
const DISPLAY_ORDER: readonly RewardOption['kind'][] = ['capture', 'unit', 'object', 'materials', 'itemRemovers', 'zennys'];

export function drawRewards(state: RunState, multiplier = 1): RewardOption[] {
  const options: RewardOption[] = [];
  const targets = captureTargets(state, state.enemy, multiplier);
  if (targets.length > 0) options.push({ kind: 'capture', targets });

  const kinds = Object.keys(REWARDS.weights) as DrawnRewardKind[];
  while (options.length < OPTIONS_COUNT && kinds.length > 0) {
    const index = weightedIndex(state.rng, kinds.map((kind) => REWARDS.weights[kind]));
    const [kind] = kinds.splice(Math.max(0, index), 1);
    const option = kind === undefined ? null : drawOption(state, kind, multiplier);
    if (option !== null) options.push(option);
  }
  return options.sort((a, b) => DISPLAY_ORDER.indexOf(a.kind) - DISPLAY_ORDER.indexOf(b.kind));
}

/** Un choix du type demandé, ou null s'il ne peut pas être proposé (plus aucune unité à tirer). */
function drawOption(state: RunState, kind: DrawnRewardKind, multiplier: number): RewardOption | null {
  switch (kind) {
    case 'unit': {
      const unitId = drawUnitId(state.pool, state.level, state.rng, completedUnitIds(state));
      if (unitId === null) return null;
      return { kind: 'unit', unitId, copies: Math.min(REWARDS.unitCopies * multiplier, state.pool.get(unitId) ?? 0) };
    }
    case 'object':
      return { kind: 'object', objects: repeat(REWARDS.objects * multiplier, () => pickOne(state.rng, SIGNATURE_OBJECTS)?.materials) };
    case 'materials':
      return { kind: 'materials', materials: repeat<MaterialId>(REWARDS.materials * multiplier, () => pickOne(state.rng, MATERIAL_IDS)) };
    case 'itemRemovers':
      return { kind: 'itemRemovers', amount: REWARDS.itemRemovers * multiplier };
    case 'zennys':
      return { kind: 'zennys', amount: REWARDS.zennys * multiplier };
  }
}

function repeat<T>(count: number, draw: () => T | undefined): T[] {
  const items: T[] = [];
  for (let i = 0; i < count; i++) {
    const item = draw();
    if (item !== undefined) items.push(item);
  }
  return items;
}

/**
 * Monstre capturé : celui demandé, ou à défaut le premier proposé (le plus fort de l'escouade).
 * undefined si ce n'est pas une capture ou si le monstre demandé n'est pas proposé.
 */
function captureTarget(option: RewardOption, unitId?: string): CaptureTarget | undefined {
  if (option.kind !== 'capture') return undefined;
  return unitId === undefined ? option.targets[0] : option.targets.find((target) => target.unitId === unitId);
}

/**
 * Peut-on prendre cette récompense ? Une unité ou une capture demandent de la place en réserve (ou une fusion).
 * Pour une capture sans monstre précisé : au moins un des monstres proposés peut rejoindre la réserve.
 */
export function canTakeReward(state: RunState, option: RewardOption, unitId?: string): boolean {
  switch (option.kind) {
    case 'unit':
      return canReceive(state, option.unitId, option.copies);
    case 'capture': {
      if (unitId === undefined) return option.targets.some((target) => canReceive(state, target.unitId, target.copies));
      const target = captureTarget(option, unitId);
      return target !== undefined && canReceive(state, target.unitId, target.copies);
    }
    default:
      return true;
  }
}

/** Applique une récompense ; `unitId` choisit le monstre d'une capture. */
export function applyReward(state: RunState, option: RewardOption, unitId?: string): ActionResult {
  switch (option.kind) {
    case 'capture': {
      const target = captureTarget(option, unitId);
      if (target === undefined) return fail('Ce monstre ne peut pas être capturé.');
      return giveCopies(state, target.unitId, target.copies);
    }
    case 'unit':
      return giveCopies(state, option.unitId, option.copies);
    case 'object':
      state.inventory.push(...option.objects.map((materials) => ({ kind: 'object' as const, materials })));
      return OK;
    case 'materials':
      state.inventory.push(...option.materials.map((material) => ({ kind: 'material' as const, material })));
      return OK;
    case 'itemRemovers':
      state.itemRemovers += option.amount;
      return OK;
    case 'zennys':
      state.zennys += option.amount;
      return OK;
  }
}

/** Exemplaires ★1 pris dans le stock commun, qui rejoignent la réserve (avec les fusions éventuelles). */
function giveCopies(state: RunState, unitId: string, copies: number): ActionResult {
  if (!canReceive(state, unitId, copies)) return fail('Pas assez de place en réserve pour cette unité.');
  if (!takeCopies(state.pool, unitId, copies)) return fail('Cette unité n’est plus disponible.');
  for (let i = 0; i < copies; i++) receiveUnit(state, unitId);
  return OK;
}
