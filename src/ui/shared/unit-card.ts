import type { StarRank, StatBonus, UnitDefinition } from '../../data/definitions.ts';
import type { Placement } from '../../combat/index.ts';
import type { Equipment } from '../../data/items.ts';
import { equipmentBonuses } from '../../rules/equipment.ts';
import { rankStars, rankedStats, skillForRank } from '../../rules/ranks.ts';
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

/** La compétence de l'unité (à ce rang) lui donne-t-elle un bouclier ? */
export function hasShieldSkill(unit: UnitDefinition, rank: StarRank = 1): boolean {
  return skillForRank(unit, rank).effects.some((effect) => effect.kind === 'shield');
}

/**
 * Compétence d'une unité à ce rang : nom, description, et le rappel du bouclier s'il y a lieu.
 * La compétence secrète d'un Dragon noir n'apparaît qu'au ★3 (easter egg).
 */
export function skillBlock(unit: UnitDefinition, rank: StarRank = 1): HTMLElement[] {
  const skill = skillForRank(unit, rank);
  const secret = skill !== unit.skill;
  return [
    el('p', { className: secret ? 'secret-skill' : '' }, [el('strong', { text: `${secret ? '✦ ' : ''}${skill.name} : ` }), skill.description]),
    ...(hasShieldSkill(unit, rank) ? [el('p', { className: 'muted small', text: SHIELD_ENERGY_NOTE })] : []),
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

/** Compétence de boss d'une unité en version boss : elle remplace la sienne quand il s'enrage, à mi-vie. */
export function bossSkillBlock(unit: UnitDefinition): HTMLElement[] {
  const skill = unit.bossSkill;
  if (skill === undefined) return [];
  return [el('p', { className: 'boss-skill' }, [el('strong', { text: `👹 À mi-vie, s’enrage : ${skill.name} : ` }), skill.description])];
}

/**
 * Fiche d'une unité : nom, rang, coût, traits, compétence et statistiques (au rang, avec l'équipement).
 * `bonus` : renforcement d'un ennemi (version boss, mode infini), compté dans les statistiques.
 * `boss` : version boss, avec sa compétence de boss.
 */
export function unitCard(unit: UnitDefinition, equipment: Equipment, rank: StarRank, bonus?: StatBonus, boss = false): HTMLElement {
  const extra = bonus === undefined ? [] : [bonus];
  const note = boss
    ? 'Statistiques au rang choisi, avec le bonus de la version boss (renforcement du mode infini compris, s’il y a lieu), hors bonus de traits.'
    : bonus === undefined
      ? 'Statistiques au rang choisi, avec l’équipement, hors bonus de traits.'
      : 'Statistiques au rang choisi, avec l’équipement et le renforcement du mode infini, hors bonus de traits.';
  return el('div', { className: 'unit-card' }, [
    ...unitHeader(unit, rank),
    boss ? el('p', { className: 'boss-tag', text: 'Version boss' }) : null,
    ...skillBlock(unit, rank),
    ...(boss ? bossSkillBlock(unit) : []),
    statsTable(computeCombatStats(rankedStats(unit.stats, rank), [...equipmentBonuses(equipment), ...extra])),
    el('p', { className: 'muted small', text: note }),
  ]);
}

/** Fiche d'un ennemi posé (escouade de la chasse) : rang, équipement, renforcement et version boss. */
export function placementCard(placement: Placement): HTMLElement {
  return unitCard(placement.unit, placement.equipment ?? [], placement.rank ?? 1, placement.bonus, placement.boss === true);
}
