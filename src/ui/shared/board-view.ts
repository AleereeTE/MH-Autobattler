import type { Hex } from '../../core/hex.ts';
import { drawBoard, type BoardScene, type BoardTheme } from '../../render/board-canvas.ts';
import { createLayout, hexAtPoint } from '../../render/hex-layout.ts';

/** Le plateau affiché dans un canvas : dessine des scènes et signale les clics sur les cases. */
export class BoardView {
  readonly element: HTMLCanvasElement;
  private readonly layout = createLayout(34);
  private theme: BoardTheme | null = null;

  /**
   * @param onCellClick clic gauche sur une case
   * @param onCellContextMenu clic droit sur une case (avec la position de la souris, pour placer un aperçu)
   */
  constructor(onCellClick: (hex: Hex) => void, onCellContextMenu?: (hex: Hex, clientX: number, clientY: number) => void) {
    this.element = document.createElement('canvas');
    this.element.className = 'board';
    this.element.setAttribute('role', 'img');
    this.element.setAttribute('aria-label', 'Plateau de combat : 7 colonnes, 4 rangées par camp');
    this.element.style.aspectRatio = `${this.layout.width} / ${this.layout.height}`;

    this.element.addEventListener('click', (event) => {
      const hex = this.hexAt(event);
      if (hex !== null) onCellClick(hex);
    });
    this.element.addEventListener('contextmenu', (event) => {
      if (onCellContextMenu === undefined) return;
      event.preventDefault();
      const hex = this.hexAt(event);
      if (hex !== null) onCellContextMenu(hex, event.clientX, event.clientY);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.theme = null;
    });
  }

  /** Case sous la souris, ou null hors du plateau. */
  private hexAt(event: MouseEvent): Hex | null {
    const rect = this.element.getBoundingClientRect();
    return hexAtPoint(this.layout, {
      x: ((event.clientX - rect.left) * this.layout.width) / rect.width,
      y: ((event.clientY - rect.top) * this.layout.height) / rect.height,
    });
  }

  render(scene: BoardScene): void {
    // Résolution réelle : densité de l'écran × agrandissement du canvas par la mise en page, pour rester net.
    const displayScale = this.element.clientWidth > 0 ? this.element.clientWidth / this.layout.width : 1;
    const ratio = (window.devicePixelRatio || 1) * Math.max(1, displayScale);
    const width = Math.round(this.layout.width * ratio);
    const height = Math.round(this.layout.height * ratio);
    if (this.element.width !== width || this.element.height !== height) {
      this.element.width = width;
      this.element.height = height;
    }
    const context = this.element.getContext('2d');
    if (context === null) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.theme ??= readTheme(this.element);
    drawBoard(context, this.layout, this.theme, scene);
  }
}

/** Les couleurs viennent des variables CSS, pour suivre le thème clair ou sombre. */
function readTheme(element: Element): BoardTheme {
  const style = getComputedStyle(element);
  const color = (name: string): string => style.getPropertyValue(name).trim() || '#888';
  return {
    cellPlayer: color('--board-cell-player'),
    cellEnemy: color('--board-cell-enemy'),
    cellStroke: color('--board-stroke'),
    highlight: color('--accent'),
    player: color('--side-player'),
    enemy: color('--side-enemy'),
    unitText: '#ffffff',
    hpBack: color('--board-hp-back'),
    shield: color('--board-shield'),
    energy: color('--board-energy'),
    energyBlocked: color('--board-energy-blocked'),
    text: color('--fg'),
    crit: color('--accent'),
    heal: color('--board-hp'),
    statuses: { poison: color('--status-poison'), paralysis: color('--status-paralysis') },
    boss: color('--boss-ring'),
    enraged: color('--boss-enraged'),
    elements: {
      fire: color('--element-fire'),
      water: color('--element-water'),
      thunder: color('--element-thunder'),
      ice: color('--element-ice'),
      dragon: color('--element-dragon'),
      none: color('--element-none'),
    },
    costs: {
      1: color('--cost-1'),
      2: color('--cost-2'),
      3: color('--cost-3'),
      4: color('--cost-4'),
      5: color('--cost-5'),
      6: color('--cost-6'),
    },
    prismatic: color('--prismatic')
      .split(',')
      .map((stop) => stop.trim())
      .filter((stop) => stop.length > 0),
    ranks: {
      1: color('--rank-1'),
      2: color('--rank-2'),
      3: color('--rank-3'),
    },
    rankBadge: color('--rank-badge'),
    areas: {
      heal: color('--area-heal'),
      shield: color('--area-shield'),
      buff: color('--area-buff'),
    },
  };
}
