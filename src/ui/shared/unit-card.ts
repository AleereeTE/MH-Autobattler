import type { StarRank, UnitDefinition } from '../../data/definitions.ts';
import type { Equipment } from '../../data/items.ts';
import { findTrait } from '../../data/traits.ts';
import { equipmentBonuses } from '../../rules/equipment.ts';
import { rankStars, rankedStats } from '../../rules/ranks.ts';
import { computeCombatStats } from '../../rules/stats.ts';
import { unitTraitIds } from '../../rules/traits.ts';
import { el } from '../dom.ts';
import { unitSubtitle } from './unit-label.ts';

/** Fiche d'une unité : nom, rang, coût, traits, compétence et statistiques (au rang, avec l'équipement). */
const percent = (value: number): string => `${Math.round(value * 100)} %`;
const round = (value: number): string => String(Math.round(value));

function statsTable(unit: UnitDefinition, equipment: Equipment, rank: StarRank): HTMLElement {
  const stats = computeCombatStats(rankedStats(unit.stats, rank), equipmentBonuses(equipment));
  const rows: [string, string][] = [
    ['PV', round(stats.hp)],
    ['Attaque brute', round(stats.attack)],
    ['Puissance élémentaire', round(stats.elementalPower)],
    ['Critique', `${percent(stats.critChance)} · ×${stats.critMultiplier.toFixed(1)}`],
    ['Armure', round(stats.armor)],
    ['Résistance élémentaire', round(stats.elementalResist)],
    ['Vitesse d’attaque', stats.attackSpeed.toFixed(2)],
    ['Portée', String(stats.range)],
    ['Énergie max', String(stats.maxEnergy)],
  ];
  return el('dl', { className: 'stats' }, rows.flatMap(([label, value]) => [el('dt', { text: label }), el('dd', { text: value })]));
}

export function unitCard(unit: UnitDefinition, equipment: Equipment, rank: StarRank): HTMLElement {
  return el('div', { className: 'unit-card' }, [
    el('h3', { text: `${unit.name} ${rankStars(rank)} · coût ${unit.cost}` }),
    el('p', { className: 'muted', text: unitSubtitle(unit) }),
    el(
      'p',
      { className: 'chips' },
      unitTraitIds(unit).map((id) => el('span', { className: 'chip', text: findTrait(id)?.name ?? id })),
    ),
    el('p', {}, [el('strong', { text: `${unit.skill.name} : ` }), unit.skill.description]),
    statsTable(unit, equipment, rank),
    el('p', { className: 'muted small', text: 'Statistiques au rang choisi, avec l’équipement, hors bonus de traits.' }),
  ]);
}

