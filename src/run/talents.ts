import { pickOne, weightedIndex } from '../core/random.ts';
import type { TraitId, UnitDefinition } from '../data/definitions.ts';
import { MATERIAL_IDS, type EquipmentSlot } from '../data/items.ts';
import { RUN_STRUCTURE } from '../data/run-balance.ts';
import {
  TALENTS,
  TALENT_CHOICE,
  TALENT_TIERS,
  TALENT_TIER_WEIGHTS,
  TALENT_TRAIT_EXCLUDED,
  findTalent,
  talentNeedsTrait,
  talentUnitEffect,
  type TalentDefinition,
  type TalentEffect,
  type TalentTier,
} from '../data/talents.ts';
import { TRAITS } from '../data/traits.ts';
import { UNITS } from '../data/units/index.ts';
import { completedUnitIds } from './completed.ts';
import { applyReward, canTakeReward } from './rewards.ts';
import { OK, fail, type ActionResult, type RunState, type TalentOffer } from './state.ts';

/**
 * Choix des talents de chasseur (game-design §11.1) : au début des stages 1 à 3, une rareté tirée au hasard,
 * 3 propositions de cette rareté, un reroll par proposition. Les effets durables sont dans talent-effects.ts.
 */

/** Un choix de talent ouvre chaque stage de la run, pas ceux du mode infini. */
export function talentChoiceDue(stage: number): boolean {
  return stage <= TALENT_CHOICE.lastStage;
}

/** Traits que peuvent tirer Insigne, Blason et Couronne. */
const TALENT_TRAITS: readonly TraitId[] = TRAITS.map((trait) => trait.id).filter((id) => !TALENT_TRAIT_EXCLUDED.includes(id));

/** Unités qu'un talent « unité » peut donner : du bon coût ou du bon trait, en stock, pas déjà au ★3. */
function unitCandidates(state: RunState, effect: Extract<TalentEffect, { kind: 'unit' }>): UnitDefinition[] {
  const completed = completedUnitIds(state);
  return UNITS.filter(
    (unit) =>
      (effect.cost === undefined || unit.cost === effect.cost) &&
      (effect.trait === undefined || unit.traits.includes(effect.trait)) &&
      !completed.has(unit.id) &&
      (state.pool.get(unit.id) ?? 0) >= effect.copies,
  );
}

/** Le talent peut-il être proposé ? (pas déjà pris ni proposé, et une unité disponible s'il en donne une) */
function canOffer(state: RunState, talent: TalentDefinition, excluded: ReadonlySet<string>): boolean {
  if (excluded.has(talent.id)) return false;
  const unitEffect = talentUnitEffect(talent);
  return unitEffect === undefined || unitCandidates(state, unitEffect).length > 0;
}

/** Tire une proposition de cette rareté, différente des talents possédés et de ceux déjà proposés. */
function drawOffer(state: RunState, tier: TalentTier, current: readonly TalentOffer[], rerolled: boolean): TalentOffer | null {
  const excluded = new Set([...state.talents.map((owned) => owned.talentId), ...current.map((offer) => offer.talentId)]);
  const talent = pickOne(
    state.rng,
    TALENTS.filter((candidate) => candidate.tier === tier && canOffer(state, candidate, excluded)),
  );
  if (talent === undefined) return null;
  const traitId = talentNeedsTrait(talent) ? (pickOne(state.rng, TALENT_TRAITS) ?? null) : null;
  const unitEffect = talentUnitEffect(talent);
  const unitId = unitEffect === undefined ? null : (pickOne(state.rng, unitCandidates(state, unitEffect))?.id ?? null);
  return { talentId: talent.id, traitId, unitId, rerolled };
}

/**
 * Ouvre un choix de talent : au début d'un stage, rareté tirée au hasard, puis 3 propositions de cette rareté.
 * Une Stèle ancienne impose la rareté et interdit les relances (`rerolls: false`).
 */
