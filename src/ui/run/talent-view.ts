import { TALENT_FAMILY_NAMES, TALENT_TIER_NAMES, findTalent, type TalentTier } from '../../data/talents.ts';
import { findTrait } from '../../data/traits.ts';
import { findUnit } from '../../data/units/index.ts';
import { canTakeTalent, huntInfo, type OwnedTalent, type TalentOffer } from '../../run/index.ts';
import { button, el } from '../dom.ts';
import { onRightClick } from '../shared/popover.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import { traitPreview } from '../shared/trait-preview.ts';
import { unitCard } from '../shared/unit-card.ts';
import { unitToken } from '../shared/token.ts';
import type { RunController } from './controller.ts';

/** Texte d'un talent, avec le trait et l'unité tirés pour lui. */
export function talentText(talent: Pick<OwnedTalent, 'talentId' | 'traitId' | 'unitId'>): string {
  const definition = findTalent(talent.talentId);
  if (definition === undefined) return '';
  const trait = talent.traitId === null ? '' : (findTrait(talent.traitId)?.name ?? talent.traitId);
  const unit = talent.unitId === null ? '' : (findUnit(talent.unitId)?.name ?? talent.unitId);
  return definition.description.replaceAll('{trait}', trait).replaceAll('{unit}', unit);
}

/** Clic droit : fiche de l'unité donnée, ou paliers du trait tiré. */
function withPreview(element: HTMLElement, talent: Pick<OwnedTalent, 'traitId' | 'unitId'>): HTMLElement {
  const unit = talent.unitId === null ? undefined : findUnit(talent.unitId);
  if (unit !== undefined) return onRightClick(element, () => unitCard(unit, [], 1));
  const traitId = talent.traitId;
  if (traitId !== null) return onRightClick(element, () => traitPreview(traitId));
  return element;
}

function offerCard(controller: RunController, offer: TalentOffer, index: number, portraits: PortraitStore): HTMLElement {
  const talent = findTalent(offer.talentId);
  const available = canTakeTalent(controller.state, offer);
  const card = el(
    'button',
    { className: 'talent-card', attrs: { type: 'button' }, onClick: () => controller.chooseTalent(index) },
    [
      el('span', { className: 'talent-family small', text: talent === undefined ? '' : TALENT_FAMILY_NAMES[talent.family] }),
      el('strong', { text: talent?.name ?? offer.talentId }),
      offer.unitId === null ? null : unitToken(offer.unitId, 1, portraits),
      el('span', { className: 'small', text: talentText(offer) }),
      available ? null : el('span', { className: 'small muted', text: 'Réserve pleine.' }),
    ],
  );
  card.disabled = !available;
  // Stèle ancienne : pas de relance du tout.
  if (controller.state.event !== null) return el('div', { className: 'talent-offer' }, [withPreview(card, offer)]);
  const reroll = button(offer.rerolled ? 'Déjà relancé' : 'Relancer', () => controller.rerollTalent(index), 'button small');
  reroll.disabled = offer.rerolled;
  return el('div', { className: 'talent-offer' }, [withPreview(card, offer), reroll]);
}

/** Choix du talent de chasseur au début d'un stage (phase `talent`), ou null. */
export function renderTalentChoice(controller: RunController, portraits: PortraitStore): HTMLElement | null {
  const { state } = controller;
  const choice = state.talentChoice;
  if (state.phase !== 'talent' || choice === null) return null;
  return el('section', { className: `panel talent-panel tier-${choice.tier}` }, [
    el('h2', { text: `Talent de chasseur · ${TALENT_TIER_NAMES[choice.tier]}` }),
    el('p', {
      className: 'muted small',
      text:
        state.event !== null
          ? 'Stèle ancienne : choisis un talent pour le reste de la run, en plus des autres. Pas de relance. Clic droit : unité ou trait concerné.'
          : `Début du stage ${huntInfo(state.hunt).stage} : choisis un talent pour le reste de la run. Chaque proposition peut être relancée une fois. Clic droit : unité ou trait concerné.`,
    }),
    el(
      'div',
      { className: 'talent-offers' },
      choice.offers.map((offer, index) => offerCard(controller, offer, index, portraits)),
    ),
  ]);
}

const tierClass = (tier: TalentTier | undefined): string => (tier === undefined ? '' : `tier-${tier}`);

/** Talents pris pendant la run (rien tant qu'aucun n'a été choisi). */
export function renderOwnedTalents(controller: RunController): HTMLElement | null {
  const { talents } = controller.state;
  if (talents.length === 0) return null;
  return el('section', { className: 'panel' }, [
    el('h2', { text: 'Talents de chasseur' }),
    el(
      'ul',
      { className: 'talent-list' },
      talents.map((owned) => {
        const talent = findTalent(owned.talentId);
        return withPreview(
          el('li', { className: `talent-item ${tierClass(talent?.tier)}` }, [
            el('strong', { text: talent?.name ?? owned.talentId }),
            el('span', { className: 'small muted', text: talent === undefined ? '' : ` · ${TALENT_TIER_NAMES[talent.tier]}` }),
            el('div', { className: 'small', text: talentText(owned) }),
          ]),
          owned,
        );
      }),
    ),
  ]);
}
