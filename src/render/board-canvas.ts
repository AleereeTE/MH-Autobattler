import { BOARD_COLS, BOARD_ROWS, ROWS_PER_SIDE, type Hex } from '../core/hex.ts';
import type { Element, StarRank, UnitCost } from '../data/definitions.ts';
import { hexCenter, hexCorners, lerpHex, type BoardLayout, type Point } from './hex-layout.ts';
import type { FloatingText } from './replay.ts';
import { areaCells } from './skill-area.ts';

/**
 * Rendu Canvas 2D temporaire du plateau : des hexagones et des jetons (cercles avec portrait ou initiales).
 * Il ne connaît que des « scènes » (ce qu'il faut dessiner), jamais le moteur de combat.
 */

export interface BoardTheme {
  readonly cellPlayer: string;
  readonly cellEnemy: string;
  readonly cellStroke: string;
  readonly highlight: string;
  readonly player: string;
  readonly enemy: string;
  readonly unitText: string;
  readonly hpBack: string;
  readonly shield: string;
  readonly text: string;
  readonly crit: string;
  readonly heal: string;
  readonly elements: Readonly<Record<Element | 'none', string>>;
  /** Fond des jetons selon le coût : gris, vert, bleu, violet, doré. */
  readonly costs: Readonly<Record<UnitCost, string>>;
  /** Couleurs du fond prismatique (coût 6, Dragons noirs), dans l'ordre du dégradé. */
  readonly prismatic: readonly string[];
  /** Couleur des étoiles selon le rang (bronze, argent, or) et fond de leur pastille. */
  readonly ranks: Readonly<Record<StarRank, string>>;
  readonly rankBadge: string;
  /** Couleurs des zones d'effet qui ne dépendent pas de l'élément du lanceur. */
  readonly areas: Readonly<Record<Exclude<AreaTone, 'damage'>, string>>;
}

/** Image affichée dans le jeton d'une unité. */
export interface Portrait {
  readonly image: CanvasImageSource;
  readonly width: number;
  readonly height: number;
}

/** Nature d'une zone d'effet : les dégâts prennent la couleur de l'élément du lanceur. */
export type AreaTone = 'damage' | 'heal' | 'shield' | 'buff';

export interface SceneArea {
  readonly center: Hex;
  readonly radius: number;
  readonly tone: AreaTone;
  readonly element: Element | null;
  /** 0 = la compétence vient de prendre effet, 1 = fin de l'animation. */
  readonly age: number;
}

export interface SceneUnit {
  readonly key: string | number;
  readonly label: string;
  /** Portrait affiché à la place des initiales, s'il existe. */
  readonly portrait?: Portrait | null;
  readonly side: 'player' | 'enemy';
  readonly element: Element | null;
  readonly cost: UnitCost;
  readonly rank: StarRank;
  readonly position: Hex;
  readonly moving?: { readonly to: Hex; readonly progress: number } | null;
  readonly hpRatio: number;
  readonly shieldRatio?: number;
  readonly alive: boolean;
  readonly selected?: boolean;
  readonly casting?: boolean;
  readonly burning?: boolean;
  readonly chilled?: boolean;
  readonly hasted?: boolean;
}

export interface BoardScene {
  readonly units: readonly SceneUnit[];
  readonly texts?: readonly FloatingText[];
  readonly areas?: readonly SceneArea[];
  readonly highlight?: Hex | null;
  readonly banner?: string | null;
}

function tracePath(ctx: CanvasRenderingContext2D, points: readonly Point[]): void {
  ctx.beginPath();
  points.forEach((point, i) => (i === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
  ctx.closePath();
}

function drawCells(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: BoardTheme, highlight: Hex | null): void {
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const isHighlight = highlight !== null && highlight.col === col && highlight.row === row;
      tracePath(ctx, hexCorners(layout, hexCenter(layout, { col, row }), 1));
      ctx.fillStyle = row < ROWS_PER_SIDE ? theme.cellEnemy : theme.cellPlayer;
      ctx.fill();
      ctx.lineWidth = isHighlight ? 3 : 1;
      ctx.strokeStyle = isHighlight ? theme.highlight : theme.cellStroke;
      ctx.stroke();
    }
  }
}

