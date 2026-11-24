import type { StatBonus, TraitId, UnitDefinition } from '../data/definitions.ts';
import { ECONOMY } from '../data/run-balance.ts';
import { findTalent, type TalentEffect } from '../data/talents.ts';
import { unitTraitIds } from '../rules/traits.ts';
import type { OwnedTalent, RunState } from './state.ts';

/**
 * Effets durables des talents de chasseur possédés (revenus, boutique, plateau, combat, traits).
 * Les effets immédiats (zennys, matériaux, unités…) sont appliqués au moment du choix, dans talents.ts.
 */

type EffectOf<K extends TalentEffect['kind']> = Extract<TalentEffect, { kind: K }>;

/** Chaque effet des talents possédés, avec le talent qui le porte (pour son trait tiré). */
function ownedEffects<K extends TalentEffect['kind']>(state: RunState, kind: K): { effect: EffectOf<K>; owned: OwnedTalent }[] {
  return state.talents.flatMap((owned) =>
    (findTalent(owned.talentId)?.effects ?? []).flatMap((effect) => (effect.kind === kind ? [{ effect: effect as EffectOf<K>, owned }] : [])),
  );
}

/** Zennys en plus au début de chaque tour (Fortune du Commandant). */
export function talentIncome(state: RunState): number {
  return ownedEffects(state, 'incomePerRound').reduce((sum, { effect }) => sum + effect.amount, 0);
}

/** Plafond des intérêts : 5 zennys, ou plus avec Banquier félyne. */
export function maxInterest(state: RunState): number {
  return Math.max(ECONOMY.maxInterest, ...ownedEffects(state, 'maxInterest').map(({ effect }) => effect.value));
}

/** Relances gratuites de la boutique à chaque tour (Commerce félyne). */
export function freeRerollsPerRound(state: RunState): number {
  return ownedEffects(state, 'freeRerollsPerRound').reduce((sum, { effect }) => sum + effect.amount, 0);
}

/** Nombre maximum d'unités sur le plateau : le niveau, plus les places des talents (Grand chasseur). */
export function boardCapacity(state: RunState): number {
  return state.level + ownedEffects(state, 'boardSlots').reduce((sum, { effect }) => sum + effect.amount, 0);
}

/** Unités en plus pour chaque trait (Insigne, Blason, Couronne). */
export function talentTraitBonus(state: RunState): Record<TraitId, number> {
  const bonus: Record<TraitId, number> = {};
  for (const { effect, owned } of ownedEffects(state, 'traitCount')) {
    if (owned.traitId !== null) bonus[owned.traitId] = (bonus[owned.traitId] ?? 0) + effect.amount;
  }
  return bonus;
}

/** Bonus de combat que les talents donnent à une unité du joueur. */
export function talentCombatBonuses(state: RunState, unit: UnitDefinition): StatBonus[] {
  return ownedEffects(state, 'combatBonus').flatMap(({ effect, owned }) => {
    const concerned =
      effect.target === 'team' ||
      (effect.target === 'hunters' && unit.kind === 'hunter') ||
      (effect.target === 'traitMembers' && owned.traitId !== null && unitTraitIds(unit).includes(owned.traitId));
    return concerned ? [effect.bonus] : [];
  });
}
