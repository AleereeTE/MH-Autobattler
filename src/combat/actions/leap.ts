import { hexDistance, hexKey, neighbors, type Hex } from '../../core/hex.ts';
import { occupiedHexes } from '../behaviors/pathfinding.ts';
import type { CombatState, CombatUnit } from '../state.ts';

/** Fait bondir une unité sur la case libre, voisine de la cible, la plus proche d'elle. */
export function leapNextTo(state: CombatState, unit: CombatUnit, target: CombatUnit): void {
  unit.targetUid = target.uid;
  if (hexDistance(unit.position, target.position) <= 1) return;

  const blocked = occupiedHexes(unit, state.units);
  let best: Hex | null = null;
  for (const hex of neighbors(target.position)) {
    if (blocked.has(hexKey(hex))) continue;
    if (best === null || hexDistance(unit.position, hex) < hexDistance(unit.position, best)) best = hex;
  }
  if (best === null) return;

  state.events.push({ type: 'leap', tick: state.tick, uid: unit.uid, from: { ...unit.position }, to: { ...best } });
  unit.position = best;
  unit.move = null;
}
