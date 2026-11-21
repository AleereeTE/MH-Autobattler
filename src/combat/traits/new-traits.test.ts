import { describe, expect, it } from 'vitest';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { basicAttack } from '../actions/basic-attack.ts';
import { dealDamage } from '../actions/damage.ts';
import { createCombatState } from '../setup.ts';
import type { CombatState, CombatUnit } from '../state.ts';

/** Unité du joueur par son identifiant de fiche. */
function unit(state: CombatState, id: string): CombatUnit {
  const found = state.units.find((candidate) => candidate.def.id === id);
  if (found === undefined) throw new Error(`unité ${id} manquante`);
  return found;
}

const target = () => place(makeUnit({ id: 'cible', stats: { hp: 100_000 } }), 3, 0);
const hit = (amount: number) => ({ amount, type: 'physical' as const, isCrit: false, cause: 'attack' as const });

describe('Eau — Source de vie', () => {
  it('soigne l’allié le plus blessé (en pourcentage) de 15 % des dégâts infligés', () => {
    const state = createCombatState(
      {
        player: [
          place(makeUnit({ id: 'eau-1', element: 'water' }), 2, 7),
          place(makeUnit({ id: 'eau-2', element: 'water' }), 4, 7),
          place(makeUnit({ id: 'blesse', stats: { hp: 1000 } }), 3, 6),
        ],
        enemy: [target()],
      },
      1,
    );
    const wounded = unit(state, 'blesse');
    wounded.hp = 400; // 40 % : le plus blessé
    unit(state, 'eau-2').hp = 300; // 60 % de 500

    dealDamage(state, unit(state, 'eau-1'), unit(state, 'cible'), hit(200));

    expect(wounded.hp).toBeCloseTo(400 + 200 * 0.15);
    expect(state.events.at(-1)).toMatchObject({ type: 'heal', targetUid: wounded.uid });
  });

  it('passe à 30 % avec 3 unités Eau, et ne soigne personne si tout le monde est en pleine santé', () => {
    const state = createCombatState(
      {
        player: ['a', 'b', 'c'].map((id, index) => place(makeUnit({ id: `eau-${id}`, element: 'water' }), 2 + index, 7)),
        enemy: [target()],
      },
      1,
    );
    const source = unit(state, 'eau-a');
    dealDamage(state, source, unit(state, 'cible'), hit(100));
    expect(state.events.some((event) => event.type === 'heal')).toBe(false);

    source.hp = 100;
    dealDamage(state, source, unit(state, 'cible'), hit(100));
    expect(source.hp).toBeCloseTo(100 + 100 * 0.3);
  });

  it('n’agit pas pour une unité qui n’est pas du trait', () => {
    const state = createCombatState(
      { player: [place(makeUnit({ id: 'sec' }), 3, 7), place(makeUnit({ id: 'eau', element: 'water' }), 4, 7)], enemy: [target()] },
      1,
    );
    const dry = unit(state, 'sec');
    dry.hp = 100;
    dealDamage(state, dry, unit(state, 'cible'), hit(100));
    expect(dry.hp).toBe(100);
  });
});

describe('Dragon — Rage draconique', () => {
  function dragons() {
    return createCombatState(
      {
        player: [place(makeUnit({ id: 'dragon-1', element: 'dragon' }), 3, 7), place(makeUnit({ id: 'dragon-2', element: 'dragon' }), 4, 7)],
        enemy: [target()],
      },
      1,
    );
  }

  it('n’ajoute rien au-dessus de 50 % des PV', () => {
    const state = dragons();
    expect(dealDamage(state, unit(state, 'dragon-1'), unit(state, 'cible'), hit(100))).toBeCloseTo(100);
  });

  it('ajoute 20 % de dégâts sous 50 % des PV', () => {
    const state = dragons();
    const dragon = unit(state, 'dragon-1');
    dragon.hp = dragon.stats.hp * 0.49;
    expect(dealDamage(state, dragon, unit(state, 'cible'), hit(100))).toBeCloseTo(120);
  });
});

describe('Dragon ancien — Calamité', () => {
  it('fait commencer les Dragons anciens avec une partie de leur énergie (1, 2 ou 3 Dragons anciens)', () => {
    const elder = (id: string) => makeUnit({ id, kind: 'monster', traits: ['elder-dragon'], stats: { maxEnergy: 100 } });
    const energies = [1, 2, 3].map((count) => {
      const player = Array.from({ length: count }, (_, i) => place(elder(`ancien-${i}`), 2 + i, 7));
      const state = createCombatState({ player, enemy: [target()] }, 1);
      return unit(state, 'ancien-0').energy;
    });
    expect(energies).toEqual([40, 70, 100]);
  });

  it('laisse les autres unités à 0 énergie', () => {
    const state = createCombatState(
      {
        player: [
          place(makeUnit({ id: 'ancien', kind: 'monster', traits: ['elder-dragon'], stats: { maxEnergy: 100 } }), 2, 7),
          place(makeUnit({ id: 'autre', kind: 'monster' }), 3, 7),
        ],
        enemy: [target()],
      },
      1,
    );
    expect(unit(state, 'autre').energy).toBe(0);
  });
});

