import { describe, expect, it } from 'vitest';
import { UNITS } from '../../data/units/index.ts';
import { BLACK_DRAGON_LIMIT_MESSAGE } from '../../rules/board-limits.ts';
import { PLAN_CAPACITY, PLAN_FULL_MESSAGE, PlanModel, sanitizePlan } from './plan-model.ts';
import { parseSavedPlan } from './team-plan.ts';

const regularIds = UNITS.filter((unit) => unit.cost < 6).map((unit) => unit.id);

describe('plan d’équipe', () => {
  it('peut contenir 9 unités, la taille maximale du plateau', () => {
    expect(PLAN_CAPACITY).toBe(9);
  });

  it('ajoute une unité, puis la retire au second clic, en prévenant les vues', () => {
    const plan = new PlanModel();
    let changes = 0;
    plan.subscribe(() => (changes += 1));
    plan.toggle('rathalos');
    expect(plan.has('rathalos')).toBe(true);
    plan.toggle('rathalos');
    expect(plan.has('rathalos')).toBe(false);
    expect(changes).toBe(2);
  });

  it('range les unités par coût puis par nom', () => {
    const plan = new PlanModel();
    for (const id of ['teostra', 'rathalos', 'barroth', 'anjanath']) plan.toggle(id);
    const costs = plan.units.map((unit) => unit.cost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
    expect(plan.unitIds[0]).toBe('barroth');
  });

  it('refuse une 10e unité', () => {
    const plan = new PlanModel(regularIds.slice(0, PLAN_CAPACITY));
    expect(plan.units).toHaveLength(PLAN_CAPACITY);
    plan.toggle(regularIds[PLAN_CAPACITY] ?? '');
    expect(plan.units).toHaveLength(PLAN_CAPACITY);
    expect(plan.notice).toBe(PLAN_FULL_MESSAGE);
  });

  it('refuse un second Dragon noir, comme sur le plateau', () => {
    const plan = new PlanModel(['fatalis']);
    plan.toggle('alatreon');
    expect(plan.has('alatreon')).toBe(false);
    expect(plan.notice).toBe(BLACK_DRAGON_LIMIT_MESSAGE);
  });

  it('efface le message après une action acceptée, et se vide entièrement', () => {
    const plan = new PlanModel(['fatalis']);
    plan.toggle('alatreon');
    plan.toggle('rathalos');
    expect(plan.notice).toBeNull();
    plan.clear();
    expect(plan.units).toEqual([]);
  });
});

describe('plan enregistré', () => {
  it('ignore les unités inconnues, les doublons, le second Dragon noir et l’excédent', () => {
    const units = sanitizePlan(['rathalos', 'inconnue', 42, 'rathalos', 'fatalis', 'alatreon', ...regularIds]);
    expect(units).toHaveLength(PLAN_CAPACITY);
    expect(new Set(units).size).toBe(units.length);
    expect(units.filter((unit) => unit.cost === 6).map((unit) => unit.id)).toEqual(['fatalis']);
    expect(units.some((unit) => unit.id === 'rathalos')).toBe(true);
  });

  it('lit une liste enregistrée, et donne un plan vide pour un contenu illisible', () => {
    expect(parseSavedPlan('["rathalos","kirin"]')).toEqual(['rathalos', 'kirin']);
    expect(parseSavedPlan(null)).toEqual([]);
    expect(parseSavedPlan('{pas du json')).toEqual([]);
    expect(parseSavedPlan('{"a":1}')).toEqual([]);
  });
});
