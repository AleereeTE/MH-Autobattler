import { simulateCombat, type CombatResult, type CombatSetup, type Winner } from '../combat/index.ts';
import { randomInt } from '../core/random.ts';
import { createRng } from '../core/rng.ts';
import { ECONOMY, REWARDS, RUN_STRUCTURE } from '../data/run-balance.ts';
import { roundIncome } from './economy.ts';
import { generateSquad } from './enemies.ts';
import { createPool } from './pool.ts';
import { applyReward, canTakeReward, drawRewards } from './rewards.ts';
import { boardPlacements, boardUnits } from './roster.ts';
import { refreshShop } from './shop.ts';
import { OK, fail, type ActionResult, type RunState } from './state.ts';
import { huntInfo } from './structure.ts';

/**
 * Déroulement d'une run (game-design §2) : préparation → combat → résultat (récompense) → tour suivant,
 * jusqu'à la victoire contre le boss de la chasse 30 ou à la 3e défaite.
 */

export function createRun(seed: number): RunState {
  const state: RunState = {
    seed,
    rng: createRng(seed),
    hunt: 1,
    defeats: 0,
    zennys: ECONOMY.startZennys,
    level: ECONOMY.startLevel,
    shop: [],
    units: [],
    pool: createPool(),
    inventory: [],
    itemRemovers: 0,
    phase: 'prep',
    enemy: [],
    enemyHunt: 0,
    combatSeed: 0,
    wonLastCombat: false,
    rewards: null,
    lastCombat: null,
    outcome: null,
    nextUid: 1,
  };
  startRound(state);
  return state;
}

/** Début d'un tour : revenus, boutique relancée gratuitement, escouade de la chasse. */
export function startRound(state: RunState): void {
  state.zennys += roundIncome(state.zennys, state.wonLastCombat);
  state.wonLastCombat = false;
  refreshShop(state);
  // Un boss perdu se réaffronte à l'identique : l'escouade n'est générée qu'une fois par chasse.
  if (state.enemyHunt !== state.hunt) {
    state.enemy = generateSquad(state.hunt, state.rng);
    state.enemyHunt = state.hunt;
  }
  state.combatSeed = randomInt(state.rng, 2 ** 31);
  state.rewards = null;
  state.phase = 'prep';
}

export function combatSetup(state: RunState): CombatSetup {
  return { player: boardPlacements(state), enemy: state.enemy };
}

/** Lance le combat de la chasse en cours et applique son résultat. */
export function fight(state: RunState): { readonly ok: true; readonly result: CombatResult } | { readonly ok: false; readonly reason: string } {
  if (state.phase !== 'prep') return { ok: false, reason: 'Le combat se lance pendant la préparation.' };
  if (boardUnits(state).length === 0) return { ok: false, reason: 'Pose au moins une unité sur le plateau.' };
  const result = simulateCombat(combatSetup(state), state.combatSeed);
  applyCombatResult(state, result.winner);
  return { ok: true, result };
}

/** Conséquences d'un combat (game-design §2, tableau « Résultat »). */
export function applyCombatResult(state: RunState, winner: Winner): void {
  const info = huntInfo(state.hunt);
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
    state.rewards = drawRewards(state, info.isBoss);
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
  // Défaite contre une chasse classique : on passe à la suivante. Contre un boss : on le réaffronte.
  if (!info.isBoss) state.hunt += 1;
  startRound(state);
}

/** Choisit une des récompenses proposées, puis commence le tour suivant. */
export function chooseReward(state: RunState, index: number): ActionResult {
  if (state.phase !== 'reward' || state.rewards === null) return fail('Aucune récompense à choisir.');
  const option = state.rewards[index];
  if (option === undefined) return fail('Récompense introuvable.');
  if (!canTakeReward(state, option)) return fail('Pas assez de place en réserve pour cette unité.');
  const applied = applyReward(state, option);
  if (!applied.ok) return applied;
  startRound(state);
  return OK;
}
