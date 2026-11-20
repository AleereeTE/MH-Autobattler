import { hexDistance, hexesWithin, type Hex } from '../core/hex.ts';

/**
 * Animation de la zone d'effet d'une compétence : une onde part du centre et
 * s'étend anneau par anneau, puis s'efface.
 */

/** Retard de chaque anneau, en fraction de la durée de l'animation. */
const RING_DELAY = 0.18;
/** Part de la vie d'une case consacrée à son apparition (le reste sert à s'effacer). */
const FADE_IN = 0.15;

export interface AreaCell {
  readonly hex: Hex;
  /** Intensité de 0 (invisible) à 1 (pleine). */
  readonly intensity: number;
}

/**
 * Intensité de chaque case de la zone, pour un âge d'animation donné
 * (0 = la compétence vient de prendre effet, 1 = fin de l'animation).
 */
export function areaCells(center: Hex, radius: number, age: number): AreaCell[] {
  const span = Math.max(0.2, 1 - radius * RING_DELAY);
  const cells: AreaCell[] = [];
  for (const hex of hexesWithin(center, radius)) {
    const local = (age - hexDistance(center, hex) * RING_DELAY) / span;
    if (local <= 0 || local >= 1) continue;
    const intensity = local < FADE_IN ? local / FADE_IN : 1 - (local - FADE_IN) / (1 - FADE_IN);
    cells.push({ hex, intensity });
  }
  return cells;
}
