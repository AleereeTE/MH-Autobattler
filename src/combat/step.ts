import { BALANCE } from '../data/balance.ts';
import { SAFETY_LIMIT_TICKS, secondsToTicks } from './constants.ts';
import type { CombatEndEvent } from './events.ts';
import type { CombatState, Side } from './state.ts';
import { tickLightning } from './traits/lightning.ts';
import { updateUnit } from './unit-turn.ts';

/**
 * Avance le combat d'un tick. Renvoie l'événement de fin si le combat est terminé, sinon null.
 */
export function step(state: CombatState): CombatEndEvent | null {
  state.tick += 1;
  if (state.tick === secondsToTicks(BALANCE.combatDuration)) {
    state.events.push({ type: 'suddenDeath', tick: state.tick });
  }

  tickLightning(state);

  // Les unités agissent dans l'ordre de leur identifiant.
  for (const unit of state.units) {
    if (unit.alive) updateUnit(state, unit);
  }

  resolveKnockouts(state);
  return checkEnd(state);
}

/**
 * Les K.O. sont résolus tous ensemble en fin de tick : deux unités qui se frappent
 * au même instant tombent ensemble, quel que soit leur ordre d'action.
 */
function resolveKnockouts(state: CombatState): void {
  for (const unit of state.units) {
    if (!unit.alive || unit.hp > 0) continue;
    unit.alive = false;
    unit.hp = 0;
    unit.move = null;
    unit.cast = null;
    unit.burn = null;
    unit.shields = [];
    unit.modifiers = [];
    state.events.push({ type: 'death', tick: state.tick, uid: unit.uid });
  }
}

function hasSurvivors(state: CombatState, side: Side): boolean {
  return state.units.some((unit) => unit.alive && unit.side === side);
}

function checkEnd(state: CombatState): CombatEndEvent | null {
  let end: CombatEndEvent | null = null;

  if (!hasSurvivors(state, 'enemy')) {
    // ✅ Une égalité (les deux camps éliminés au même tick) compte comme une victoire du joueur.
    end = { type: 'combatEnd', tick: state.tick, winner: 'player', reason: 'elimination' };
  } else if (!hasSurvivors(state, 'player')) {
    end = { type: 'combatEnd', tick: state.tick, winner: 'enemy', reason: 'elimination' };
  } else if (state.tick >= SAFETY_LIMIT_TICKS) {
    end = { type: 'combatEnd', tick: state.tick, winner: null, reason: 'safetyLimit' };
  }

  if (end !== null) state.events.push(end);
  return end;
}
