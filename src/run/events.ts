import { pickOne } from '../core/random.ts';
import { EVENTS, findEvent, type EventChoice, type EventDefinition } from '../data/events.ts';
import { MATERIAL_IDS, MATERIALS, SIGNATURE_OBJECTS } from '../data/items.ts';
import { UNITS, findUnit } from '../data/units/index.ts';
import { objectFor } from '../rules/equipment.ts';
import { isCapturable } from './capture.ts';
import { completedUnitIds } from './completed.ts';
import { drawUnitId } from './pool.ts';
import { giveCopies } from './rewards.ts';
import { canReceive } from './roster.ts';
import { OK, fail, type ActionResult, type RunState } from './state.ts';
import { openTalentChoice } from './talents.ts';

/**
 * Cases Événement (game-design §2.1) : en arrivant sur la case, un événement est tiré parmi ceux pas encore
 * rencontrés pendant la run ; le joueur fait un choix, voit ce qu'il a obtenu, puis reprend la route.
 * Le hasard passe par le générateur de la run (la sauvegarde le garde : recharger ne change rien).
 */

/** Précisions d'un choix : l'unité à copier (Entraînement), les matériaux à donner (Commission). */
export interface EventChoiceParams {
  readonly unitId?: string;
  readonly materialIndexes?: readonly number[];
}

/** Tire l'événement de la case : un de ceux pas encore rencontrés (tous de nouveau une fois qu'on les a tous vus). */
export function drawEvent(state: RunState): void {
  let candidates = EVENTS.filter((event) => !state.seenEvents.includes(event.id));
  if (candidates.length === 0) {
    state.seenEvents = [];
    candidates = [...EVENTS];
  }
  const event = pickOne(state.rng, candidates);
  if (event === undefined) return;
  state.seenEvents.push(event.id);
  state.event = { eventId: event.id, result: null };
}

/** Événement en cours sur la case, s'il y en a un. */
export function currentEvent(state: RunState): EventDefinition | null {
  return state.event === null ? null : (findEvent(state.event.eventId) ?? null);
}

/** Unités possédées dont on peut recevoir un exemplaire de plus (Entraînement). */
export function extraCopyCandidates(state: RunState): string[] {
  const completed = completedUnitIds(state);
  const owned = [...new Set(state.units.map((unit) => unit.unitId))];
  return owned.filter((unitId) => !completed.has(unitId) && (state.pool.get(unitId) ?? 0) > 0 && canReceive(state, unitId, 1));
}

/** Positions des matériaux (pas des objets) dans l'inventaire (Commission). */
export function looseMaterialIndexes(state: RunState): number[] {
  return state.inventory.flatMap((slot, index) => (slot.kind === 'material' ? [index] : []));
}

/** Monstres de ce coût qu'une capture peut donner : capturables, en stock, pas déjà au ★3, avec de la place en réserve. */
function captureCandidates(state: RunState, cost: number): string[] {
  const completed = completedUnitIds(state);
  return UNITS.filter(
    (unit) => unit.cost === cost && isCapturable(unit) && !completed.has(unit.id) && (state.pool.get(unit.id) ?? 0) > 0 && canReceive(state, unit.id, 1),
  ).map((unit) => unit.id);
}

/**
 * Unités que le Chasseur blessé ne peut pas donner : les monstres, les chasseurs déjà obtenus au ★3,
 * et ceux qui ne trouveraient pas de place en réserve.
 */
function hunterExclusions(state: RunState): Set<string> {
  const completed = completedUnitIds(state);
  return new Set(UNITS.filter((unit) => unit.kind !== 'hunter' || completed.has(unit.id) || !canReceive(state, unit.id, 1)).map((unit) => unit.id));
}

/** Le joueur peut-il faire ce choix ? null si oui, sinon la raison affichée. */
export function eventChoiceBlocker(state: RunState, choice: EventChoice): string | null {
  const { effect } = choice;
  const price = 'price' in effect ? effect.price : effect.kind === 'bet' ? effect.stake : 0;
  if (state.zennys < price) return `Il faut ${price} zennys.`;
  switch (effect.kind) {
    case 'recruitHunter':
      return drawableHunter(state) ? null : 'Réserve pleine, ou plus aucun chasseur disponible.';
    case 'extraCopy':
      return extraCopyCandidates(state).length > 0 ? null : 'Aucune unité possédée ne peut recevoir d’exemplaire de plus.';
    case 'healDefeat':
      return state.defeats > 0 ? null : 'Tu n’as aucune défaite à effacer.';
    case 'tradeMaterials':
      return looseMaterialIndexes(state).length >= effect.materials ? null : `Il faut ${effect.materials} matériaux dans l’inventaire.`;
    case 'captureGamble':
      return captureCandidates(state, effect.cost).length > 0 ? null : 'Réserve pleine, ou plus aucun monstre à capturer.';
    default:
      return null;
  }
}

/** Un chasseur peut-il encore être tiré, et rejoindre la réserve ? */
function drawableHunter(state: RunState): boolean {
  const excluded = hunterExclusions(state);
  return UNITS.some((unit) => !excluded.has(unit.id) && (state.pool.get(unit.id) ?? 0) > 0);
}

const randomMaterial = (state: RunState) => pickOne(state.rng, MATERIAL_IDS) ?? 'bone';

/**
 * Fait un choix de l'événement en cours. Un choix « partir » reprend tout de suite la route (`leave`) ;
 * les autres affichent leur compte rendu, puis le joueur reprend la route.
 */
