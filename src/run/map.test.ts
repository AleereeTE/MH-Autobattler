import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng.ts';
import { ENEMY_BUDGET, MAP } from '../data/run-balance.ts';
import { makeUnit, place } from '../test-utils/factories.ts';
import { createRun } from './flow.ts';
import { accessibleNodes, generateStageMap, isCombatNode, reachableNodes, targetMonster, type MapNodeKind, type StageMap } from './map.ts';

const maps: StageMap[] = [];
for (let seed = 1; seed <= 60; seed++) maps.push(generateStageMap(1 + (seed % 3), createRng(seed)));

const count = (map: StageMap, kind: MapNodeKind) => map.steps.flat().filter((node) => node.kind === kind).length;

describe('carte d’un stage', () => {
  it('a 9 étapes de 2 à 3 cases, puis le boss seul à l’étape 10', () => {
    for (const map of maps) {
      expect(map.steps).toHaveLength(10);
      map.steps.slice(0, 9).forEach((row, index) => {
        expect(row.length).toBeGreaterThanOrEqual(MAP.minNodesPerStep);
        expect(row.length).toBeLessThanOrEqual(MAP.maxNodesPerStep);
        row.forEach((node, position) => expect(node).toMatchObject({ step: index + 1, index: position }));
      });
      expect(map.steps[9]?.map((node) => node.kind)).toEqual(['boss']);
    }
  });

  it('respecte le nombre de cases spéciales par stage', () => {
    for (const map of maps) {
      expect(count(map, 'forge')).toBeGreaterThanOrEqual(MAP.forges[0]);
      expect(count(map, 'forge')).toBeLessThanOrEqual(MAP.forges[1]);
      expect(count(map, 'merchant')).toBeGreaterThanOrEqual(MAP.merchants[0]);
      expect(count(map, 'merchant')).toBeLessThanOrEqual(MAP.merchants[1]);
      expect(count(map, 'urgent')).toBeGreaterThanOrEqual(MAP.urgentQuests[0]);
      expect(count(map, 'urgent')).toBeLessThanOrEqual(MAP.urgentQuests[1]);
    }
  });

  it('étape 1 : que des chasses · chaque étape garde une chasse normale · étape 9 : une forge ou un marchand', () => {
    for (const map of maps) {
      expect(map.steps[0]?.every((node) => node.kind === 'hunt')).toBe(true);
      map.steps.slice(0, 9).forEach((row) => expect(row.some((node) => node.kind === 'hunt')).toBe(true));
      expect(map.steps[8]?.some((node) => node.kind === 'forge' || node.kind === 'merchant')).toBe(true);
      map.steps.slice(0, MAP.urgentFromStep - 1).forEach((row) => expect(row.some((node) => node.kind === 'urgent')).toBe(false));
    }
  });

  it('relie toutes les cases, sans chemins qui se croisent, jusqu’au boss', () => {
    for (const map of maps) {
      for (let step = 0; step < 9; step++) {
        const row = map.steps[step] ?? [];
        const nextRow = map.steps[step + 1] ?? [];
        const edges = row.flatMap((node) => node.next.map((target) => [node.index, target] as const));
        row.forEach((node) => expect(node.next.length).toBeGreaterThan(0));
        nextRow.forEach((node) => expect(edges.some(([, target]) => target === node.index)).toBe(true));
        edges.forEach(([target]) => expect(target).toBeLessThan(row.length));
        edges.forEach(([, target]) => expect(target).toBeLessThan(nextRow.length));
        // Pas de croisement : si une case est plus haute qu'une autre, ses chemins n'arrivent pas plus bas.
        for (const [a, b] of edges) for (const [c, d] of edges) if (a < c) expect(b).toBeLessThanOrEqual(d);
      }
    }
  });

  it('offre souvent un vrai choix : plusieurs cases ont deux chemins vers l’étape suivante', () => {
    const nodes = maps.flatMap((map) => map.steps.slice(0, 8).flat());
    const exits = nodes.reduce((sum, node) => sum + node.next.length, 0) / nodes.length;
    expect(exits).toBeGreaterThan(1.5);
  });

  it('donne une escouade aux cases de combat seulement, dans les limites du stage', () => {
    for (const map of maps) {
      const maxCost = ENEMY_BUDGET.maxCostByStage[map.stage - 1] ?? 4;
      for (const node of map.steps.flat()) {
        expect(node.squad.length > 0, `${node.kind} étape ${node.step}`).toBe(isCombatNode(node.kind));
        if (node.kind === 'hunt' || node.kind === 'urgent') node.squad.forEach((placement) => expect(placement.unit.cost).toBeLessThanOrEqual(maxCost));
      }
    }
  });

  it('est reproductible avec la même graine', () => {
    const kinds = (seed: number) => generateStageMap(2, createRng(seed)).steps.map((row) => row.map((node) => `${node.kind}${node.next.join('')}`));
    expect(kinds(9)).toEqual(kinds(9));
  });
});

describe('position sur la carte', () => {
  it('au début du stage, toute l’étape 1 est accessible ; ensuite, seulement les cases reliées', () => {
    const state = createRun(3);
    expect(reachableNodes(state)).toEqual(state.map.steps[0]);
    state.path = [0];
    const first = state.map.steps[0]?.[0];
    expect(reachableNodes(state).map((node) => node.index)).toEqual(first?.next);
  });

  it('liste les cases encore accessibles en suivant les chemins, jusqu’au boss', () => {
    const state = createRun(3);
    state.path = [0];
    const accessible = accessibleNodes(state);
    expect([...accessible].some((node) => node.kind === 'boss')).toBe(true);
    expect(accessible.has(state.map.steps[0]?.[1] ?? state.map.steps[0]![0]!)).toBe(false);
  });
});

describe('monstre cible', () => {
  it('est le plus fort de l’escouade (coût × exemplaires, puis le coût)', () => {
    const squad = [
      { ...place(makeUnit({ id: 'a', cost: 2 }), 0, 0), rank: 2 as const }, // 2 × 3 = 6
      { ...place(makeUnit({ id: 'b', cost: 4 }), 1, 0), rank: 1 as const }, // 4
      { ...place(makeUnit({ id: 'c', cost: 3 }), 2, 0), rank: 2 as const }, // 9
    ];
    expect(targetMonster(squad)?.unit.id).toBe('c');
    expect(targetMonster([])).toBeNull();
  });
});
