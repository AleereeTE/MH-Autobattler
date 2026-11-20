import { BALANCE } from '../../data/balance.ts';
import { nextStepToward } from '../behaviors/pathfinding.ts';
import { secondsToTicks } from '../constants.ts';
import type { CombatState, CombatUnit } from '../state.ts';

/**
 * Commence un déplacement d'une case vers la cible. La case d'arrivée est réservée
 * dès le départ, pour que deux unités ne visent jamais la même case.
 * Renvoie false si aucun chemin n'est disponible pour l'instant.
 */
export function startMove(state: CombatState, unit: CombatUnit, target: CombatUnit): boolean {
  const step = nextStepToward(unit, target, state.units);
  if (step === null) return false;

  const durationTicks = Math.max(1, secondsToTicks(1 / BALANCE.moveSpeed));
  unit.move = { to: step, remainingTicks: durationTicks };
  unit.attackProgress = 0;
  state.events.push({
    type: 'move',
    tick: state.tick,
    uid: unit.uid,
    from: { ...unit.position },
    to: { ...step },
    durationTicks,
  });
  return true;
}

/** Fait avancer le déplacement en cours ; l'unité change de case à l'arrivée. */
export function progressMove(unit: CombatUnit): void {
  if (unit.move === null) return;
  unit.move.remainingTicks -= 1;
  if (unit.move.remainingTicks <= 0) {
    unit.position = unit.move.to;
    unit.move = null;
  }
}
