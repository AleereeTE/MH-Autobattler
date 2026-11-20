/**
 * API publique du moteur de combat.
 * L'interface et le rendu n'importent que depuis ce fichier, jamais depuis les fichiers internes.
 */
export { simulateCombat, type CombatResult } from './simulate.ts';
export { createCombatState, isInSideArea, type CombatSetup, type Placement } from './setup.ts';
export { step } from './step.ts';
export { TICKS_PER_SECOND, ticksToSeconds } from './constants.ts';
export type {
  CombatEndReason,
  CombatEvent,
  DamageCause,
  SkillEffectKind,
  StatusKind,
  TraitSummary,
  UnitSnapshot,
  Winner,
} from './events.ts';
export { SIDES, type CombatState, type CombatUnit, type Side } from './state.ts';
