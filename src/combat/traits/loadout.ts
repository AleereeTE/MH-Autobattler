import type { StatBonus, TraitId, UnitDefinition } from '../../data/definitions.ts';
import type { Equipment } from '../../data/items.ts';
import type { TraitTier } from '../../data/traits.ts';
import { countObjects } from '../../rules/equipment.ts';
import { scaleBonus } from '../../rules/stats.ts';
import { unitTraitIds } from '../../rules/traits.ts';
import { secondsToTicks } from '../constants.ts';
import type { LightningState, OnHitEffects } from '../state.ts';

export interface TraitLoadout {
  /** Bonus de statistiques que les traits actifs donnent à cette unité. */
  readonly bonuses: readonly StatBonus[];
  /** Effets que ses coups appliqueront (brûlure, ralentissement). */
  readonly onHit: OnHitEffects;
}

/** Ce que les traits actifs de son camp apportent à une unité membre de ces traits. */
export function traitLoadout(
  unit: UnitDefinition,
  equipment: Equipment,
  active: ReadonlyMap<TraitId, TraitTier>,
): TraitLoadout {
  const bonuses: StatBonus[] = [];
  let onHit: OnHitEffects = {};

  for (const id of unitTraitIds(unit)) {
    const effect = active.get(id)?.effect;
    if (effect === undefined) continue;
    switch (effect.kind) {
      case 'statBonus':
        bonuses.push(effect.bonus);
        break;
      case 'perObjectBonus':
        bonuses.push(scaleBonus(effect.bonus, countObjects(equipment)));
        break;
      case 'burn':
        onHit = { ...onHit, burn: { damagePerSecond: effect.damagePerSecond, durationTicks: secondsToTicks(effect.duration) } };
        break;
      case 'chill':
        onHit = {
          ...onHit,
          chill: { attackSpeedPercent: effect.attackSpeedPercent, durationTicks: secondsToTicks(effect.duration) },
        };
        break;
      case 'lightning':
        break; // effet de camp : voir lightningFor
    }
  }
  return { bonuses, onHit };
}

/** Éclairs du trait Foudre si ce camp l'a activé, sinon null. */
export function lightningFor(active: ReadonlyMap<TraitId, TraitTier>): LightningState | null {
  for (const tier of active.values()) {
    if (tier.effect.kind === 'lightning') {
      const intervalTicks = secondsToTicks(tier.effect.interval);
      return { damage: tier.effect.damage, intervalTicks, ticksUntilStrike: intervalTicks };
    }
  }
  return null;
}
