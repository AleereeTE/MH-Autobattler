import { TICKS_PER_SECOND } from '../constants.ts';
import type { CombatUnit } from '../state.ts';

/**
 * Enflamme une cible (trait Feu). Une nouvelle brûlure remplace l'ancienne et repart pour
 * toute sa durée, sans décaler le prochain tic de dégâts (sinon des coups rapprochés
 * empêcheraient la brûlure de jamais faire mal).
 */
export function applyBurn(
  target: CombatUnit,
  sourceUid: number,
  spec: { readonly damagePerSecond: number; readonly durationTicks: number },
): void {
  target.burn = {
    sourceUid,
    damagePerSecond: spec.damagePerSecond,
    remainingTicks: spec.durationTicks,
    ticksUntilDamage: target.burn?.ticksUntilDamage ?? TICKS_PER_SECOND,
  };
}
