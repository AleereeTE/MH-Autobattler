import type { UnitDefinition } from '../../data/definitions.ts';
import { traitStatuses } from '../../rules/traits.ts';
import { el } from '../dom.ts';

function sideTraits(units: readonly UnitDefinition[], title: string): HTMLElement {
  const statuses = traitStatuses(units);
  const items = statuses.map(({ trait, count, tier }) => {
    const next = trait.tiers.find((candidate) => candidate.count > count);
    const progress = trait.tiers.map((candidate) => candidate.count).join(' / ');
    return el('li', { className: tier === null ? 'trait inactive' : 'trait active' }, [
      el('strong', { text: `${trait.name} ${count}` }),
      el('span', { className: 'muted', text: ` (${progress})` }),
      el('div', {
        className: 'small',
        text: tier?.description ?? (next === undefined ? '' : `À ${next.count} : ${next.description}`),
      }),
    ]);
  });

  return el('div', {}, [
    el('h3', { text: title }),
    items.length > 0 ? el('ul', { className: 'traits' }, items) : el('p', { className: 'muted', text: 'Aucune unité.' }),
  ]);
}

/** Traits de chaque camp, actifs en premier, avec le prochain palier à atteindre. */
export function renderTraits(player: readonly UnitDefinition[], enemy: readonly UnitDefinition[]): HTMLElement {
  return el('section', { className: 'panel' }, [
    el('h2', { text: 'Synergies' }),
    el('div', { className: 'two-columns' }, [sideTraits(player, 'Joueur'), sideTraits(enemy, 'Ennemi')]),
  ]);
}
