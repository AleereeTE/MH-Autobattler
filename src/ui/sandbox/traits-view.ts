import type { Side } from '../../combat/index.ts';
import { traitStatuses } from '../../rules/traits.ts';
import { el } from '../dom.ts';
import type { SandboxModel } from './model.ts';

function sideTraits(model: SandboxModel, side: Side, title: string): HTMLElement {
  const statuses = traitStatuses(model.unitsOf(side).map((placed) => placed.unit));
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
export function renderTraits(model: SandboxModel): HTMLElement {
  return el('section', { className: 'panel' }, [
    el('h2', { text: 'Synergies' }),
    el('div', { className: 'two-columns' }, [sideTraits(model, 'player', 'Joueur'), sideTraits(model, 'enemy', 'Ennemi')]),
  ]);
}
