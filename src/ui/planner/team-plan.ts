import { PlanModel } from './plan-model.ts';

/**
 * Le plan d'équipe du joueur, unique et gardé dans le navigateur d'une run à l'autre (et après un rechargement).
 * Le stockage peut être indisponible (navigation privée…) : le plan marche alors, mais n'est pas mémorisé.
 */

const STORAGE_KEY = 'mh-autobattler:plan';

/** Lit les identifiants enregistrés ; tout contenu illisible donne un plan vide. */
export function parseSavedPlan(raw: string | null): unknown[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function load(): unknown[] {
  try {
    return parseSavedPlan(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function save(plan: PlanModel): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan.unitIds));
  } catch {
    // Stockage indisponible : le plan ne sera simplement pas mémorisé.
  }
}

let plan: PlanModel | null = null;

/** Le plan d'équipe (créé au premier appel à partir de ce qui est enregistré). */
export function teamPlan(): PlanModel {
  if (plan === null) {
    const created = new PlanModel(load());
    created.subscribe(() => save(created));
    plan = created;
  }
  return plan;
}
