import { RUN_STRUCTURE } from '../../data/run-balance.ts';
import { TOTAL_HUNTS, boardUnits, huntInfo, interest } from '../../run/index.ts';
import { button, el } from '../dom.ts';
import type { RunController } from './controller.ts';

/** Pastilles de défaites : ● perdue, ○ restante. */
function defeatDots(defeats: number): string {
  return Array.from({ length: RUN_STRUCTURE.maxDefeats }, (_, i) => (i < defeats ? '●' : '○')).join(' ');
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

  const stats = el('div', { className: 'hud-stats' }, [
    el('div', { className: 'hud-hunt' }, [
      el('strong', { text: `Stage ${info.stage} · Chasse ${hunt} / ${TOTAL_HUNTS}` }),
      info.isBoss ? el('span', { className: 'badge boss', text: 'Boss' }) : null,
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

  const fightButton = button(info.isBoss ? 'Affronter le boss' : 'Lancer la chasse', () => controller.launchFight(), 'button primary');
  fightButton.disabled = !controller.canPrepare || onBoard === 0;
  if (onBoard === 0 && controller.canPrepare) fightButton.title = 'Pose au moins une unité sur le plateau.';

  return el('section', { className: 'panel hud' }, [
    stats,
    el('div', { className: 'hud-actions' }, [replayControls ?? fightButton, restart]),
  ]);
}
