import { simulateCombat, type CombatResult, type CombatSetup, type Placement, type Winner } from '../combat/index.ts';
import { randomInt } from '../core/random.ts';
import { createRng } from '../core/rng.ts';
import { ECONOMY, FORGE, REWARDS, RUN_STRUCTURE, URGENT_QUEST } from '../data/run-balance.ts';
import { roundIncome } from './economy.ts';
import { currentNode, generateStageMap, huntNumber, isCombatNode, reachableNodes } from './map.ts';
import { drawMerchantStock } from './merchant.ts';
import { canContinueInfinite } from './infinite.ts';
import { freeRerollsPerRound, maxInterest, talentCombatBonuses, talentIncome, talentTraitBonus } from './talent-effects.ts';
import { openTalentChoice, talentChoiceDue } from './talents.ts';
import { createPool } from './pool.ts';
import { applyReward, canTakeReward, drawRewards } from './rewards.ts';
import { sumBonuses } from '../rules/stats.ts';
import { boardPlacements, boardUnits } from './roster.ts';
import { refreshShop } from './shop.ts';
import { OK, fail, type ActionResult, type RunState } from './state.ts';
import { huntInfo } from './structure.ts';

/**
 * Déroulement d'une run (game-design §2) : choix d'un talent de chasseur au début des stages 1 à 3 →
 * choix d'une case sur la carte → préparation → combat
 * (ou forge, marchand) → résultat (récompense) → case suivante, jusqu'à la victoire contre le boss
 * de l'étape 30 ou à la 3e défaite. Une run gagnée peut continuer en mode infini (voir infinite.ts),
 * jusqu'à la 3e défaite.
 */

export function createRun(seed: number): RunState {
  const rng = createRng(seed);
  const state: RunState = {
    seed,
    rng,
    hunt: 1,
    infinite: false,
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
    talents: [],
    talentChoice: null,
    freeRerolls: 0,
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
  // La carte du stage 1 est tirée avant le talent : elle ne dépend pas de ce choix.
  openTalentChoice(state);
  return state;
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
  state.zennys += roundIncome(state.zennys, state.wonLastCombat, maxInterest(state)) + talentIncome(state);
  state.wonLastCombat = false;
  state.freeRerolls = freeRerollsPerRound(state);
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

/**
 * Retour à la carte pour choisir l'étape suivante ; après un boss, la carte du stage suivant,
 * précédée d'un choix de talent de chasseur pendant la run (stages 2 et 3).
 */
function goToMap(state: RunState): void {
  const stage = huntInfo(state.hunt).stage;
  const newStage = stage !== state.map.stage;
  if (newStage) {
    state.map = generateStageMap(stage, state.rng);
    state.path = [];
  }
  state.enemy = [];
  state.merchant = null;
  state.reforgesLeft = 0;
  state.rewards = null;
  state.phase = 'map';
  if (newStage && talentChoiceDue(stage)) openTalentChoice(state);
}

/** Bonus de combat des talents ajoutés au placement d'une unité du joueur. */
function withTalents(state: RunState, placement: Placement): Placement {
  const bonuses = talentCombatBonuses(state, placement.unit);
  return bonuses.length === 0 ? placement : { ...placement, bonus: sumBonuses(bonuses) };
}

export function combatSetup(state: RunState): CombatSetup {
  return {
    player: boardPlacements(state).map((placement) => withTalents(state, placement)),
    enemy: state.enemy,
    traitBonus: { player: talentTraitBonus(state) },
  };
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
    openRewards(state, info.isBoss, urgent);
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

/** Récompenses d'une victoire (×2 et un retire-objet après un boss, ×2 après une quête urgente), puis étape suivante. */
function openRewards(state: RunState, boss: boolean, urgent: boolean): void {
  if (boss) state.itemRemovers += REWARDS.bossItemRemovers;
  const multiplier = boss ? REWARDS.bossMultiplier : urgent ? URGENT_QUEST.rewardMultiplier : 1;
  state.rewards = drawRewards(state, multiplier);
  state.hunt += 1;
  state.phase = 'reward';
}

/**
 * Passe en mode infini après la victoire contre le boss de l'étape 30 : les récompenses de ce boss,
 * puis la carte du stage 4. Les défaites de la run restent comptées.
 */
export function continueInfinite(state: RunState): ActionResult {
  if (!canContinueInfinite(state)) return fail('Le mode infini s’ouvre à la fin d’une run gagnée.');
  state.infinite = true;
  state.outcome = null;
  openRewards(state, true, false);
  return OK;
}

/**
 * Choisit une des récompenses proposées, puis retourne à la carte.
 * Pour une capture, `unitId` désigne le monstre capturé (par défaut, le premier proposé : le plus fort de l'escouade).
 */
export function chooseReward(state: RunState, index: number, unitId?: string): ActionResult {
  if (state.phase !== 'reward' || state.rewards === null) return fail('Aucune récompense à choisir.');
  const option = state.rewards[index];
  if (option === undefined) return fail('Récompense introuvable.');
  const captured = option.kind === 'capture' ? (unitId ?? option.targets[0]?.unitId) : undefined;
  if (!canTakeReward(state, option, captured)) return fail('Pas assez de place en réserve pour cette unité.');
  const applied = applyReward(state, option, captured);
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
