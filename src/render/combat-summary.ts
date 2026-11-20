import type { CombatEvent, Side } from '../combat/index.ts';
import type { StarRank } from '../data/definitions.ts';

/** Bilan d'une unité sur tout un combat, utile pour repérer les unités trop fortes ou trop faibles. */
export interface UnitSummary {
  readonly uid: number;
  readonly name: string;
  readonly rank: StarRank;
  readonly side: Side;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  shieldingDone: number;
  skillCasts: number;
  /** Tick du K.O., ou null si l'unité a survécu. */
  knockedOutAt: number | null;
}

/**
 * Bilan de chaque unité, en ne comptant que les événements survenus jusqu'à `untilTick`
 * (tout le combat par défaut). Permet d'afficher le bilan en direct pendant le replay.
 */
export function summarizeUnits(events: readonly CombatEvent[], untilTick = Infinity): UnitSummary[] {
  const summaries = new Map<number, UnitSummary>();
  const get = (uid: number): UnitSummary | undefined => summaries.get(uid);

  for (const event of events) {
    if (event.tick > untilTick) break;
    switch (event.type) {
      case 'combatStart':
        for (const unit of event.units) {
          summaries.set(unit.uid, {
            uid: unit.uid,
            name: unit.name,
            rank: unit.rank,
            side: unit.side,
            damageDealt: 0,
            damageTaken: 0,
            healingDone: 0,
            shieldingDone: 0,
            skillCasts: 0,
            knockedOutAt: null,
          });
        }
        break;
      case 'damage': {
        const source = get(event.sourceUid);
        const target = get(event.targetUid);
        if (source !== undefined) source.damageDealt += event.amount;
        if (target !== undefined) target.damageTaken += event.amount;
        break;
      }
      case 'heal': {
        const source = get(event.sourceUid);
        if (source !== undefined) source.healingDone += event.amount;
        break;
      }
      case 'shield': {
        const unit = get(event.uid);
        if (unit !== undefined) unit.shieldingDone += event.amount;
        break;
      }
      case 'skillCast': {
        const unit = get(event.uid);
        if (unit !== undefined) unit.skillCasts += 1;
        break;
      }
      case 'death': {
        const unit = get(event.uid);
        if (unit !== undefined) unit.knockedOutAt = event.tick;
        break;
      }
      default:
        break;
    }
  }
  return [...summaries.values()];
}
