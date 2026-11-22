import { RUN_STRUCTURE } from '../../data/run-balance.ts';
import { TOTAL_HUNTS, boardUnits, currentNode, huntInfo, interest, isCombatNode, type MapNodeKind } from '../../run/index.ts';
import { button, el } from '../dom.ts';
import type { RunController } from './controller.ts';
import { NODE_INFO } from './map-view.ts';

/** Pastilles de défaites : ● perdue, ○ restante. */
function defeatDots(defeats: number): string {
  return Array.from({ length: RUN_STRUCTURE.maxDefeats }, (_, i) => (i < defeats ? '●' : '○')).join(' ');
}

/** Action principale : choisir sur la carte, lancer le combat de la case, ou reprendre la route. */
function mainAction(controller: RunController, kind: MapNodeKind | null, onBoard: number): HTMLElement {
  if (controller.state.phase === 'map') {
    const waiting = button('Choisis une case sur la carte', () => undefined, 'button primary');
    waiting.disabled = true;
    return waiting;
  }
  const node = currentNode(controller.state);
  if (node !== null && !isCombatNode(node.kind)) {
    const leave = button('Reprendre la route', () => controller.leaveNode(), 'button primary');
    leave.disabled = !controller.canPrepare;
    return leave;
  }
  const label = kind === 'boss' ? 'Affronter le boss' : kind === 'urgent' ? 'Lancer la quête urgente' : 'Lancer la chasse';
  const fightButton = button(label, () => controller.launchFight(), 'button primary');
  fightButton.disabled = !controller.canPrepare || onBoard === 0;
  if (onBoard === 0 && controller.canPrepare) fightButton.title = 'Pose au moins une unité sur le plateau.';
  return fightButton;
}

/**
 * Bandeau de la run : chasse en cours, défaites, zennys, niveau, et le bouton de combat
 * (remplacé par les commandes du replay pendant qu'on regarde un combat).
 */
export function renderHud(
  controller: RunController,
  replayControls: HTMLElement | null,
  restart: HTMLElement,
  replayFinished: boolean,
): HTMLElement {
  const { state, watching } = controller;
  const hunt = watching?.hunt ?? Math.min(state.hunt, TOTAL_HUNTS);
  const info = huntInfo(hunt);
  const onBoard = boardUnits(state).length;
  // Pendant le replay, on montre les valeurs d'avant le combat pour ne pas dévoiler l'issue.
  const shown = watching !== null && !replayFinished ? watching.before : state;
  const gain = interest(shown.zennys);

  // Type de la case en cours (pendant le choix sur la carte, aucune case n'est encore choisie).
  const kind = watching?.kind ?? (state.phase === 'map' ? null : (currentNode(state)?.kind ?? null));
  const stats = el('div', { className: 'hud-stats' }, [
    el('div', { className: 'hud-hunt' }, [
      el('strong', { text: `Stage ${info.stage} · Étape ${hunt} / ${TOTAL_HUNTS}` }),
      kind !== null && kind !== 'hunt' ? el('span', { className: `badge kind-${kind}`, text: NODE_INFO[kind].name }) : null,
    ]),
    el('div', { attrs: { title: 'Défaites (3 = fin de la run)' } }, [el('span', { className: 'muted', text: 'Défaites ' }), el('span', { className: 'defeats', text: defeatDots(shown.defeats) })]),
    el('div', {}, [
      el('strong', { text: `${shown.zennys} zennys` }),
      el('span', { className: 'muted small', text: gain > 0 ? ` (+${gain} d’intérêts au prochain tour)` : '' }),
    ]),
    el('div', {}, [el('span', { className: 'muted', text: 'Plateau ' }), el('strong', { text: `${onBoard} / ${state.level}` })]),
    el('div', { attrs: { title: 'Un retire-objet permet de retirer un objet d’une unité' } }, [
      el('span', { className: 'muted', text: 'Retire-objets ' }),
      el('strong', { text: String(shown.itemRemovers) }),
    ]),
  ]);

  return el('section', { className: 'panel hud' }, [
    stats,
    el('div', { className: 'hud-actions' }, [replayControls ?? mainAction(controller, kind, onBoard), restart]),
  ]);
}
