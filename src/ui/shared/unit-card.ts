import type { StarRank, UnitDefinition } from '../../data/definitions.ts';
import type { Equipment } from '../../data/items.ts';
import { equipmentBonuses } from '../../rules/equipment.ts';
import { rankStars, rankedStats } from '../../rules/ranks.ts';
import { computeCombatStats } from '../../rules/stats.ts';
import { el } from '../dom.ts';
import { traitBadges } from './trait-badges.ts';
import { unitSubtitle } from './unit-label.ts';

const percent = (value: number): string => `${Math.round(value * 100)} %`;
const round = (value: number): string => String(Math.round(value));

/** Statistiques affichées dans une fiche. */
export interface DisplayedStats {
  readonly hp: number;
  readonly attack: number;
  readonly elementalPower: number;
  readonly critChance: number;
  readonly critMultiplier?: number;
  readonly armor: number;
  readonly elementalResist: number;
  readonly attackSpeed: number;
  readonly range: number;
  readonly maxEnergy: number;
}

export function statsTable(stats: DisplayedStats): HTMLElement {
  const crit = stats.critMultiplier === undefined ? percent(stats.critChance) : `${percent(stats.critChance)} · ×${stats.critMultiplier.toFixed(1)}`;
  const rows: [string, string][] = [
    ['PV', round(stats.hp)],
    ['Attaque brute', round(stats.attack)],
    ['Puissance élémentaire', round(stats.elementalPower)],
    ['Critique', crit],
    ['Armure', round(stats.armor)],
    ['Résistance élémentaire', round(stats.elementalResist)],
    ['Vitesse d’attaque', stats.attackSpeed.toFixed(2)],
    ['Portée', String(stats.range)],
    ['Énergie max', String(stats.maxEnergy)],
  ];
  return el('dl', { className: 'stats' }, rows.flatMap(([label, value]) => [el('dt', { text: label }), el('dd', { text: value })]));
}

/** Rappel affiché sous la compétence des unités qui se protègent d'un bouclier. */
export const SHIELD_ENERGY_NOTE = 'Tant que son bouclier tient (jusqu’à ce qu’il soit détruit ou expire), l’unité ne gagne pas d’énergie.';

/** La compétence de l'unité lui donne-t-elle un bouclier ? */
export function hasShieldSkill(unit: UnitDefinition): boolean {
  return unit.skill.effects.some((effect) => effect.kind === 'shield');
}

/** Compétence d'une unité : nom, description, et le rappel du bouclier s'il y a lieu. */
export function skillBlock(unit: UnitDefinition): HTMLElement[] {
  return [
    el('p', {}, [el('strong', { text: `${unit.skill.name} : ` }), unit.skill.description]),
    ...(hasShieldSkill(unit) ? [el('p', { className: 'muted small', text: SHIELD_ENERGY_NOTE })] : []),
  ];
}

/** En-tête commun des fiches : nom, rang, coût, sous-titre et insignes des traits. */
export function unitHeader(unit: UnitDefinition, rank: StarRank): HTMLElement[] {
  return [
    el('h3', { text: `${unit.name} ${rankStars(rank)} · coût ${unit.cost}` }),
    el('p', { className: 'muted', text: unitSubtitle(unit) }),
    traitBadges(unit),
  ];
}

/** Fiche d'une unité : nom, rang, coût, traits, compétence et statistiques (au rang, avec l'équipement). */
export function unitCard(unit: UnitDefinition, equipment: Equipment, rank: StarRank): HTMLElement {
  return el('div', { className: 'unit-card' }, [
    ...unitHeader(unit, rank),
    ...skillBlock(unit),
    statsTable(computeCombatStats(rankedStats(unit.stats, rank), equipmentBonuses(equipment))),
    el('p', { className: 'muted small', text: 'Statistiques au rang choisi, avec l’équipement, hors bonus de traits.' }),
  ]);
}
