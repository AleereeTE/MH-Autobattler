import type { Placement } from '../combat/index.ts';
import type { UnitDefinition } from '../data/definitions.ts';
import { REWARDS } from '../data/run-balance.ts';
import { completedUnitIds } from './completed.ts';
import { targetMonster } from './map.ts';
import type { CaptureTarget, RunState } from './state.ts';

/**
 * Capture (game-design §10) : après une victoire, la récompense « capture » permet de choisir un monstre
 * de l'escouade vaincue, qui rejoint la réserve au ★1. Les exemplaires sont pris dans le stock commun.
 */

/** ✅ Seuls les monstres se capturent, jamais les Dragons anciens ni les Dragons noirs. */
export function isCapturable(unit: UnitDefinition): boolean {
  return unit.kind === 'monster' && !unit.traits.includes('elder-dragon') && !unit.traits.includes('black-dragon');
}

/**
 * Monstres capturables d'une escouade, sans doublon, le plus fort en premier (le boss des stages 1 et 2,
 * ou le monstre cible de la chasse). Écarte ceux que le joueur possède déjà au ★3 et ceux dont le stock est vide ;
 * le nombre d'exemplaires est multiplié après un boss ou une quête urgente, dans la limite du stock.
 */
export function captureTargets(state: RunState, squad: readonly Placement[], multiplier = 1): CaptureTarget[] {
  const completed = completedUnitIds(state);
  const capturable = squad.filter((placement) => isCapturable(placement.unit) && !completed.has(placement.unit.id));
  const strongest = targetMonster(capturable);
  const ordered = strongest === null ? capturable : [strongest, ...capturable.filter((placement) => placement !== strongest)];
  const targets: CaptureTarget[] = [];
  for (const { unit } of ordered) {
    if (targets.some((existing) => existing.unitId === unit.id)) continue;
    const copies = Math.min(REWARDS.captureCopies * multiplier, state.pool.get(unit.id) ?? 0);
    if (copies > 0) targets.push({ unitId: unit.id, copies });
  }
  return targets;
}
