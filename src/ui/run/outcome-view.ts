import { RUN_STRUCTURE } from '../../data/run-balance.ts';
import { findUnit } from '../../data/units/index.ts';
import { MATERIALS } from '../../data/items.ts';
import { objectFor } from '../../rules/equipment.ts';
import { TOTAL_HUNTS, canContinueInfinite, canTakeReward, infiniteGrowth, type RewardOption } from '../../run/index.ts';
import { INFINITE_MODE } from '../../data/run-balance.ts';
import { button, el } from '../dom.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import type { RunController } from './controller.ts';
import { onRightClick } from '../shared/popover.ts';
import { materialPreview, objectPreview } from '../shared/previews.ts';
import { unitCard } from '../shared/unit-card.ts';
import { unitToken } from '../shared/token.ts';

type CaptureOption = Extract<RewardOption, { kind: 'capture' }>;

/** Carte « Capture » : un bouton par monstre capturable de l'escouade vaincue (clic droit : sa fiche). */
function captureCard(controller: RunController, option: CaptureOption, index: number, portraits: PortraitStore): HTMLElement {
  const choices = option.targets.map((target) => {
    const unit = findUnit(target.unitId);
    const name = unit?.name ?? target.unitId;
    const choice = el('button', { className: 'capture-choice', attrs: { type: 'button' }, onClick: () => controller.chooseReward(index, target.unitId) }, [
      unitToken(target.unitId, 1, portraits),
      el('span', { className: 'small', text: target.copies > 1 ? `${target.copies} × ${name}` : name }),
    ]);
    choice.disabled = !canTakeReward(controller.state, option, target.unitId);
    return unit === undefined ? choice : onRightClick(choice, () => unitCard(unit, [], 1));
  });
  const available = canTakeReward(controller.state, option);
  return el('div', { className: 'reward-card capture-card' }, [
    el('strong', { text: 'Capture' }),
    el('span', { className: 'small muted', text: available ? 'Un monstre de l’escouade rejoint la réserve au ★1 :' : 'Réserve pleine.' }),
    el('div', { className: 'capture-choices' }, choices),
  ]);
}

/** Contenu d'une carte de récompense (hors capture). */
function rewardContent(option: Exclude<RewardOption, CaptureOption>, available: boolean, portraits: PortraitStore): (HTMLElement | string)[] {
  switch (option.kind) {
    case 'unit': {
      const name = findUnit(option.unitId)?.name ?? option.unitId;
      return [
        unitToken(option.unitId, 1, portraits),
        el('strong', { text: option.copies > 1 ? `${option.copies} × ${name}` : name }),
        el('span', { className: 'small muted', text: available ? 'Rejoint la réserve au ★1.' : 'Réserve pleine.' }),
      ];
    }
    case 'object': {
      const objects = option.objects.map((materials) => objectFor(materials));
      return [
        el('strong', { text: objects.length > 1 ? `${objects.length} objets` : 'Objet' }),
        el('span', { text: objects.map((object) => object.name).join(' + ') }),
        el('span', { className: 'small muted', text: objects.map((object) => object.description).join(' · ') }),
      ];
    }
    case 'materials':
      return [
        el('strong', { text: option.materials.length > 1 ? `${option.materials.length} matériaux` : 'Matériau' }),
        el('span', { text: option.materials.map((material) => MATERIALS[material].name).join(' + ') }),
        el('span', { className: 'small muted', text: option.materials.map((material) => MATERIALS[material].description).join(' · ') }),
      ];
    case 'itemRemovers':
      return [
        el('strong', { text: option.amount > 1 ? `${option.amount} retire-objets` : 'Retire-objet' }),
        el('span', { className: 'small muted', text: 'Permet de retirer un objet d’une unité.' }),
      ];
    case 'zennys':
      return [el('strong', { text: `+${option.amount} zennys` }), el('span', { className: 'small muted', text: 'Tout de suite, avant les revenus du tour.' })];
  }
}

/** Fiche affichée au clic droit : unité proposée, objet ou recettes du matériau. */
function rewardPreview(option: RewardOption): (() => HTMLElement) | null {
  const unit = option.kind === 'unit' ? findUnit(option.unitId) : undefined;
  if (unit !== undefined) return () => unitCard(unit, [], 1);
  const object = option.kind === 'object' ? option.objects[0] : undefined;
  if (object !== undefined) return () => objectPreview(object);
  const material = option.kind === 'materials' ? option.materials[0] : undefined;
  if (material !== undefined) return () => materialPreview(material);
  return null;
}

function rewardCard(controller: RunController, option: RewardOption, index: number, portraits: PortraitStore): HTMLElement {
  if (option.kind === 'capture') return captureCard(controller, option, index, portraits);
  const available = canTakeReward(controller.state, option);
  const card = el('button', { className: 'reward-card', attrs: { type: 'button' }, onClick: () => controller.chooseReward(index) }, rewardContent(option, available, portraits));
  card.disabled = !available;
  const preview = rewardPreview(option);
  return preview === null ? card : onRightClick(card, preview);
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

  // Récompense à choisir : aussi après une reprise de sauvegarde, quand plus aucun combat n'est regardé.
  if (state.phase === 'reward' && state.rewards !== null) {
    const boss = watching?.boss ?? state.lastCombat?.boss ?? false;
    const urgent = watching?.kind === 'urgent';
    return el('section', { className: 'panel outcome-panel won' }, [
      el('h2', { text: boss ? 'Boss vaincu !' : urgent ? 'Quête urgente réussie !' : 'Victoire !' }),
      boss
        ? el('p', { className: 'small', text: '+1 retire-objet, et des récompenses doublées.' })
        : urgent
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

  if (watching === null) return null;

  return el('section', { className: 'panel outcome-panel lost' }, [
    el('h2', { text: `Défaite (${state.defeats} / ${RUN_STRUCTURE.maxDefeats})` }),
    el('p', {
      text: watching.boss ? 'Pas de récompense. Tu réaffronteras le boss au prochain tour.' : 'Pas de récompense. Retour à la carte pour l’étape suivante.',
    }),
    button('Continuer', () => controller.stopWatching(), 'button primary'),
  ]);
}
