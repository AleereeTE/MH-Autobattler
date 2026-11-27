import { FORGE, MERCHANT } from '../../data/run-balance.ts';
import { accessibleNodes, currentNode, reachableNodes, targetMonster, type MapNode, type MapNodeKind, type RunState } from '../../run/index.ts';
import { rankStars } from '../../rules/ranks.ts';
import { el } from '../dom.ts';
import { onRightClick, showPopover } from '../shared/popover.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import { unitToken } from '../shared/token.ts';
import { placementCard } from '../shared/unit-card.ts';
import type { RunController } from './controller.ts';

/**
 * Carte du stage (game-design §2.1) : les 10 étapes de gauche à droite, les cases reliées par leurs chemins.
 * Pendant le choix, les cases accessibles sont mises en avant et listées sous la carte.
 */

export const NODE_INFO: Readonly<Record<MapNodeKind, { readonly symbol: string; readonly name: string }>> = {
  hunt: { symbol: '⚔️', name: 'Chasse' },
  urgent: { symbol: '❗', name: 'Quête urgente' },
  forge: { symbol: '🔨', name: 'Forge' },
  merchant: { symbol: '💰', name: 'Marchand' },
  boss: { symbol: '👹', name: 'Boss' },
};

/** Ce que rapporte (ou propose) une case. */
export function nodeReward(kind: MapNodeKind): string {
  switch (kind) {
    case 'hunt':
      return 'Récompense : 1 parmi 3';
    case 'urgent':
      return 'Récompenses doublées (escouade plus forte)';
    case 'boss':
      return 'Récompenses doublées + 1 retire-objet';
    case 'forge':
      return `Objets déplaçables sans retire-objet, ${FORGE.reforges} matériaux à reforger`;
    case 'merchant':
      return `${MERCHANT.materialsOffered} matériaux à ${MERCHANT.materialPrice} zennys, un retire-objet à ${MERCHANT.itemRemoverPrice}`;
  }
}

/** Monstre cible d'une case de combat : « Rathalos ★2 », ou null. */
export function nodeTarget(node: MapNode): string | null {
  const target = targetMonster(node.squad);
  return target === null ? null : `${target.unit.name} ${rankStars(target.rank ?? 1)}`;
}

/** Résumé d'une case, pour l'infobulle : « Chasse · cible : Rathalos ★2 · Récompense : 1 parmi 3 ». */
export function nodeSummary(node: MapNode): string {
  const target = nodeTarget(node);
  return [NODE_INFO[node.kind].name, target === null ? null : `cible : ${target}`, nodeReward(node.kind)].filter((part) => part !== null).join(' · ');
}

// --- Dessin (SVG) ---------------------------------------------------------------------------------

const SVG_NS = 'http://www.w3.org/2000/svg';
const COLUMN = 56;
const ROW = 44;
const HEIGHT = 3 * ROW + 16;
const RADIUS = 16;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Readonly<Record<string, string | number>>, children: readonly (Node | string)[] = []): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  node.append(...children);
  return node;
}

/** Centre d'une case : les étapes de gauche à droite, les cases d'une étape centrées verticalement. */
function nodeCenter(node: MapNode, stepSize: number): { x: number; y: number } {
  return { x: (node.step - 0.5) * COLUMN, y: HEIGHT / 2 + (node.index - (stepSize - 1) / 2) * ROW };
}

/** Une case est-elle sur le chemin déjà parcouru ? */
function isVisited(state: RunState, node: MapNode): boolean {
  return node.step <= state.path.length && state.path[node.step - 1] === node.index;
}

