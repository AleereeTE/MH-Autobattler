import { RUN_STRUCTURE } from '../../data/run-balance.ts';
import { findUnit } from '../../data/units/index.ts';
import { MATERIALS } from '../../data/items.ts';
import { TOTAL_HUNTS, canContinueInfinite, canTakeReward, infiniteGrowth, type RewardOption } from '../../run/index.ts';
import { INFINITE_MODE } from '../../data/run-balance.ts';
import { button, el } from '../dom.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import type { RunController } from './controller.ts';
import { onRightClick } from '../shared/popover.ts';
import { materialPreview } from '../shared/previews.ts';
import { unitCard } from '../shared/unit-card.ts';
import { unitToken } from '../shared/token.ts';

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
  // Clic droit : fiche de l'unité proposée, ou recettes du matériau proposé.
  const unit = option.kind === 'unit' ? findUnit(option.unitId) : undefined;
  if (unit !== undefined) return onRightClick(card, () => unitCard(unit, [], 1));
  const material = option.kind === 'materials' ? option.materials[0] : undefined;
  if (material !== undefined) return onRightClick(card, () => materialPreview(material));
  return card;
}

const percent = (ratio: number): string => `${Math.round(ratio * 100)} %`;

/** Fin de la run (gagnée ou perdue) ou du mode infini, avec le record du mode infini. */
function endPanel(controller: RunController, onNewRun: () => void): HTMLElement {
  const { state, infiniteRecord, newRecord } = controller;
  const record = infiniteRecord > 0 ? el('p', { className: 'small', text: `Record du mode infini : étape ${infiniteRecord}.` }) : null;

  if (state.infinite) {
    return el('section', { className: 'panel outcome-panel lost' }, [
      el('h2', { text: 'Mode infini terminé' }),
      el('p', { text: `${RUN_STRUCTURE.maxDefeats} défaites : tu t’arrêtes à l’étape ${state.hunt} (ennemis +${percent(infiniteGrowth(state.hunt))}).` }),
      newRecord ? el('p', { className: 'new-record', text: 'Nouveau record !' }) : record,
      button('Nouvelle run', onNewRun, 'button primary'),
    ]);
  }

  if (state.outcome === 'victory') {
    const defeats = `${state.defeats} défaite${state.defeats > 1 ? 's' : ''}`;
    return el('section', { className: 'panel outcome-panel won' }, [
      el('h2', { text: 'Run gagnée !' }),
      el('p', { text: `Les ${TOTAL_HUNTS} étapes sont terminées, avec ${defeats}.` }),
      el('p', {
        className: 'small muted',
        text: `Mode infini : les stages continuent, et les ennemis gagnent +${percent(INFINITE_MODE.statGrowthPerHunt)} de PV, d’attaque brute et de puissance élémentaire à chaque étape. Tes défaites restent comptées (${state.defeats} / ${RUN_STRUCTURE.maxDefeats}).`,
      }),
      record,
      el('div', { className: 'outcome-actions' }, [
        canContinueInfinite(state) ? button('Continuer en mode infini', () => controller.continueInfinite(), 'button primary') : null,
        button('Nouvelle run', onNewRun, 'button'),
      ]),
    ]);
  }

  return el('section', { className: 'panel outcome-panel lost' }, [
    el('h2', { text: 'Run perdue' }),
    el('p', { text: `${RUN_STRUCTURE.maxDefeats} défaites : la run s’arrête à l’étape ${state.hunt} / ${TOTAL_HUNTS}.` }),
    button('Nouvelle run', onNewRun, 'button primary'),
  ]);
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
      el('h2', { text: `${watching.boss ? 'Boss' : watching.kind === 'urgent' ? 'Quête urgente' : 'Chasse'} — étape ${watching.hunt}` }),
      el('p', { className: 'muted', text: 'Combat en cours… Le résultat s’affichera à la fin (ou clique sur « Passer »).' }),
    ]);
  }

  if (state.phase === 'over') return endPanel(controller, onNewRun);

  if (watching === null) return null;

  if (state.phase === 'reward' && state.rewards !== null) {
    return el('section', { className: 'panel outcome-panel won' }, [
      el('h2', { text: watching.boss ? 'Boss vaincu !' : watching.kind === 'urgent' ? 'Quête urgente réussie !' : 'Victoire !' }),
      watching.boss
        ? el('p', { className: 'small', text: '+1 retire-objet, et des récompenses doublées.' })
        : watching.kind === 'urgent'
          ? el('p', { className: 'small', text: 'Récompenses doublées.' })
          : null,
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
      text: watching.boss ? 'Pas de récompense. Tu réaffronteras le boss au prochain tour.' : 'Pas de récompense. Retour à la carte pour l’étape suivante.',
    }),
    button('Continuer', () => controller.stopWatching(), 'button primary'),
  ]);
}
