import type { CombatEndReason, CombatEvent, Winner } from './events.ts';
import { createCombatState, type CombatSetup } from './setup.ts';
import { step } from './step.ts';

export interface CombatResult {
  readonly winner: Winner;
  readonly reason: CombatEndReason;
  readonly durationTicks: number;
  /** Journal complet du combat, à rejouer par le rendu. */
  readonly events: readonly CombatEvent[];
}

/** Simule un combat complet, sans affichage. Même setup + même graine = même résultat. */
export function simulateCombat(setup: CombatSetup, seed: number): CombatResult {
  const state = createCombatState(setup, seed);

  let end = step(state);
  while (end === null) end = step(state);

  return { winner: end.winner, reason: end.reason, durationTicks: state.tick, events: state.events };
}
