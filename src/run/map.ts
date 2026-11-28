import type { Placement } from '../combat/index.ts';
import { pickOne, randomInt } from '../core/random.ts';
import type { Rng } from '../core/rng.ts';
import { MAP, RUN_STRUCTURE, URGENT_QUEST } from '../data/run-balance.ts';
import { copiesForRank } from './economy.ts';
import { generateSquad } from './enemies.ts';
import type { RunState } from './state.ts';

/**
 * Carte d'un stage (game-design §2.1), façon Slay the Spire : 9 étapes de 2 à 3 cases reliées par des chemins,
 * puis le boss. On avance d'une étape à la fois en suivant un chemin.
 */

export type MapNodeKind = 'hunt' | 'urgent' | 'forge' | 'merchant' | 'event' | 'boss';

export interface MapNode {
  /** Étape dans le stage, de 1 à 10 (10 = boss). */
  readonly step: number;
  /** Position de la case dans son étape (de haut en bas). */
  readonly index: number;
  readonly kind: MapNodeKind;
  /** Cases de l'étape suivante reliées à celle-ci (leurs positions). */
  readonly next: readonly number[];
  /** Escouade d'une case de combat, générée avec la carte pour pouvoir montrer le monstre cible ; vide sinon. */
  readonly squad: readonly Placement[];
}

export interface StageMap {
  readonly stage: number;
  /** Les étapes 1 à 10 : `steps[0]` est l'étape 1, `steps[9]` le boss. */
  readonly steps: readonly (readonly MapNode[])[];
}

/** Cases où l'on combat (et où la boutique sert à préparer le combat). */
export function isCombatNode(kind: MapNodeKind): boolean {
  return kind === 'hunt' || kind === 'urgent' || kind === 'boss';
}

/** Un nombre au hasard entre les deux bornes (comprises). */
function between(rng: Rng, [min, max]: readonly [number, number]): number {
  return min + randomInt(rng, max - min + 1);
}

/**
 * Chemins entre deux étapes, sans croisement : on part des deux premières cases et on descend
 * d'une case d'un côté, de l'autre ou des deux à la fois. Chaque case a ainsi au moins un chemin
 * vers l'étape suivante, et chaque case de l'étape suivante au moins un chemin qui y arrive.
 */
function connect(rng: Rng, from: number, to: number): number[][] {
  const next = Array.from({ length: from }, () => [] as number[]);
  let i = 0;
  let j = 0;
  next[0]?.push(0);
  while (i < from - 1 || j < to - 1) {
    const move = i === from - 1 ? 'down' : j === to - 1 ? 'up' : (pickOne(rng, ['up', 'down', 'both'] as const) ?? 'both');
    if (move !== 'down') i += 1;
    if (move !== 'up') j += 1;
    next[i]?.push(j);
  }
  addBranches(rng, next, to);
  return next;
}

/**
 * ⚠️ Chance d'ajouter un chemin vers une case voisine, pour offrir plus souvent un vrai choix.
 * Sans croisement, deux étapes ne peuvent pas être toutes reliées entre elles : on plafonne autour
 * de 1,6 chemin par case en moyenne (contre 1,4 sans embranchements).
 */
const BRANCH_CHANCE = 0.8;

/**
 * Ajoute des embranchements : une case peut aussi mener à la case voisine de sa destination,
 * si ce nouveau chemin ne croise aucun autre (les cases au-dessus restent reliées plus haut ou au même niveau).
 */
function addBranches(rng: Rng, next: number[][], to: number): void {
  const crosses = (from: number, target: number) =>
    next.some((targets, other) => other !== from && targets.some((existing) => (other < from ? existing > target : existing < target)));
  next.forEach((targets, from) => {
    for (const target of [Math.min(...targets) - 1, Math.max(...targets) + 1]) {
      if (target < 0 || target >= to || crosses(from, target) || !rng.chance(BRANCH_CHANCE)) continue;
      targets.push(target);
      targets.sort((a, b) => a - b);
    }
  });
}

/** Place les cases spéciales sur des chasses normales, sans retirer la dernière chasse normale d'une étape. */
function placeSpecials(rng: Rng, kinds: MapNodeKind[][], kind: MapNodeKind, count: number, fromStep: number, toStep: number = MAP.stepsBeforeBoss): void {
  for (let placed = 0; placed < count; placed++) {
    const slots: [number, number][] = [];
    for (let step = fromStep; step <= toStep; step++) {
      const row = kinds[step - 1] ?? [];
      const hunts = row.filter((candidate) => candidate === 'hunt').length;
      if (hunts < 2 || row.includes(kind)) continue;
      row.forEach((candidate, index) => {
        if (candidate === 'hunt') slots.push([step, index]);
      });
    }
    const slot = pickOne(rng, slots);
    if (slot === undefined) return;
    const row = kinds[slot[0] - 1];
    if (row !== undefined) row[slot[1]] = kind;
  }
}

