import { BOARD_COLS, BOARD_ROWS, type Hex } from '../core/hex.ts';

/**
 * Passage des cases de la grille aux pixels de l'écran (hexagones « pointe en haut »,
 * rangées impaires décalées d'un demi-hexagone vers la droite).
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface BoardLayout {
  /** Rayon d'un hexagone (du centre à un sommet), en pixels. */
  readonly size: number;
  readonly padding: number;
  readonly width: number;
  readonly height: number;
}

export function createLayout(size: number, padding = 8): BoardLayout {
  const hexWidth = Math.sqrt(3) * size;
  return {
    size,
    padding,
    width: padding * 2 + hexWidth * (BOARD_COLS + 0.5),
    height: padding * 2 + size * (2 + 1.5 * (BOARD_ROWS - 1)),
  };
}

export function hexCenter(layout: BoardLayout, { col, row }: Hex): Point {
  const hexWidth = Math.sqrt(3) * layout.size;
  return {
    x: layout.padding + hexWidth * (col + 0.5 * (row & 1)) + hexWidth / 2,
    y: layout.padding + layout.size + 1.5 * layout.size * row,
  };
}

export function hexCorners(layout: BoardLayout, center: Point, inset = 0): Point[] {
  const radius = layout.size - inset;
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  });
}

/** Case sous un point de l'écran (la plus proche), ou null si le point est hors du plateau. */
export function hexAtPoint(layout: BoardLayout, point: Point): Hex | null {
  let best: Hex | null = null;
  let bestDistance = Infinity;
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const center = hexCenter(layout, { col, row });
      const distance = Math.hypot(center.x - point.x, center.y - point.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { col, row };
      }
    }
  }
  return bestDistance <= layout.size ? best : null;
}

/** Point situé à `progress` (0 → 1) entre deux cases, pour animer un déplacement. */
export function lerpHex(layout: BoardLayout, from: Hex, to: Hex, progress: number): Point {
  const a = hexCenter(layout, from);
  const b = hexCenter(layout, to);
  return { x: a.x + (b.x - a.x) * progress, y: a.y + (b.y - a.y) * progress };
}
