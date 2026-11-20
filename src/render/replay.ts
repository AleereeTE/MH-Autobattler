import type { CombatEvent, Side, SkillEffectKind, UnitSnapshot, Winner } from '../combat/index.ts';
import type { Hex } from '../core/hex.ts';
import type { Element, StarRank, UnitCost } from '../data/definitions.ts';

/**
 * Reconstitue l'état visible du combat à n'importe quel instant, à partir des seuls événements.
 * C'est ce qui permet au rendu de rejouer un combat déjà simulé, à la vitesse voulue.
 */

export interface FrameUnit {
  readonly uid: number;
  /** Identifiant de la fiche (« barroth »), utile pour retrouver le portrait. */
  readonly defId: string;
  readonly name: string;
  readonly side: Side;
  readonly element: Element | null;
  readonly cost: UnitCost;
  readonly rank: StarRank;
  readonly maxHp: number;
  position: Hex;
  /** Déplacement en cours : case d'arrivée et avancement (0 → 1). */
  moving: { readonly to: Hex; readonly progress: number } | null;
  hp: number;
  alive: boolean;
  casting: boolean;
  shield: number;
  burning: boolean;
  chilled: boolean;
  hasted: boolean;
}

export interface FloatingText {
  readonly uid: number;
  readonly text: string;
  readonly kind: 'damage' | 'crit' | 'heal' | 'skill' | 'dodge';
  /** 0 = vient d'apparaître, 1 = va disparaître. */
  readonly age: number;
}

/** Zone d'effet d'une compétence en train d'être animée. */
export interface FrameArea {
  /** Lanceur de la compétence. */
  readonly uid: number;
  readonly side: Side;
  readonly element: Element | null;
  readonly effect: SkillEffectKind;
  readonly center: Hex;
  readonly radius: number;
  /** 0 = la compétence vient de prendre effet, 1 = l'animation se termine. */
  readonly age: number;
}

export interface Frame {
  readonly tick: number;
  readonly units: readonly FrameUnit[];
  readonly texts: readonly FloatingText[];
  readonly areas: readonly FrameArea[];
  readonly suddenDeath: boolean;
  readonly winner: Winner | undefined;
}

export interface Replay {
  readonly durationTicks: number;
  frameAt(tick: number): Frame;
}

const TEXT_LIFETIME_TICKS = 16;
/** Durée d'affichage d'une zone d'effet (0,7 s à vitesse normale). */
export const AREA_LIFETIME_TICKS = 14;

interface Tracker {
  unit: FrameUnit;
  move: { from: Hex; to: Hex; start: number; duration: number } | null;
  castingUntil: number;
  shieldUntil: number;
  burningUntil: number;
  chilledUntil: number;
  hastedUntil: number;
}

function createTracker(snapshot: UnitSnapshot): Tracker {
  return {
    unit: {
      uid: snapshot.uid,
      defId: snapshot.defId,
      name: snapshot.name,
      side: snapshot.side,
      element: snapshot.element,
      cost: snapshot.cost,
      rank: snapshot.rank,
      maxHp: snapshot.maxHp,
      position: snapshot.position,
      moving: null,
      hp: snapshot.maxHp,
      alive: true,
      casting: false,
      shield: 0,
      burning: false,
      chilled: false,
      hasted: false,
    },
    move: null,
    castingUntil: -1,
    shieldUntil: -1,
    burningUntil: -1,
    chilledUntil: -1,
    hastedUntil: -1,
  };
}

