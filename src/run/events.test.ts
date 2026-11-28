import { describe, expect, it } from 'vitest';
import { EVENTS } from '../data/events.ts';
import { MAP } from '../data/run-balance.ts';
import { findUnit } from '../data/units/index.ts';
import { bench, board, findNode, giveUnit, makeRun, placeOnNode } from '../test-utils/run.ts';
import { chooseEvent, combatSetup, applyCombatResult, startRound, leaveNode } from './flow.ts';
import { chooseTalent } from './talents.ts';
import { currentNode, generateStageMap } from './map.ts';
import { createRng } from '../core/rng.ts';
import { copiesForRank } from './economy.ts';
import { restoreRun, serializeRun } from './save.ts';
import type { RunState } from './state.ts';

/** Run posée sur la première case Événement de la carte, avec l'événement demandé. */
function atEvent(eventId: string, zennys = 50): RunState {
  const state = makeRun({ zennys });
  const node = findNode(state, 'event');
  if (node === null) throw new Error('pas de case Événement sur la carte');
  placeOnNode(state, node.step, node.index);
  state.zennys = zennys;
  state.event = { eventId, result: null };
  return state;
}

const choiceIndex = (eventId: string, label: string): number => EVENTS.find((event) => event.id === eventId)?.choices.findIndex((choice) => choice.label === label) ?? -1;

const squadValue = (squad: ReadonlyArray<RunState['enemy'][number]>) => squad.reduce((sum, placement) => sum + placement.unit.cost * copiesForRank(placement.rank ?? 1), 0);

describe('cases Événement sur la carte', () => {
  it('1 à 2 par stage, entre les étapes 2 et 8', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const map = generateStageMap(1 + (seed % 3), createRng(seed));
      const events = map.steps.flat().filter((node) => node.kind === 'event');
      expect(events.length).toBeGreaterThanOrEqual(MAP.events[0]);
      expect(events.length).toBeLessThanOrEqual(MAP.events[1]);
      for (const node of events) {
        expect(node.step).toBeGreaterThanOrEqual(2);
        expect(node.step).toBeLessThanOrEqual(MAP.eventsToStep);
        expect(node.squad).toEqual([]);
      }
    }
  });

  it('en arrivant, un événement pas encore rencontré est tiré ; ils reviennent une fois tous vus', () => {
    const state = makeRun();
    const node = findNode(state, 'event');
    if (node === null) throw new Error('pas de case Événement');
    placeOnNode(state, node.step, node.index);
    expect(state.event).toMatchObject({ result: null });
    expect(state.seenEvents).toEqual([state.event?.eventId]);

    state.seenEvents = EVENTS.slice(1).map((event) => event.id);
    startRound(state);
    expect(state.event?.eventId).toBe(EVENTS[0]?.id);
    startRound(state);
    expect(state.seenEvents).toHaveLength(1);
  });

  it('un choix « partir » reprend tout de suite la route', () => {
    const state = atEvent('felyne-box');
    const hunt = state.hunt;
    expect(chooseEvent(state, choiceIndex('felyne-box', 'Partir')).ok).toBe(true);
    expect(state).toMatchObject({ phase: 'map', hunt: hunt + 1, event: null });
  });

  it('refuse un choix trop cher, puis on reprend la route après le compte rendu', () => {
    const poor = atEvent('guild-doctor', 3);
    poor.defeats = 1;
    expect(chooseEvent(poor, 0)).toMatchObject({ ok: false });
    const state = atEvent('overturned-caravan');
    expect(chooseEvent(state, choiceIndex('overturned-caravan', 'Escorter les marchands')).ok).toBe(true);
    expect(state.zennys).toBe(58);
    expect(state.event?.result).toEqual(['+8 zennys.']);
    expect(chooseEvent(state, 0)).toMatchObject({ ok: false }); // un seul choix par événement
    expect(leaveNode(state).ok).toBe(true);
  });
});