export function openTalentChoice(state: RunState, options: { readonly tier?: TalentTier; readonly rerolls?: boolean } = {}): void {
  const tier = options.tier ?? TALENT_TIERS[weightedIndex(state.rng, TALENT_TIERS.map((candidate) => TALENT_TIER_WEIGHTS[candidate]))] ?? 'silver';
  const offers: TalentOffer[] = [];
  for (let i = 0; i < TALENT_CHOICE.offers; i++) {
    const offer = drawOffer(state, tier, offers, options.rerolls === false);
    if (offer !== null) offers.push(offer);
  }
  state.talentChoice = { tier, offers };
  state.phase = 'talent';
}

/** Remplace une proposition par un autre talent de la même rareté ; une seule fois par proposition. */
export function rerollTalent(state: RunState, index: number): ActionResult {
  const choice = state.talentChoice;
  if (state.phase !== 'talent' || choice === null) return fail('Aucun talent à choisir.');
  const offer = choice.offers[index];
  if (offer === undefined) return fail('Proposition introuvable.');
  if (offer.rerolled) return fail('Cette proposition a déjà été relancée.');
  const replacement = drawOffer(state, choice.tier, choice.offers, true);
  if (replacement === null) return fail('Plus aucun autre talent de cette rareté.');
  choice.offers[index] = replacement;
  return OK;
}

/** Peut-on prendre ce talent ? (une unité demande de la place en réserve, ou une fusion) */
export function canTakeTalent(state: RunState, offer: TalentOffer): boolean {
  const talent = findTalent(offer.talentId);
  const unitEffect = talent === undefined ? undefined : talentUnitEffect(talent);
  if (unitEffect === undefined || offer.unitId === null) return true;
  return canTakeReward(state, { kind: 'unit', unitId: offer.unitId, copies: unitEffect.copies });
}

const randomMaterial = (state: RunState) => pickOne(state.rng, MATERIAL_IDS) ?? 'bone';

/** Effets immédiats d'un talent ; les effets durables se lisent à partir des talents possédés. */
function applyImmediate(state: RunState, effect: TalentEffect, offer: TalentOffer): ActionResult {
  switch (effect.kind) {
    case 'zennys':
      state.zennys += effect.amount;
      return OK;
    case 'levels':
      state.level = Math.min(RUN_STRUCTURE.maxLevel, state.level + effect.amount);
      return OK;
    case 'materials':
      for (let i = 0; i < effect.amount; i++) state.inventory.push({ kind: 'material', material: randomMaterial(state) });
      return OK;
    case 'objects':
      for (let i = 0; i < effect.amount; i++) {
        const object: EquipmentSlot = { kind: 'object', materials: [randomMaterial(state), randomMaterial(state)] };
        state.inventory.push(object);
      }
      return OK;
    case 'itemRemovers':
      state.itemRemovers += effect.amount;
      return OK;
    case 'unit':
      return offer.unitId === null ? OK : applyReward(state, { kind: 'unit', unitId: offer.unitId, copies: effect.copies });
    case 'combatBonus':
    case 'incomePerRound':
    case 'freeRerollsPerRound':
    case 'maxInterest':
    case 'boardSlots':
    case 'traitCount':
      return OK; // effets durables : voir talent-effects.ts
  }
}

/** Prend une des propositions : effets immédiats, talent ajouté à la run, puis la carte du stage (ou la case Événement). */
export function chooseTalent(state: RunState, index: number): ActionResult {
  const choice = state.talentChoice;
  if (state.phase !== 'talent' || choice === null) return fail('Aucun talent à choisir.');
  const offer = choice.offers[index];
  const talent = offer === undefined ? undefined : findTalent(offer.talentId);
  if (offer === undefined || talent === undefined) return fail('Proposition introuvable.');
  if (!canTakeTalent(state, offer)) return fail('Pas assez de place en réserve pour cette unité.');
  // L'unité d'abord : c'est le seul effet qui peut échouer.
  const ordered = [...talent.effects].sort((a, b) => Number(b.kind === 'unit') - Number(a.kind === 'unit'));
  for (const effect of ordered) {
    const result = applyImmediate(state, effect, offer);
    if (!result.ok) return result;
  }
  state.talents.push({ talentId: offer.talentId, traitId: offer.traitId, unitId: offer.unitId });
  state.talentChoice = null;
  // Talent d'une Stèle ancienne : retour sur la case Événement, pour reprendre la route.
  state.phase = state.event !== null ? 'prep' : 'map';
  return OK;
}
