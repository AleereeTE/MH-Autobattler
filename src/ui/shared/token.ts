import type { StarRank } from '../../data/definitions.ts';
import { findUnit } from '../../data/units/index.ts';
import { rankStars } from '../../rules/ranks.ts';
import { el } from '../dom.ts';
import type { PortraitStore } from './portraits.ts';
import { shortLabel } from './unit-label.ts';

/**
 * Petit jeton HTML (réserve, boutique, récompenses, planificateur) : mêmes codes que sur le plateau —
 * fond selon le coût, anneau selon l'élément, étoiles selon le rang.
 */
export function unitToken(unitId: string, rank: StarRank | null, portraits: PortraitStore): HTMLElement {
  const unit = findUnit(unitId);
  const url = portraits.url(unitId);
  return el(
    'span',
    {
      className: `token cost-${unit?.cost ?? 1}`,
      attrs: { style: `--ring: var(--element-${unit?.element ?? 'none'})` },
    },
    [
      url !== null ? el('img', { attrs: { src: url, alt: '' } }) : el('span', { className: 'token-label', text: shortLabel(unit?.name ?? '?') }),
      rank !== null ? el('span', { className: `token-stars rank-${rank}`, text: rankStars(rank) }) : null,
    ],
  );
}
