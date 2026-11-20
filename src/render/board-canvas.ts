import { BOARD_COLS, BOARD_ROWS, ROWS_PER_SIDE, type Hex } from '../core/hex.ts';
import type { Element } from '../data/definitions.ts';
import { hexCenter, hexCorners, lerpHex, type BoardLayout, type Point } from './hex-layout.ts';
import type { FloatingText } from './replay.ts';

/**
 * Rendu Canvas 2D temporaire du plateau : des hexagones et des cercles.
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
  readonly hp: string;
  readonly shield: string;
  readonly text: string;
  readonly crit: string;
  readonly heal: string;
  readonly elements: Readonly<Record<Element | 'none', string>>;
}

export interface SceneUnit {
  readonly key: string | number;
  readonly label: string;
  readonly side: 'player' | 'enemy';
  readonly element: Element | null;
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

  // Corps : couleur du camp, anneau de la couleur de l'élément.
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = unit.side === 'player' ? theme.player : theme.enemy;
  ctx.fill();
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

  ctx.fillStyle = theme.unitText;
  ctx.font = `600 ${Math.round(layout.size * 0.42)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(unit.label, center.x, center.y + 1);

  if (unit.alive) drawBars(ctx, layout, theme, unit, center);
  drawStatusDots(ctx, theme, unit, center, radius);
  ctx.globalAlpha = 1;
}

function drawBars(ctx: CanvasRenderingContext2D, layout: BoardLayout, theme: BoardTheme, unit: SceneUnit, center: Point): void {
  const width = layout.size * 1.3;
  const x = center.x - width / 2;
  const y = center.y - layout.size * 0.95;
  ctx.fillStyle = theme.hpBack;
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = theme.hp;
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, unit.hpRatio)), 5);
  const shield = Math.min(1, unit.shieldRatio ?? 0);
  if (shield > 0) {
    ctx.fillStyle = theme.shield;
    ctx.fillRect(x, y - 4, width * shield, 3);
  }
}

function drawStatusDots(ctx: CanvasRenderingContext2D, theme: BoardTheme, unit: SceneUnit, center: Point, radius: number): void {
  const dots: string[] = [];
  if (unit.burning === true) dots.push(theme.elements.fire);
  if (unit.chilled === true) dots.push(theme.elements.ice);
  if (unit.hasted === true) dots.push(theme.elements.thunder);
  dots.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(center.x - radius + 4 + i * 9, center.y + radius + 2, 3.5, 0, Math.PI * 2);
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
    const size = text.kind === 'skill' ? 0.36 : text.kind === 'crit' ? 0.5 : 0.4;
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

  // Les unités K.O. d'abord, pour que les vivantes passent par-dessus.
  const ordered = [...scene.units].sort((a, b) => Number(a.alive) - Number(b.alive));
  for (const unit of ordered) drawUnit(ctx, layout, theme, unit);

  const centers = new Map(scene.units.map((unit) => [unit.key, unitCenter(layout, unit)]));
  drawTexts(ctx, layout, theme, scene, centers);
  if (scene.banner) drawBanner(ctx, layout, theme, scene.banner);
}
