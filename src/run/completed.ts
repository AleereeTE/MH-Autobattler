import { returnCopies } from './pool.ts';
import type { RunState } from './state.ts';

/**
 * ✅ Une unité obtenue au ★3 n'est plus proposée par la boutique ni par les récompenses
 * (game-design §8.2). Si le joueur la revend, elle peut de nouveau apparaître.
 */

/** Identifiants des unités que le joueur possède au ★3. */
export function completedUnitIds(state: RunState): Set<string> {
  return new Set(state.units.filter((unit) => unit.rank === 3).map((unit) => unit.unitId));
}

/** Retire de la boutique affichée les offres d'unités déjà obtenues au ★3 (leurs exemplaires retournent au stock). */
export function withdrawCompletedOffers(state: RunState): void {
  const completed = completedUnitIds(state);
  state.shop = state.shop.map((unitId) => {
    if (unitId === null || !completed.has(unitId)) return unitId;
    returnCopies(state.pool, unitId, 1);
    return null;
  });
}