describe('effets des événements', () => {
  it('Boîte du Felyne : 5 zennys pour un objet ou un matériau', () => {
    const state = atEvent('felyne-box');
    chooseEvent(state, 0);
    expect(state.zennys).toBe(45);
    expect(state.inventory).toHaveLength(1);
  });

  it('Œuf de wyverne : +12 zennys, puis la prochaine chasse est renforcée comme une quête urgente', () => {
    const state = atEvent('wyvern-egg', 0);
    chooseEvent(state, 0);
    expect(state).toMatchObject({ zennys: 12, nextHuntReinforced: true });
    leaveNode(state);
    // On se place sur une chasse normale de l'étape suivante : son escouade est tirée de nouveau, plus forte.
    const step = state.path.length + 1;
    const huntIndex = state.map.steps[step - 1]?.findIndex((node) => node.kind === 'hunt') ?? 0;
    placeOnNode(state, step, huntIndex);
    expect(state.nextHuntReinforced).toBe(false);
    expect(state.enemy).not.toEqual(currentNode(state)?.squad);
    expect(squadValue(state.enemy)).toBeGreaterThanOrEqual(squadValue(currentNode(state)?.squad ?? []));
  });

  it('un boss n’est jamais renforcé : le renforcement attend la chasse suivante', () => {
    const state = makeRun();
    state.nextHuntReinforced = true;
    placeOnNode(state, 10, 0);
    expect(state.nextHuntReinforced).toBe(true);
    expect(state.enemy).toEqual(currentNode(state)?.squad);
  });

  it('Chasseur blessé : 3 zennys, un chasseur ★1 rejoint la réserve', () => {
    const state = atEvent('wounded-hunter');
    chooseEvent(state, 0);
    expect(state.zennys).toBe(47);
    expect(state.units).toHaveLength(1);
    expect(findUnit(state.units[0]?.unitId ?? '')?.kind).toBe('hunter');
    expect(state.units[0]).toMatchObject({ rank: 1, location: { area: 'bench' } });
  });

  it('Cantine, repas : +20 % de PV pour toute l’équipe au prochain combat seulement', () => {
    const state = atEvent('camp-canteen');
    giveUnit(state, 'rathalos', board(3, 5));
    chooseEvent(state, choiceIndex('camp-canteen', 'Repas de chasse'));
    expect(combatSetup(state).player[0]?.bonus?.hpPercent).toBeCloseTo(0.2);
    applyCombatResult(state, 'player');
    expect(state.nextCombatBonus).toBeNull();
    expect(combatSetup(state).player[0]?.bonus).toBeUndefined();
  });

  it('Cantine, entraînement : un exemplaire de plus d’une unité possédée, au choix', () => {
    const empty = atEvent('camp-canteen');
    const training = choiceIndex('camp-canteen', 'Entraînement');
    expect(chooseEvent(empty, training, { unitId: 'rathalos' })).toMatchObject({ ok: false });

    const state = atEvent('camp-canteen');
    giveUnit(state, 'rathalos', bench(0));
    giveUnit(state, 'rathalos', bench(1));
    const stock = state.pool.get('rathalos') ?? 0;
    expect(chooseEvent(state, training, { unitId: 'khezu' })).toMatchObject({ ok: false });
    expect(chooseEvent(state, training, { unitId: 'rathalos' }).ok).toBe(true);
    expect(state.units.filter((unit) => unit.unitId === 'rathalos')).toMatchObject([{ rank: 2 }]);
    expect(state.pool.get('rathalos')).toBe(stock - 1);
  });

  it('Médecin de la Guilde : 15 zennys pour effacer une défaite, seulement s’il y en a une', () => {
    const none = atEvent('guild-doctor');
    expect(chooseEvent(none, 0)).toMatchObject({ ok: false });
    const state = atEvent('guild-doctor');
    state.defeats = 2;
    chooseEvent(state, 0);
    expect(state).toMatchObject({ defeats: 1, zennys: 35 });
  });

  it('Commission de recherche : 2 matériaux choisis de l’inventaire contre 12 zennys', () => {
    const state = atEvent('research-commission', 0);
    state.inventory = [
      { kind: 'material', material: 'bone' },
      { kind: 'object', materials: ['gem', 'gem'] },
      { kind: 'material', material: 'fang' },
      { kind: 'material', material: 'horn' },
    ];
    expect(chooseEvent(state, 0, { materialIndexes: [0, 1] })).toMatchObject({ ok: false }); // un objet n'est pas un matériau
    expect(chooseEvent(state, 0, { materialIndexes: [0] })).toMatchObject({ ok: false });
    expect(chooseEvent(state, 0, { materialIndexes: [0, 3] }).ok).toBe(true);
    expect(state.zennys).toBe(12);
    expect(state.inventory).toEqual([
      { kind: 'object', materials: ['gem', 'gem'] },
      { kind: 'material', material: 'fang' },
    ]);
  });

  it('Monstre endormi : capture d’un monstre de coût 3 (60 %), sinon prochaine chasse renforcée', () => {
    let captured = 0;
    let woken = 0;
    for (let seed = 0; seed < 60; seed++) {
      const state = atEvent('sleeping-monster');
      Object.assign(state, { rng: createRng(seed) });
      chooseEvent(state, choiceIndex('sleeping-monster', 'Tenter la capture'));
      const unit = state.units[0];
      if (unit !== undefined) {
        captured += 1;
        expect(findUnit(unit.unitId)).toMatchObject({ kind: 'monster', cost: 3 });
        expect(state.nextHuntReinforced).toBe(false);
      } else {
        woken += 1;
        expect(state.nextHuntReinforced).toBe(true);
      }
    }
    expect(captured).toBeGreaterThan(woken);
    expect(woken).toBeGreaterThan(0);
    const careful = atEvent('sleeping-monster');
    chooseEvent(careful, choiceIndex('sleeping-monster', 'Prélever un matériau en douce'));
    expect(careful.inventory).toHaveLength(1);
  });

  it('Caravane renversée : 2 matériaux, ou 8 zennys', () => {
    const state = atEvent('overturned-caravan');
    chooseEvent(state, choiceIndex('overturned-caravan', 'Fouiller l’épave'));
    expect(state.inventory).toHaveLength(2);
  });

  it('Pari des Felynes : on perd la mise ou on gagne 12 zennys', () => {
    const outcomes = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const state = atEvent('felyne-bet', 10);
      Object.assign(state, { rng: createRng(seed) });
      chooseEvent(state, 0);
      outcomes.add(state.zennys);
    }
    expect([...outcomes].sort((a, b) => a - b)).toEqual([5, 17]);
  });

  it('Stèle ancienne : 10 zennys, un talent argent au choix sans relance, puis retour sur la case', () => {
    const state = atEvent('ancient-stele');
    chooseEvent(state, 0);
    expect(state).toMatchObject({ zennys: 40, phase: 'talent', talentChoice: { tier: 'silver' } });
    expect(state.talentChoice?.offers.every((offer) => offer.rerolled)).toBe(true);
    expect(chooseTalent(state, 0).ok).toBe(true);
    expect(state.talents).toHaveLength(1);
    expect(state.phase).toBe('prep');
    expect(state.event?.result).not.toBeNull();
    expect(leaveNode(state).ok).toBe(true);
  });

  it('la sauvegarde garde l’événement en cours et ses effets en attente', () => {
    const state = atEvent('wyvern-egg');
    chooseEvent(state, 0);
    const copy = restoreRun(serializeRun(state));
    expect(copy).toMatchObject({ event: state.event, seenEvents: state.seenEvents, nextHuntReinforced: true, nextCombatBonus: null });
  });
});