/** Numéro de la chasse (1 à 30) qui correspond à une étape d'un stage. */
export function huntNumber(stage: number, step: number): number {
  return (stage - 1) * RUN_STRUCTURE.huntsPerStage + step;
}

/** Génère la carte d'un stage, escouades des cases de combat comprises. */
export function generateStageMap(stage: number, rng: Rng): StageMap {
  const sizes = Array.from({ length: MAP.stepsBeforeBoss }, () => MAP.minNodesPerStep + randomInt(rng, MAP.maxNodesPerStep - MAP.minNodesPerStep + 1));
  const kinds: MapNodeKind[][] = sizes.map((size) => Array.from({ length: size }, () => 'hunt' as MapNodeKind));

  let forges = between(rng, MAP.forges);
  let merchants = between(rng, MAP.merchants);
  const urgent = between(rng, MAP.urgentQuests);
  const events = between(rng, MAP.events);

  // ✅ L'étape 9 (juste avant le boss) propose toujours une forge ou un marchand.
  const beforeBoss: MapNodeKind = rng.chance(0.5) ? 'forge' : 'merchant';
  const lastRow = kinds[MAP.stepsBeforeBoss - 1];
  if (lastRow !== undefined) lastRow[randomInt(rng, lastRow.length)] = beforeBoss;
  if (beforeBoss === 'forge') forges -= 1;
  else merchants -= 1;

  // Les quêtes urgentes d'abord (ce sont elles qui ont le moins d'étapes possibles), puis forges et marchands.
  placeSpecials(rng, kinds, 'urgent', urgent, MAP.urgentFromStep);
  placeSpecials(rng, kinds, 'forge', forges, 2);
  placeSpecials(rng, kinds, 'merchant', merchants, 2);
  placeSpecials(rng, kinds, 'event', events, 2, MAP.eventsToStep);

  const steps: MapNode[][] = kinds.map((row, rowIndex) => {
    const step = rowIndex + 1;
    const nextSize = sizes[rowIndex + 1] ?? 1;
    const links = step === MAP.stepsBeforeBoss ? row.map(() => [0]) : connect(rng, row.length, nextSize);
    return row.map((kind, index) => {
      const hunt = huntNumber(stage, step);
      const squad = kind === 'hunt' ? generateSquad(hunt, rng) : kind === 'urgent' ? generateSquad(hunt, rng, URGENT_QUEST.extraHunts) : [];
      return { step, index, kind, next: links[index] ?? [], squad };
    });
  });
  const bossStep = MAP.stepsBeforeBoss + 1;
  steps.push([{ step: bossStep, index: 0, kind: 'boss', next: [], squad: generateSquad(huntNumber(stage, bossStep), rng) }]);
  return { stage, steps };
}

/** Case où se trouve le joueur, ou null au début d'un stage (aucune case choisie). */
export function currentNode(state: RunState): MapNode | null {
  const index = state.path.at(-1);
  if (index === undefined) return null;
  return state.map.steps[state.path.length - 1]?.[index] ?? null;
}

/** Cases que l'on peut choisir pour l'étape suivante : toute l'étape 1 au début du stage, sinon les cases reliées. */
export function reachableNodes(state: RunState): MapNode[] {
  const current = currentNode(state);
  const nextStep = state.map.steps[state.path.length];
  if (nextStep === undefined) return [];
  if (current === null) return [...nextStep];
  return current.next.flatMap((index) => nextStep[index] ?? []);
}

/** Cases encore accessibles depuis la position actuelle, en suivant les chemins (pour griser les autres). */
export function accessibleNodes(state: RunState): Set<MapNode> {
  const accessible = new Set<MapNode>();
  let frontier = reachableNodes(state);
  while (frontier.length > 0) {
    for (const node of frontier) accessible.add(node);
    frontier = frontier.flatMap((node) => node.next.flatMap((index) => state.map.steps[node.step]?.[index] ?? []));
  }
  return accessible;
}

/** Monstre cible d'une escouade : le plus fort (coût × exemplaires selon le rang, puis le coût). */
export function targetMonster(squad: readonly Placement[]): Placement | null {
  let best: Placement | null = null;
  const value = (placement: Placement) => placement.unit.cost * copiesForRank(placement.rank ?? 1);
  for (const placement of squad) {
    if (best === null || value(placement) > value(best) || (value(placement) === value(best) && placement.unit.cost > best.unit.cost)) {
      best = placement;
    }
  }
  return best;
}