function mapDrawing(controller: RunController): SVGSVGElement {
  const { state } = controller;
  const steps = state.map.steps;
  const current = currentNode(state);
  const choosing = controller.canChooseNode;
  const reachable = new Set(choosing ? reachableNodes(state) : []);
  const accessible = accessibleNodes(state);
  const center = (node: MapNode) => nodeCenter(node, steps[node.step - 1]?.length ?? 1);

  const edges = steps.flatMap((row) =>
    row.flatMap((node) =>
      node.next.flatMap((index) => {
        const target = steps[node.step]?.[index];
        if (target === undefined) return [];
        const from = center(node);
        const to = center(target);
        const walked = isVisited(state, node) && isVisited(state, target);
        const open = node === current && reachable.has(target);
        // Chemin encore praticable : il part de la case actuelle (ou d'une case accessible) vers une case accessible.
        const live = (node === current || accessible.has(node)) && accessible.has(target);
        const faded = !walked && !live;
        return [svg('line', { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: `map-edge${walked ? ' walked' : ''}${open ? ' open' : ''}${faded ? ' faded' : ''}` })];
      }),
    ),
  );

  const nodes = steps.flatMap((row) =>
    row.map((node) => {
      const { x, y } = center(node);
      const visited = isVisited(state, node);
      const isCurrent = node === current;
      const isReachable = reachable.has(node);
      const faded = !visited && !isCurrent && !accessible.has(node);
      const classes = ['map-node', `kind-${node.kind}`, visited ? 'visited' : '', isCurrent ? 'current' : '', isReachable ? 'reachable' : '', faded ? 'faded' : ''];
      const group = svg('g', { class: classes.filter((name) => name !== '').join(' '), transform: `translate(${x} ${y})` }, [
        svg('title', {}, [nodeSummary(node)]),
        svg('circle', { r: RADIUS }),
        svg('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 15 }, [NODE_INFO[node.kind].symbol]),
      ]);
      if (isReachable) {
        group.setAttribute('role', 'button');
        group.addEventListener('click', () => controller.chooseNode(node.index));
      }
      // Clic droit sur une case de combat : fiche du monstre cible.
      const target = targetMonster(node.squad);
      if (target !== null) {
        group.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          showPopover(placementCard(target), event.clientX, event.clientY);
        });
      }
      return group;
    }),
  );

  return svg('svg', { class: 'map-drawing', viewBox: `0 0 ${steps.length * COLUMN} ${HEIGHT}`, role: 'img', 'aria-label': `Carte du stage ${state.map.stage}` }, [
    ...edges,
    ...nodes,
  ]);
}

/** Une case proposée pour l'étape suivante : type, monstre cible et récompense ; cliquer la choisit. */
function choiceCard(controller: RunController, node: MapNode, portraits: PortraitStore): HTMLElement {
  const target = targetMonster(node.squad);
  const card = el(
    'button',
    { className: `map-choice kind-${node.kind}`, attrs: { type: 'button' }, onClick: () => controller.chooseNode(node.index) },
    [
      el('span', { className: 'map-choice-head' }, [
        el('span', { className: 'map-choice-symbol', text: NODE_INFO[node.kind].symbol, attrs: { 'aria-hidden': 'true' } }),
        el('strong', { text: NODE_INFO[node.kind].name }),
      ]),
      target === null
        ? null
        : el('span', { className: 'map-choice-target' }, [unitToken(target.unit.id, target.rank ?? 1, portraits), el('span', { text: `Cible : ${nodeTarget(node) ?? ''}` })]),
      el('span', { className: 'small muted', text: nodeReward(node.kind) }),
    ],
  );
  return target === null ? card : onRightClick(card, () => placementCard(target));
}

export function renderMap(controller: RunController, portraits: PortraitStore): HTMLElement {
  const { state } = controller;
  const choosing = controller.canChooseNode;
  const step = Math.min(state.path.length + (choosing ? 1 : 0), state.map.steps.length);
  return el('section', { className: `panel map-panel${choosing ? ' choosing' : ''}` }, [
    el('div', { className: 'panel-title' }, [
      el('h2', { text: `Carte du stage ${state.map.stage}` }),
      el('span', {
        className: 'muted small',
        text: choosing ? `Choisis ta case pour l’étape ${step} / ${state.map.steps.length}.` : `Étape ${step} / ${state.map.steps.length} · survole une case pour son contenu, clic droit : monstre cible.`,
      }),
    ]),
    el('div', { className: 'map-scroll' }, [mapDrawing(controller)]),
    choosing ? el('div', { className: 'map-choices' }, reachableNodes(state).map((node) => choiceCard(controller, node, portraits))) : null,
  ]);
}
