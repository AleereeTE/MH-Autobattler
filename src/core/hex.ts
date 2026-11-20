/**
 * Grille hexagonale du plateau.
 *
 * Les cases sont repérées par (colonne, rangée). Les rangées impaires sont décalées
 * d'un demi-hexagone vers la droite (disposition « odd-r »), comme sur un plateau de TFT.
 * Pour calculer distances et voisins, on convertit en coordonnées « cubiques » (x, y, z),
 * où chaque pas vers une case voisine change exactement deux des trois valeurs de 1.
 */

export interface Hex {
  readonly col: number;
  readonly row: number;
}

/** Plateau : 7 colonnes × 4 rangées par camp. */
export const BOARD_COLS = 7;
export const ROWS_PER_SIDE = 4;
export const BOARD_ROWS = ROWS_PER_SIDE * 2;

interface Cube {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

function toCube({ col, row }: Hex): Cube {
  const x = col - (row - (row & 1)) / 2;
  const z = row;
  return { x, y: -x - z, z };
}

function fromCube({ x, z }: Cube): Hex {
  return { col: x + (z - (z & 1)) / 2, row: z };
}

const CUBE_DIRECTIONS: readonly Cube[] = [
  { x: 1, y: -1, z: 0 },
  { x: 1, y: 0, z: -1 },
  { x: 0, y: 1, z: -1 },
  { x: -1, y: 1, z: 0 },
  { x: -1, y: 0, z: 1 },
  { x: 0, y: -1, z: 1 },
];

/** Nombre minimal de pas pour aller d'une case à l'autre. */
export function hexDistance(a: Hex, b: Hex): number {
  const ca = toCube(a);
  const cb = toCube(b);
  return Math.max(Math.abs(ca.x - cb.x), Math.abs(ca.y - cb.y), Math.abs(ca.z - cb.z));
}

export function isOnBoard({ col, row }: Hex): boolean {
  return col >= 0 && col < BOARD_COLS && row >= 0 && row < BOARD_ROWS;
}

/** Cases voisines situées sur le plateau (2 à 6 selon la position). */
export function neighbors(hex: Hex): Hex[] {
  const c = toCube(hex);
  return CUBE_DIRECTIONS.map((d) => fromCube({ x: c.x + d.x, y: c.y + d.y, z: c.z + d.z })).filter(isOnBoard);
}

/** Clé texte unique d'une case, utile pour les Set et les Map. */
export function hexKey({ col, row }: Hex): string {
  return `${col},${row}`;
}
