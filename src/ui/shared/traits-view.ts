import type { UnitDefinition } from '../../data/definitions.ts';
import { traitStatuses, type TraitCountBonus, type TraitStatus } from '../../rules/traits.ts';
import { el } from '../dom.ts';
import { onRightClick } from './popover.ts';
import { traitPreview } from './trait-preview.ts';
import { traitBadgeStyle } from './trait-styles.ts';
import { MEDAL_NAMES, traitMedal } from './trait-medals.ts';

/** Paliers d'un trait (« 2 / 4 / 6 ») : ceux atteints ressortent, le palier actif est sur fond de sa couleur. */
function tierSteps({ trait, count, tier }: TraitStatus, medalClass: string): HTMLElement {
  return el(
    'span',
    { className: 'trait-steps' },
    trait.tiers.flatMap((candidate, index) => [
      index > 0 ? el('span', { className: 'muted', text: ' / ' }) : null,
      el('span', {
        className: candidate === tier ? `trait-step current ${medalClass}` : count >= candidate.count ? 'trait-step reached' : 'trait-step',
        text: String(candidate.count),
      }),
    ]),
  );
}

/**
 * Une synergie : insigne du trait (fond bronze, argent ou or selon le palier atteint, gris sinon),
 * nom, nombre d'unités, paliers, puis l'effet actif ou le prochain palier à atteindre.
 * Clic droit : aperçu de tous les paliers, avec les unités du trait (celles de l'équipe cochées).
 */
function traitItem(status: TraitStatus, team: readonly UnitDefinition[], bonus: TraitCountBonus): HTMLElement {
  const { trait, count, tier } = status;
  const extra = bonus[trait.id] ?? 0;
  const medal = traitMedal(trait, tier);
  const medalClass = medal === null ? 'medal-none' : `medal-${medal}`;
  const next = trait.tiers.find((candidate) => candidate.count > count);
  const style = traitBadgeStyle(trait.id);
  const item = el('li', { className: tier === null ? 'trait inactive' : 'trait active', attrs: { title: 'Clic droit : tous les paliers' } }, [
    el('span', {
      className: `trait-medal ${medalClass}`,
      text: style.symbol,
      attrs: {
        style: `--badge: ${style.color}`,
        title: medal === null ? 'Aucun palier atteint' : `Palier ${MEDAL_NAMES[medal]}`,
        'aria-hidden': 'true',
      },
    }),
    el('div', { className: 'trait-text' }, [
      el('div', { className: 'trait-line' }, [
        el('strong', { text: trait.name }),
        el('span', { className: 'trait-count', text: String(count) }),
        extra > 0 ? el('span', { className: 'trait-talent-bonus small', text: `(+${extra} talent)`, attrs: { title: 'Talent de chasseur' } }) : null,
        tierSteps(status, medalClass),
      ]),
      el('div', {
        className: 'small',
        text: tier?.description ?? (next === undefined ? '' : `À ${next.count} : ${next.description}`),
      }),
    ]),
  ]);
  return onRightClick(item, () => traitPreview(trait.id, team, bonus));
}

/**
 * Liste des synergies d'une équipe, actives en premier (aussi utilisée par le planificateur).
 * `bonus` : unités en plus données par les talents de chasseur, comptées pour les traits présents.
 */
export function traitList(units: readonly UnitDefinition[], empty = 'Aucune unité.', bonus: TraitCountBonus = {}): HTMLElement {
  const statuses = traitStatuses(units, bonus);
  return statuses.length > 0
    ? el('ul', { className: 'traits' }, statuses.map((status) => traitItem(status, units, bonus)))
    : el('p', { className: 'muted', text: empty });
}

/** Traits de chaque camp, actifs en premier, avec le prochain palier à atteindre (`playerBonus` : talents). */
export function renderTraits(player: readonly UnitDefinition[], enemy: readonly UnitDefinition[], playerBonus: TraitCountBonus = {}): HTMLElement {
  return el('section', { className: 'panel' }, [
    el('h2', { text: 'Synergies' }),
    el('div', { className: 'two-columns' }, [
      el('div', {}, [el('h3', { text: 'Joueur' }), traitList(player, 'Aucune unité.', playerBonus)]),
      el('div', {}, [el('h3', { text: 'Ennemi' }), traitList(enemy)]),
    ]),
  ]);
}
