import type { Side } from '../../combat/index.ts';
import { hexKey, type Hex } from '../../core/hex.ts';
import type { StarRank, UnitDefinition } from '../../data/definitions.ts';
import type { BoardScene, SceneUnit } from '../../render/board-canvas.ts';
import type { Frame, FrameUnit } from '../../render/replay.ts';
import type { PortraitStore } from './portraits.ts';
import { shortLabel } from './unit-label.ts';

/**
 * Conversion de l'état affiché (unités posées, image d'un replay) en « scènes » pour le plateau.
 * Partagé par le bac à sable et le mode run.
 */

export interface StaticUnit {
  readonly key: string | number;
  readonly unit: UnitDefinition;
  readonly rank: StarRank;
  readonly side: Side;
  readonly position: Hex;
  readonly selected?: boolean;
}

/** Jeton d'une unité posée, hors combat (PV pleins). */
export function staticUnitScene(placed: StaticUnit, portraits: PortraitStore): SceneUnit {
  return {
    key: placed.key,
    label: shortLabel(placed.unit.name),
    portrait: portraits.get(placed.unit.id),
    side: placed.side,
    element: placed.unit.element,
    cost: placed.unit.cost,
    rank: placed.rank,
    position: placed.position,
    hpRatio: 1,
    alive: true,
    selected: placed.selected === true,
  };
}

/** Unité dessinée sur cette case dans une image de replay (les unités en vie d'abord ; une unité en déplacement compte sur sa case d'arrivée passé la moitié du trajet). */
export function frameUnitAt(frame: Frame, hex: Hex): FrameUnit | undefined {
  const key = hexKey(hex);
  const shownAt = (unit: FrameUnit): string => hexKey(unit.moving !== null && unit.moving.progress >= 0.5 ? unit.moving.to : unit.position);
  const here = frame.units.filter((unit) => shownAt(unit) === key);
  return here.find((unit) => unit.alive) ?? here[0];
}

/** Remplissage de la barre d'énergie d'une unité (0 → 1). */
export function energyRatio(unit: Pick<FrameUnit, 'energy' | 'maxEnergy'>): number {
  return unit.maxEnergy > 0 ? Math.max(0, Math.min(1, unit.energy / unit.maxEnergy)) : 0;
}

/** Scène d'une image de replay : unités, textes flottants, zones d'effet et bandeau de fin. */
export function frameScene(frame: Frame, portraits: PortraitStore): BoardScene {
  const banner =
    frame.winner === undefined ? null : frame.winner === 'player' ? 'Victoire !' : frame.winner === 'enemy' ? 'Défaite' : 'Interrompu';
  return {
    units: frame.units.map((unit) => ({
      key: unit.uid,
      label: shortLabel(unit.name),
      portrait: portraits.get(unit.defId),
      side: unit.side,
      element: unit.element,
      cost: unit.cost,
      rank: unit.rank,
      position: unit.position,
      moving: unit.moving,
      hpRatio: unit.hp / unit.maxHp,
      shieldRatio: unit.shield / unit.maxHp,
      energyRatio: energyRatio(unit),
      energyBlocked: unit.shield > 0 || unit.casting,
      alive: unit.alive,
      casting: unit.casting,
      burning: unit.burning,
      chilled: unit.chilled,
      hasted: unit.hasted,
      poisoned: unit.poisoned,
      paralyzed: unit.paralyzed,
    })),
    texts: frame.texts,
    areas: frame.areas.map((area) => ({
      center: area.center,
      radius: area.radius,
      tone: area.effect,
      element: area.element,
      age: area.age,
    })),
    banner,
    ultimate:
      frame.ultimate === null
        ? null
        : {
            skillName: frame.ultimate.skillName,
            unitName: frame.ultimate.unitName,
            portrait: portraits.get(frame.ultimate.defId),
            side: frame.ultimate.side,
            age: frame.ultimate.age,
          },
  };
}