export function chooseEventOption(state: RunState, index: number, params: EventChoiceParams, leave: () => ActionResult): ActionResult {
  const event = currentEvent(state);
  if (state.phase !== 'prep' || event === null || state.event === null) return fail('Aucun événement ici.');
  if (state.event.result !== null) return fail('Tu as déjà fait ton choix.');
  const choice = event.choices[index];
  if (choice === undefined) return fail('Choix introuvable.');
  const blocker = eventChoiceBlocker(state, choice);
  if (blocker !== null) return fail(blocker);
  if (choice.effect.kind === 'leave') {
    state.event.result = ['Tu reprends la route.'];
    return leave();
  }
  const result = applyEffect(state, choice, params);
  if (!result.ok) return result;
  state.event.result = result.lines;
  return OK;
}

type EffectResult = { readonly ok: true; readonly lines: string[] } | { readonly ok: false; readonly reason: string };

const done = (...lines: string[]): EffectResult => ({ ok: true, lines });

function applyEffect(state: RunState, choice: EventChoice, params: EventChoiceParams): EffectResult {
  const { effect } = choice;
  switch (effect.kind) {
    case 'leave':
      return done('Tu reprends la route.');
    case 'mysteryBox': {
      state.zennys -= effect.price;
      if (state.rng.chance(effect.objectChance)) {
        const materials = pickOne(state.rng, SIGNATURE_OBJECTS)?.materials ?? ['bone', 'bone'];
        state.inventory.push({ kind: 'object', materials });
        return done(`La boîte contient un objet : ${objectFor(materials).name} !`);
      }
      const material = randomMaterial(state);
      state.inventory.push({ kind: 'material', material });
      return done(`La boîte ne contient qu’un matériau : ${MATERIALS[material].name}.`);
    }
    case 'zennysForDanger':
      state.zennys += effect.zennys;
      state.nextHuntReinforced = true;
      return done(`+${effect.zennys} zennys.`, 'La mère rôde : ta prochaine chasse sera renforcée.');
    case 'recruitHunter': {
      const unitId = drawUnitId(state.pool, state.level, state.rng, hunterExclusions(state));
      if (unitId === null) return { ok: false, reason: 'Plus aucun chasseur ne peut rejoindre ta réserve.' };
      state.zennys -= effect.price;
      const given = giveCopies(state, unitId, 1);
      if (!given.ok) return given;
      return done(`${findUnit(unitId)?.name ?? unitId} rejoint ta réserve, reconnaissant.`);
    }
    case 'nextCombatBonus':
      state.nextCombatBonus = effect.bonus;
      return done('Ton équipe est rassasiée : +20 % de PV au prochain combat.');
    case 'extraCopy': {
      const unitId = params.unitId;
      if (unitId === undefined || !extraCopyCandidates(state).includes(unitId)) return { ok: false, reason: 'Choisis une unité que tu possèdes.' };
      const given = giveCopies(state, unitId, 1);
      if (!given.ok) return given;
      return done(`Un exemplaire de plus de ${findUnit(unitId)?.name ?? unitId} rejoint ta réserve.`);
    }
    case 'healDefeat':
      state.zennys -= effect.price;
      state.defeats -= 1;
      return done('Ton équipe est remise sur pied : une défaite effacée.');
    case 'tradeMaterials': {
      const loose = new Set(looseMaterialIndexes(state));
      const chosen = [...new Set(params.materialIndexes ?? [])];
      if (chosen.length !== effect.materials || !chosen.every((index) => loose.has(index))) {
        return { ok: false, reason: `Choisis ${effect.materials} matériaux de ton inventaire.` };
      }
      for (const index of chosen.sort((a, b) => b - a)) state.inventory.splice(index, 1);
      state.zennys += effect.zennys;
      return done(`Le chercheur te remercie : +${effect.zennys} zennys.`);
    }
    case 'captureGamble': {
      if (state.rng.chance(effect.chance)) {
        const unitId = pickOne(state.rng, captureCandidates(state, effect.cost));
        if (unitId !== undefined && giveCopies(state, unitId, 1).ok) return done(`Capture réussie : ${findUnit(unitId)?.name ?? unitId} rejoint ta réserve au ★1 !`);
      }
      state.nextHuntReinforced = true;
      return done('Le monstre se réveille et s’enfuit en rugissant : ta prochaine chasse sera renforcée.');
    }
    case 'materials': {
      const materials = Array.from({ length: effect.amount }, () => randomMaterial(state));
      state.inventory.push(...materials.map((material) => ({ kind: 'material' as const, material })));
      return done(`Tu récupères : ${materials.map((material) => MATERIALS[material].name).join(', ')}.`);
    }
    case 'zennys':
      state.zennys += effect.amount;
      return done(`+${effect.amount} zennys.`);
    case 'bet':
      state.zennys -= effect.stake;
      if (state.rng.chance(effect.chance)) {
        state.zennys += effect.win;
        return done(`Ton Aptonoth l’emporte : +${effect.win} zennys !`);
      }
      return done(`Ton Aptonoth s’arrête pour brouter : ${effect.stake} zennys perdus.`);
    case 'buyTalent':
      state.zennys -= effect.price;
      openTalentChoice(state, { tier: effect.tier, rerolls: false });
      return done('La stèle s’illumine : un talent de chasseur t’est accordé.');
  }
}