function unitCenter(layout: BoardLayout, unit: SceneUnit): Point {
  return unit.moving ? lerpHex(layout, unit.position, unit.moving.to, unit.moving.progress) : hexCenter(layout, unit.position);
}

function drawUnit(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: BoardTheme, unit: SceneUnit): void {
  const center = unitCenter(layout, unit);
  const radius = layout.size * 0.62;
  ctx.globalAlpha = unit.alive ? 1 : 0.25;

  // Fond de la couleur du coût, portrait éventuel, anneau de la couleur de l'élément.
  // Le camp se lit sur la barre de vie (voir drawBars).
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = unit.cost === 6 ? prismaticFill(ctx, center, theme) : theme.costs[unit.cost];
  ctx.fill();
  const portrait = unit.portrait ?? null;
  if (portrait !== null) drawPortrait(ctx, portrait, center, radius - 2);
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = theme.elements[unit.element ?? 'none'];
  ctx.stroke();

  if (unit.selected === true || unit.casting === true) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius + 5, 0, Math.PI * 2);
    ctx.setLineDash(unit.casting === true ? [4, 3] : []);
    ctx.lineWidth = 2;
    ctx.strokeStyle = theme.highlight;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (portrait === null) {
    ctx.fillStyle = theme.unitText;
    ctx.font = `600 ${Math.round(layout.size * 0.42)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unit.label, center.x, center.y + 1);
  }

  if (unit.alive) drawBars(ctx, layout, theme, unit, center);
  drawRank(ctx, layout, theme, unit, center, radius);
  drawStatusDots(ctx, theme, unit, center, radius);
  ctx.globalAlpha = 1;
}

/** Fond prismatique (coût 6) : un dégradé arc-en-ciel qui fait le tour du jeton. */
function prismaticFill(ctx: CanvasRenderingContext2D, center: Point, theme: BoardTheme): CanvasGradient | string {
  if (theme.prismatic.length < 2) return theme.costs[6];
  const gradient = ctx.createConicGradient(-Math.PI / 2, center.x, center.y);
  theme.prismatic.forEach((color, index) => gradient.addColorStop(index / theme.prismatic.length, color));
  gradient.addColorStop(1, theme.prismatic[0] ?? theme.costs[6]);
  return gradient;
}

/** Dessine le portrait dans le cercle, en le recadrant pour qu'il le remplisse. */
function drawPortrait(ctx: CanvasRenderingContext2D, portrait: Portrait, center: Point, radius: number): void {
  const scale = (radius * 2) / Math.min(portrait.width, portrait.height);
  const width = portrait.width * scale;
  const height = portrait.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(portrait.image, center.x - width / 2, center.y - height / 2, width, height);
  ctx.restore();
}

function areaColor(theme: BoardTheme, area: SceneArea): string {
  return area.tone === 'damage' ? theme.elements[area.element ?? 'none'] : theme.areas[area.tone];
}

/** Cases de la zone d'effet, qui s'allument du centre vers l'extérieur (sous les unités). */
function drawAreaCells(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: BoardTheme, areas: readonly SceneArea[]): void {
  for (const area of areas) {
    const color = areaColor(theme, area);
    for (const cell of areaCells(area.center, area.radius, area.age)) {
      tracePath(ctx, hexCorners(layout, hexCenter(layout, cell.hex), 2));
      ctx.globalAlpha = 0.45 * cell.intensity;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 0.9 * cell.intensity;
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

/** Onde circulaire qui part du centre de la zone (par-dessus les unités). */
function drawAreaWaves(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: BoardTheme, areas: readonly SceneArea[]): void {
  const step = Math.sqrt(3) * layout.size; // distance entre deux cases voisines
  for (const area of areas) {
    const center = hexCenter(layout, area.center);
    const eased = 1 - (1 - area.age) ** 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, Math.max(1, (area.radius + 0.5) * step * eased), 0, Math.PI * 2);
    ctx.globalAlpha = 0.9 * (1 - area.age);
    ctx.lineWidth = 3;
    ctx.strokeStyle = areaColor(theme, area);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawBars(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: BoardTheme, unit: SceneUnit, center: Point): void {
  const width = layout.size * 1.3;
  const x = center.x - width / 2;
  const y = center.y - layout.size * 0.95;
  ctx.fillStyle = theme.hpBack;
  ctx.fillRect(x, y, width, 5);
  // Barre de vie de la couleur du camp : bleu pour le joueur, rouge pour l'ennemi.
  ctx.fillStyle = unit.side === 'player' ? theme.player : theme.enemy;
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, unit.hpRatio)), 5);
  const shield = Math.min(1, unit.shieldRatio ?? 0);
  if (shield > 0) {
    ctx.fillStyle = theme.shield;
    ctx.fillRect(x, y - 4, width * shield, 3);
  }
}

/** Étoiles du rang dans une pastille, au bas du jeton. */
function drawRank(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: BoardTheme, unit: SceneUnit, center: Point, radius: number): void {
  const stars = '★'.repeat(unit.rank);
  const size = Math.round(layout.size * 0.3);
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  const width = ctx.measureText(stars).width + 6;
  const height = size + 3;
  ctx.beginPath();
  ctx.roundRect(center.x - width / 2, center.y + radius - height / 2 + 1, width, height, height / 2);
  ctx.fillStyle = theme.rankBadge;
  ctx.fill();
  ctx.fillStyle = theme.ranks[unit.rank];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stars, center.x, center.y + radius + 1.5);
}

/** Pastilles d'état (brûlure, ralentissement, accélération), en colonne sur le côté gauche du jeton. */
function drawStatusDots(ctx: CanvasRenderingContext2D, theme: BoardTheme, unit: SceneUnit, center: Point, radius: number): void {
  const dots: string[] = [];
  if (unit.burning === true) dots.push(theme.elements.fire);
  if (unit.chilled === true) dots.push(theme.elements.ice);
  if (unit.hasted === true) dots.push(theme.elements.thunder);
  dots.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(center.x - radius - 1, center.y - 8 + i * 8, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function drawTexts(
  ctx: CanvasRenderingContext2D,
  layout: BoardLayout,
  theme: BoardTheme,
  scene: BoardScene,
  centers: ReadonlyMap<string | number, Point>,
): void {
  // Plusieurs textes sur la même unité sont décalés pour ne pas se superposer.
  const stacked = new Map<string | number, number>();
  for (const text of scene.texts ?? []) {
    const center = centers.get(text.uid);
    if (center === undefined) continue;
    const index = text.kind === 'skill' ? 0 : (stacked.get(text.uid) ?? 0);
    if (text.kind !== 'skill') stacked.set(text.uid, index + 1);
    ctx.globalAlpha = Math.max(0, 1 - text.age);
    ctx.fillStyle = text.kind === 'crit' ? theme.crit : text.kind === 'heal' ? theme.heal : theme.text;
    const size = text.kind === 'skill' || text.kind === 'dodge' ? 0.36 : text.kind === 'crit' ? 0.5 : 0.4;
    ctx.font = `700 ${Math.round(layout.size * size)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const offset = text.kind === 'skill' ? layout.size * 1.35 : layout.size * (0.2 + text.age * 0.8) + (index % 3) * 11;
    const shift = text.kind === 'skill' ? 0 : ((index % 2) * 2 - 1) * Math.min(index, 1) * 12;
    ctx.fillText(text.text, center.x + shift, center.y - offset);
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: BoardTheme, banner: string): void {
  ctx.font = `700 ${Math.round(layout.size * 0.55)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = theme.cellStroke;
  ctx.strokeText(banner, layout.width / 2, layout.height / 2);
  ctx.fillStyle = theme.highlight;
  ctx.fillText(banner, layout.width / 2, layout.height / 2);
}

export function drawBoard(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: BoardTheme, scene: BoardScene): void {
  ctx.clearRect(0, 0, layout.width, layout.height);
  drawCells(ctx, layout, theme, scene.highlight ?? null);
  const areas = scene.areas ?? [];
  drawAreaCells(ctx, layout, theme, areas);

  // Les unités K.O. d'abord, pour que les vivantes passent par-dessus.
  const ordered = [...scene.units].sort((a, b) => Number(a.alive) - Number(b.alive));
  for (const unit of ordered) drawUnit(ctx, layout, theme, unit);
  drawAreaWaves(ctx, layout, theme, areas);

  const centers = new Map(scene.units.map((unit) => [unit.key, unitCenter(layout, unit)]));
  drawTexts(ctx, layout, theme, scene, centers);
  if (scene.banner) drawBanner(ctx, layout, theme, scene.banner);
}