export function createReplay(events: readonly CombatEvent[]): Replay {
  const last = events.at(-1);
  const durationTicks = last?.tick ?? 0;

  function frameAt(tick: number): Frame {
    const trackers = new Map<number, Tracker>();
    const texts: FloatingText[] = [];
    const areas: FrameArea[] = [];
    let suddenDeath = false;
    let winner: Winner | undefined;

    for (const event of events) {
      if (event.tick > tick) break;
      const tracker = 'uid' in event ? trackers.get(event.uid) : undefined;
      const age = (tick - event.tick) / TEXT_LIFETIME_TICKS;

      switch (event.type) {
        case 'combatStart':
          for (const snapshot of event.units) trackers.set(snapshot.uid, createTracker(snapshot));
          break;
        case 'move':
          if (tracker !== undefined) {
            tracker.unit.position = event.from;
            tracker.move = { from: event.from, to: event.to, start: event.tick, duration: event.durationTicks };
          }
          break;
        case 'leap':
          if (tracker !== undefined) {
            tracker.unit.position = event.to;
            tracker.move = null;
          }
          break;
        case 'damage': {
          const target = trackers.get(event.targetUid);
          if (target !== undefined) {
            target.unit.hp = event.hpAfter;
            target.unit.shield = Math.max(0, target.unit.shield - event.absorbed);
            if (age < 1) {
              texts.push({ uid: event.targetUid, text: String(Math.round(event.amount)), kind: event.isCrit ? 'crit' : 'damage', age });
            }
          }
          break;
        }
        case 'heal': {
          const target = trackers.get(event.targetUid);
          if (target !== undefined) {
            target.unit.hp = event.hpAfter;
            if (age < 1 && event.amount > 0) texts.push({ uid: event.targetUid, text: `+${Math.round(event.amount)}`, kind: 'heal', age });
          }
          break;
        }
        case 'shield':
          if (tracker !== undefined) {
            tracker.unit.shield += event.amount;
            tracker.shieldUntil = Math.max(tracker.shieldUntil, event.tick + event.durationTicks);
          }
          break;
        case 'status':
          if (tracker !== undefined) {
            const until = event.tick + event.durationTicks;
            if (event.status === 'burn') tracker.burningUntil = until;
            if (event.status === 'chill') tracker.chilledUntil = Math.max(tracker.chilledUntil, until);
            if (event.status === 'haste') tracker.hastedUntil = until;
          }
          break;
        case 'dodge':
          if (age < 1 && trackers.has(event.targetUid)) texts.push({ uid: event.targetUid, text: 'Esquive', kind: 'dodge', age });
          break;
        case 'skillCast':
          if (tracker !== undefined) {
            tracker.castingUntil = event.tick + event.castTicks;
            if (age < 1.5) texts.push({ uid: event.uid, text: event.skillName, kind: 'skill', age: age / 1.5 });
          }
          break;
        case 'skillArea': {
          const areaAge = (tick - event.tick) / AREA_LIFETIME_TICKS;
          if (tracker !== undefined && areaAge < 1) {
            const { side, element } = tracker.unit;
            const { uid, effect, center, radius } = event;
            areas.push({ uid, side, element, effect, center, radius, age: areaAge });
          }
          break;
        }
        case 'death':
          if (tracker !== undefined) {
            tracker.unit.alive = false;
            tracker.unit.hp = 0;
          }
          break;
        case 'suddenDeath':
          suddenDeath = true;
          break;
        case 'combatEnd':
          winner = event.winner;
          break;
        default:
          break;
      }
    }

    for (const tracker of trackers.values()) finalize(tracker, tick);
    return { tick, units: [...trackers.values()].map((tracker) => tracker.unit), texts, areas, suddenDeath, winner };
  }

  return { durationTicks, frameAt };
}

/** Calcule les états qui dépendent du temps écoulé (déplacement, effets temporaires). */
function finalize(tracker: Tracker, tick: number): void {
  const { unit, move } = tracker;
  if (move !== null) {
    const progress = move.duration <= 0 ? 1 : (tick - move.start) / move.duration;
    if (progress >= 1) unit.position = move.to;
    unit.moving = progress >= 1 ? null : { to: move.to, progress };
  }
  unit.casting = unit.alive && tick < tracker.castingUntil;
  if (tick >= tracker.shieldUntil) unit.shield = 0;
  unit.burning = unit.alive && tick < tracker.burningUntil;
  unit.chilled = unit.alive && tick < tracker.chilledUntil;
  unit.hasted = unit.alive && tick < tracker.hastedUntil;
}