describe('Dragon noir — Terreur', () => {
  const blackDragon = (id: string) => makeUnit({ id, kind: 'monster', traits: ['black-dragon'], stats: { hp: 5000 } });

  function fight(blackDragons: number) {
    const player = Array.from({ length: blackDragons }, (_, i) => place(blackDragon(`noir-${i}`), 2 + i, 7));
    return createCombatState({ player, enemy: [place(makeUnit({ id: 'ennemi' }), 3, 0)] }, 1);
  }

  it('fait infliger −15 % de dégâts aux ennemis tant qu’un Dragon noir est en vie', () => {
    const state = fight(1);
    expect(dealDamage(state, unit(state, 'ennemi'), unit(state, 'noir-0'), hit(100))).toBeCloseTo(85);
  });

  it('n’accepte qu’un seul Dragon noir par camp', () => {
    expect(() => fight(2)).toThrow(/Un seul Dragon noir/);
  });

  it('cesse quand plus aucun Dragon noir n’est en vie, et ne touche pas son propre camp', () => {
    const state = fight(1);
    const dragon = unit(state, 'noir-0');
    expect(dealDamage(state, dragon, unit(state, 'ennemi'), hit(100))).toBeCloseTo(100);
    dragon.alive = false;
    dragon.hp = 0;
    expect(dealDamage(state, unit(state, 'ennemi'), dragon, hit(100))).toBeCloseTo(100);
  });
});

describe('Léviathan — Glissade', () => {
  it('esquive environ 15 % des attaques de base, sans dégâts ni effet d’élément', () => {
    const leviathan = (id: string) => makeUnit({ id, kind: 'monster', traits: ['leviathan'], stats: { hp: 1_000_000 } });
    const state = createCombatState(
      {
        player: [place(leviathan('lev-1'), 3, 4), place(leviathan('lev-2'), 4, 4)],
        enemy: [place(makeUnit({ id: 'feu', element: 'fire' }), 3, 3), place(makeUnit({ id: 'feu-2', element: 'fire' }), 6, 0)],
      },
      3,
    );
    const target = unit(state, 'lev-1');
    expect(target.stats.dodgeChance).toBeCloseTo(0.15);
    const attacker = unit(state, 'feu');
    for (let i = 0; i < 2000; i++) basicAttack(state, attacker, target);

    const dodges = state.events.filter((event) => event.type === 'dodge');
    const hits = state.events.filter((event) => event.type === 'damage' && event.cause === 'attack');
    expect(dodges.length / 2000).toBeGreaterThan(0.12);
    expect(dodges.length / 2000).toBeLessThan(0.18);
    expect(dodges.length + hits.length).toBe(2000);
    expect(state.events.filter((event) => event.type === 'status' && event.status === 'burn').length).toBe(hits.length);
  });

  it('n’esquive jamais une compétence', () => {
    const state = createCombatState(
      {
        player: [
          place(makeUnit({ id: 'lev-1', kind: 'monster', traits: ['leviathan'] }), 3, 4),
          place(makeUnit({ id: 'lev-2', kind: 'monster', traits: ['leviathan'] }), 4, 4),
        ],
        enemy: [target()],
      },
      1,
    );
    const skillHit = { amount: 50, type: 'physical' as const, isCrit: false, cause: 'skill' as const };
    for (let i = 0; i < 50; i++) dealDamage(state, unit(state, 'cible'), unit(state, 'lev-1'), skillHit);
    expect(state.events.some((event) => event.type === 'dodge')).toBe(false);
  });
});

describe('Wyverne brute — Masse', () => {
  it('donne +15 % de PV max avec 2 Wyvernes brutes, +30 % avec 3', () => {
    const brute = (id: string) => makeUnit({ id, kind: 'monster', traits: ['brute-wyvern'], stats: { hp: 1000 } });
    const hpWith = (count: number) => {
      const player = Array.from({ length: count }, (_, i) => place(brute(`brute-${i}`), 2 + i, 7));
      return unit(createCombatState({ player, enemy: [target()] }, 1), 'brute-0').stats.hp;
    };
    expect([1, 2, 3].map(hpWith)).toEqual([1000, 1150, 1300]);
  });
});
