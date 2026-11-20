import { hexDistance, hexKey, neighbors, type Hex } from '../../core/hex.ts';
import type { CombatUnit } from '../state.ts';

/** Cases interdites : celles des autres unités en jeu et celles qu'elles sont en train de rejoindre. */
export function occupiedHexes(mover: CombatUnit, units: readonly CombatUnit[]): Set<string> {
  const blocked = new Set<string>();
  for (const unit of units) {
    if (!unit.alive || unit.uid === mover.uid) continue;
    blocked.add(hexKey(unit.position));
    if (unit.move !== null) blocked.add(hexKey(unit.move.to));
  }
  return blocked;
}

/**
 * Premier pas du plus court chemin vers une case d'où `mover` peut frapper `target`.
 * Parcours en largeur : on explore les cases par distance croissante, la première case
 * à portée trouvée donne donc le chemin le plus court.
 * Renvoie null si aucun chemin n'existe pour l'instant (cases bloquées).
 */
export function nextStepToward(mover: CombatUnit, target: CombatUnit, units: readonly CombatUnit[]): Hex | null {
  const blocked = occupiedHexes(mover, units);
  const visited = new Set<string>([hexKey(mover.position)]);
  const queue: Array<{ hex: Hex; firstStep: Hex | null }> = [{ hex: mover.position, firstStep: null }];

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (current === undefined) break;

    for (const next of neighbors(current.hex)) {
      const key = hexKey(next);
      if (visited.has(key) || blocked.has(key)) continue;
      visited.add(key);

      const firstStep = current.firstStep ?? next;
      if (hexDistance(next, target.position) <= mover.stats.range) return firstStep;
      queue.push({ hex: next, firstStep });
    }
  }
  return null;
}
