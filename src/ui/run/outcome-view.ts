import { RUN_STRUCTURE } from '../../data/run-balance.ts';
import { findUnit } from '../../data/units/index.ts';
import { MATERIALS } from '../../data/items.ts';
import { TOTAL_HUNTS, canTakeReward, type RewardOption } from '../../run/index.ts';
import { button, el } from '../dom.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import type { RunController } from './controller.ts';
import { unitToken } from './token.ts';

function rewardCard(controller: RunController, option: RewardOption, index: number, portraits: PortraitStore): HTMLElement {
  const available = canTakeReward(controller.state, option);
  let content: (HTMLElement | string)[];
  switch (option.kind) {
    case 'materials':
      content = [
        el('strong', { text: option.materials.length > 1 ? `${option.materials.length} matériaux` : 'Matériau' }),
        el('span', { text: option.materials.map((material) => MATERIALS[material].name).join(' + ') }),
        el('span', { className: 'small muted', text: option.materials.map((material) => MATERIALS[material].description).join(' · ') }),
      ];
      break;
    case 'zennys':
      content = [el('strong', { text: `+${option.amount} zennys` }), el('span', { className: 'small muted', text: 'Tout de suite, avant les revenus du tour.' })];
      break;
    case 'unit': {
      const name = findUnit(option.unitId)?.name ?? option.unitId;
      content = [
        unitToken(option.unitId, 1, portraits),
        el('strong', { text: option.copies > 1 ? `${option.copies} × ${name}` : name }),
        el('span', { className: 'small muted', text: available ? 'Rejoint la réserve au ★1.' : 'Réserve pleine.' }),
      ];
      break;
    }
  }
  const card = el('button', { className: 'reward-card', attrs: { type: 'button' }, onClick: () => controller.chooseReward(index) }, content);
  card.disabled = !available;
  return card;
}

/**
 * Panneau de fin de combat : récompense à choisir, défaite (on continue), ou fin de la run.
 * Il n'apparaît qu'une fois le replay terminé, pour ne pas dévoiler l'issue.
 */
export function renderOutcome(
  controller: RunController,
  replayFinished: boolean,
  portraits: PortraitStore,
  onNewRun: () => void,
): HTMLElement | null {
  const { state, watching } = controller;
  if (watching !== null && !replayFinished) {
    return el('section', { className: 'panel outcome-panel' }, [
      el('h2', { text: watching.boss ? `Boss — chasse ${watching.hunt}` : `Chasse ${watching.hunt}` }),
      el('p', { className: 'muted', text: 'Combat en cours… Le résultat s’affichera à la fin (ou clique sur « Passer »).' }),
    ]);
  }

  if (state.phase === 'over') {
    const won = state.outcome === 'victory';
    return el('section', { className: `panel outcome-panel ${won ? 'won' : 'lost'}` }, [
      el('h2', { text: won ? 'Run gagnée !' : 'Run perdue' }),
      el('p', {
        text: won
          ? `Les ${TOTAL_HUNTS} chasses sont terminées, avec ${state.defeats} défaite${state.defeats > 1 ? 's' : ''}.`
          : `${RUN_STRUCTURE.maxDefeats} défaites : la run s’arrête à la chasse ${state.hunt} / ${TOTAL_HUNTS}.`,
      }),
      button('Nouvelle run', onNewRun, 'button primary'),
    ]);
  }

  if (watching === null) return null;

  if (state.phase === 'reward' && state.rewards !== null) {
    return el('section', { className: 'panel outcome-panel won' }, [
      el('h2', { text: watching.boss ? 'Boss vaincu !' : 'Victoire !' }),
      watching.boss ? el('p', { className: 'small', text: '+1 retire-objet, et des récompenses doublées.' }) : null,
      el('p', { className: 'muted small', text: 'Choisis une récompense :' }),
      el(
        'div',
        { className: 'reward-cards' },
        state.rewards.map((option, index) => rewardCard(controller, option, index, portraits)),
      ),
    ]);
  }

  return el('section', { className: 'panel outcome-panel lost' }, [
    el('h2', { text: `Défaite (${state.defeats} / ${RUN_STRUCTURE.maxDefeats})` }),
    el('p', {
      text: watching.boss ? 'Pas de récompense. Tu réaffronteras le boss au prochain tour.' : 'Pas de récompense. Tu passes à la chasse suivante.',
    }),
    button('Continuer', () => controller.stopWatching(), 'button primary'),
  ]);
}
