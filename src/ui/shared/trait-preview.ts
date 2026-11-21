import type { TraitId, UnitDefinition } from '../../data/definitions.ts';
import { findTrait, type TraitDefinition, type TraitTier } from '../../data/traits.ts';
import { UNITS } from '../../data/units/index.ts';
import { BLACK_DRAGON_LIMIT_MESSAGE, BLACK_DRAGON_TRAIT } from '../../rules/board-limits.ts';
import { activeTier, countTraits, unitTraitIds } from '../../rules/traits.ts';
import { el } from '../dom.ts';
import { traitMedal, type TraitMedal } from './trait-medals.ts';
import { traitBadgeStyle } from './trait-styles.ts';

/**
 * Aperçu d'un trait, ouvert au clic droit (synergies, insignes des unités) : tous ses paliers avec leur
 * couleur et leur effet, et les unités qui le portent. Avec une équipe, on voit en plus où elle en est.
 */

/**
 * État d'un palier pour une équipe : `active` (le plus haut atteint, le seul qui s'applique),
 * `reached` (atteint mais dépassé), `locked` (pas encore atteint), `neutral` (aucune équipe).
 */
export type TierState = 'active' | 'reached' | 'locked' | 'neutral';

export interface TierRow {
  readonly tier: TraitTier;
  /** Couleur que prend la synergie à ce palier. */
  readonly medal: TraitMedal;
  readonly state: TierState;
}

/** Lignes des paliers d'un trait ; `count` = nombre d'unités de l'équipe (null : pas d'équipe). */
export function tierRows(trait: TraitDefinition, count: number | null): TierRow[] {
  const active = count === null ? null : activeTier(trait, count);
  return trait.tiers.map((tier) => ({
    tier,
    medal: traitMedal(trait, tier) ?? 'bronze',
    state: count === null ? 'neutral' : tier === active ? 'active' : count >= tier.count ? 'reached' : 'locked',
  }));
}

/** Unités du jeu qui portent ce trait, par coût puis par nom. */
export function traitMembers(traitId: TraitId): UnitDefinition[] {
  return UNITS.filter((unit) => unitTraitIds(unit).includes(traitId));
}

/** Sous-titre : élément, ou trait secondaire (et à qui il est réservé). */
export function traitCategory(trait: TraitDefinition): string {
  if (trait.category === 'element') return 'Élément';
  if (trait.restrictedTo === 'hunter') return 'Trait secondaire · chasseurs uniquement';
  if (trait.restrictedTo === 'monster') return 'Trait secondaire · monstres uniquement';
  return 'Trait secondaire';
}

/**
 * Contenu de l'aperçu. `team` (facultatif) : l'équipe dont on regarde la synergie ; son palier actif
 * et ses unités du trait sont alors mis en avant.
 */
export function traitPreview(traitId: TraitId, team?: readonly UnitDefinition[]): HTMLElement {
  const trait = findTrait(traitId);
  if (trait === undefined) return el('p', { className: 'muted', text: 'Trait inconnu.' });
  const count = team === undefined ? null : (countTraits(team).get(trait.id) ?? 0);
  const style = traitBadgeStyle(trait.id);
  const current = count === null ? null : traitMedal(trait, activeTier(trait, count));
  const inTeam = new Set(team?.map((unit) => unit.id) ?? []);
  const members = traitMembers(trait.id);

  return el('div', { className: 'trait-preview' }, [
    el('div', { className: 'trait-preview-head' }, [
      el('span', {
        className: `trait-medal ${current === null ? (count === null ? 'medal-trait' : 'medal-none') : `medal-${current}`}`,
        text: style.symbol,
        attrs: { style: `--badge: ${style.color}`, 'aria-hidden': 'true' },
      }),
      el('div', {}, [
        el('h3', { text: count === null ? trait.name : `${trait.name} · ${count} unité${count > 1 ? 's' : ''}` }),
        el('p', { className: 'muted small', text: traitCategory(trait) }),
      ]),
    ]),
    el(
      'ul',
      { className: 'tier-rows' },
      tierRows(trait, count).map((row) =>
        el('li', { className: `tier-row ${row.state}` }, [
          el('span', { className: `trait-step current medal-${row.medal}`, text: String(row.tier.count) }),
          el('span', { className: 'small', text: row.tier.description }),
        ]),
      ),
    ),
    el('p', {
      className: 'muted small',
      text: `Seul le palier le plus haut atteint s’applique. Chaque unité différente compte une fois.${trait.id === BLACK_DRAGON_TRAIT ? ` ${BLACK_DRAGON_LIMIT_MESSAGE}` : ''}`,
    }),
    el('h4', { text: `Unités du trait (${members.length})` }),
    el(
      'ul',
      { className: 'trait-units' },
      members.map((unit) =>
        el('li', { className: inTeam.has(unit.id) ? 'trait-unit in-team' : 'trait-unit', attrs: { title: `Coût ${unit.cost}` } }, [
          el('span', { className: `cost-dot cost-${unit.cost}`, attrs: { 'aria-hidden': 'true' } }),
          inTeam.has(unit.id) ? `✓ ${unit.name}` : unit.name,
        ]),
      ),
    ),
  ]);
}
