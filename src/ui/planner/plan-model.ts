import type { UnitDefinition } from '../../data/definitions.ts';
import { RUN_STRUCTURE } from '../../data/run-balance.ts';
import { findUnit } from '../../data/units/index.ts';
import { BLACK_DRAGON_LIMIT_MESSAGE, exceedsBlackDragonLimit } from '../../rules/board-limits.ts';

/**
 * Plan d'équipe, comme le planificateur de TFT : l'équipe que l'on vise pendant une run.
 * Il sert à voir ses synergies et à repérer ses unités dans la boutique. Il est gardé d'une run à l'autre.
 */

/** ✅ Autant d'unités que la taille maximale du plateau (niveau maximum : 10). */
export const PLAN_CAPACITY = RUN_STRUCTURE.maxLevel;
export const PLAN_FULL_MESSAGE = `Le plan est complet (${PLAN_CAPACITY} unités).`;

const byCostThenName = (a: UnitDefinition, b: UnitDefinition): number => a.cost - b.cost || a.name.localeCompare(b.name);

/**
 * Nettoie une liste d'identifiants (venue du stockage du navigateur) : unités connues seulement, sans doublon,
 * 1 Dragon noir au plus, dans la limite de la capacité. Le résultat est trié par coût puis par nom.
 */
export function sanitizePlan(ids: readonly unknown[]): UnitDefinition[] {
  const units: UnitDefinition[] = [];
  for (const id of ids) {
    const unit = typeof id === 'string' ? findUnit(id) : undefined;
    if (unit === undefined || units.includes(unit) || units.length >= PLAN_CAPACITY) continue;
    if (exceedsBlackDragonLimit([...units, unit])) continue;
    units.push(unit);
  }
  return units.sort(byCostThenName);
}

export class PlanModel {
  private planned: UnitDefinition[];
  private readonly listeners = new Set<() => void>();
  /** Message après un ajout refusé (plan complet, second Dragon noir). */
  notice: string | null = null;

  constructor(initial: readonly unknown[] = []) {
    this.planned = sanitizePlan(initial);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private changed(notice: string | null = null): void {
    this.notice = notice;
    for (const listener of this.listeners) listener();
  }

  /** Unités du plan, triées par coût puis par nom. */
  get units(): readonly UnitDefinition[] {
    return this.planned;
  }

  get unitIds(): string[] {
    return this.planned.map((unit) => unit.id);
  }

  has(unitId: string): boolean {
    return this.planned.some((unit) => unit.id === unitId);
  }

  /** Ajoute l'unité au plan, ou l'en retire si elle y est déjà. */
  toggle(unitId: string): void {
    if (this.has(unitId)) {
      this.planned = this.planned.filter((unit) => unit.id !== unitId);
      this.changed();
      return;
    }
    const unit = findUnit(unitId);
    if (unit === undefined) return;
    if (this.planned.length >= PLAN_CAPACITY) {
      this.changed(PLAN_FULL_MESSAGE);
      return;
    }
    if (exceedsBlackDragonLimit([...this.planned, unit])) {
      this.changed(BLACK_DRAGON_LIMIT_MESSAGE);
      return;
    }
    this.planned = [...this.planned, unit].sort(byCostThenName);
    this.changed();
  }

  clear(): void {
    this.planned = [];
    this.changed();
  }
}
