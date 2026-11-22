import { simulateCombat, type CombatResult, type CombatSetup, type Winner } from '../combat/index.ts';
import { randomInt } from '../core/random.ts';
import { createRng } from '../core/rng.ts';
import { ECONOMY, FORGE, REWARDS, RUN_STRUCTURE, URGENT_QUEST } from '../data/run-balance.ts';
import { roundIncome } from './economy.ts';
import { currentNode, generateStageMap, huntNumber, isCombatNode, reachableNodes } from './map.ts';
import { drawMerchantStock } from './merchant.ts';
import { createPool } from './pool.ts';
import { applyReward, canTakeReward, drawRewards } from './rewards.ts';
import { boardPlacements, boardUnits } from './roster.ts';
import { refreshShop } from './shop.ts';
import { OK, fail, type ActionResult, type RunState } from './state.ts';
import { huntInfo } from './structure.ts';

/**
 * Déroulement d'une run (game-design §2) : choix d'une case sur la carte → préparation → combat
 * (ou forge, marchand) → résultat (récompense) → case suivante, jusqu'à la victoire contre le boss
 * de l'étape 30 ou à la 3e défaite.
 */

export function createRun(seed: number): RunState {
  const rng = createRng(seed);
  return {
    seed,
    rng,
    hunt: 1,
    map: generateStageMap(1, rng),
    path: [],
    defeats: 0,
    zennys: ECONOMY.startZennys,
    level: ECONOMY.startLevel,
    shop: [],
    units: [],
    pool: createPool(),
    inventory: [],
    itemRemovers: 0,
    phase: 'map',
    enemy: [],
    merchant: null,
    reforgesLeft: 0,
    combatSeed: 0,
    wonLastCombat: false,
    rewards: null,
    lastCombat: null,
    outcome: null,
    nextUid: 1,
  };
}

/** Choisit la prochaine case parmi celles reliées à la case actuelle (toute l'étape 1 au début d'un stage). */
export function chooseNode(state: RunState, index: number): ActionResult {
  if (state.phase !== 'map') return fail('Ce n’est pas le moment de choisir une case.');
  const node = state.map.steps[state.path.length]?.[index];
  if (node === undefined || !reachableNodes(state).includes(node)) return fail('Cette case n’est pas reliée à ta position.');
  state.path.push(index);
  state.hunt = huntNumber(state.map.stage, node.step);
  startRound(state);
  return OK;
}

/** Début d'un tour sur la case choisie : revenus, boutique relancée gratuitement, escouade, forge ou marchand. */
export function startRound(state: RunState): void {
  state.zennys += roundIncome(state.zennys, state.wonLastCombat);
  state.wonLastCombat = false;
  refreshShop(state);
  const node = currentNode(state);
  // Un boss perdu se réaffronte à l'identique : l'escouade est celle de la case, générée avec la carte.
  state.enemy = node === null ? [] : [...node.squad];
  state.merchant = node?.kind === 'merchant' ? drawMerchantStock(state.rng) : null;
  state.reforgesLeft = node?.kind === 'forge' ? FORGE.reforges : 0;
  state.combatSeed = randomInt(state.rng, 2 ** 31);
  state.rewards = null;
  state.phase = 'prep';
}

/** Retour à la carte pour choisir l'étape suivante ; après un boss, la carte du stage suivant. */
function goToMap(state: RunState): void {
  const stage = huntInfo(state.hunt).stage;
  if (stage !== state.map.stage) {
    state.map = generateStageMap(stage, state.rng);
    state.path = [];
  }
  state.enemy = [];
  state.merchant = null;
  state.reforgesLeft = 0;
  state.rewards = null;
  state.phase = 'map';
}

export function combatSetup(state: RunState): CombatSetup {
  return { player: boardPlacements(state), enemy: state.enemy };
}

/** Lance le combat de la case en cours et applique son résultat. */
export function fight(state: RunState): { readonly ok: true; readonly result: CombatResult } | { readonly ok: false; readonly reason: string } {
  if (state.phase !== 'prep') return { ok: false, reason: 'Le combat se lance pendant la préparation.' };
  const node = currentNode(state);
  if (node !== null && !isCombatNode(node.kind)) return { ok: false, reason: 'Pas de combat sur cette case.' };
  if (boardUnits(state).length === 0) return { ok: false, reason: 'Pose au moins une unité sur le plateau.' };
  const result = simulateCombat(combatSetup(state), state.combatSeed);
  applyCombatResult(state, result.winner);
  return { ok: true, result };
}

/** Conséquences d'un combat (game-design §2, tableau « Résultat »). */
export function applyCombatResult(state: RunState, winner: Winner): void {
  const info = huntInfo(state.hunt);
  const urgent = currentNode(state)?.kind === 'urgent';
  const won = winner === 'player'; // ✅ une égalité est déjà comptée comme une victoire par le moteur
  state.lastCombat = { hunt: state.hunt, boss: info.isBoss, won };

  if (won) {
    state.wonLastCombat = true;
    if (info.isLast) {
      state.outcome = 'victory';
      state.phase = 'over';
      return;
    }
    if (info.isBoss) state.itemRemovers += REWARDS.bossItemRemovers;
    const multiplier = info.isBoss ? REWARDS.bossMultiplier : urgent ? URGENT_QUEST.rewardMultiplier : 1;
    state.rewards = drawRewards(state, multiplier);
    state.hunt += 1;
    state.phase = 'reward';
    return;
  }

  state.defeats += 1;
  if (state.defeats >= RUN_STRUCTURE.maxDefeats) {
    state.outcome = 'defeat';
    state.phase = 'over';
    return;
  }
  // Défaite contre une chasse ou une quête urgente : on passe à l'étape suivante. Contre un boss : on le réaffronte.
  if (info.isBoss) {
    startRound(state);
    return;
  }
  state.hunt += 1;
  goToMap(state);
}

/** Choisit une des récompenses proposées, puis retourne à la carte. */
export function chooseReward(state: RunState, index: number): ActionResult {
  if (state.phase !== 'reward' || state.rewards === null) return fail('Aucune récompense à choisir.');
  const option = state.rewards[index];
  if (option === undefined) return fail('Récompense introuvable.');
  if (!canTakeReward(state, option)) return fail('Pas assez de place en réserve pour cette unité.');
  const applied = applyReward(state, option);
  if (!applied.ok) return applied;
  goToMap(state);
  return OK;
}

/** Quitte une case sans combat (forge, marchand) pour reprendre la route. */
export function leaveNode(state: RunState): ActionResult {
  const node = currentNode(state);
  if (state.phase !== 'prep' || node === null || isCombatNode(node.kind)) return fail('Il faut d’abord livrer le combat de cette case.');
  state.hunt += 1;
  goToMap(state);
  return OK;
}
