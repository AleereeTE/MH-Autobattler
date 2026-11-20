import { describe, expect, it } from 'vitest';
import { makeUnit, place } from '../../test-utils/factories.ts';
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

  it('passe à −25 % puis −35 % avec 2 et 3 Dragons noirs', () => {
    const two = fight(2);
    expect(dealDamage(two, unit(two, 'ennemi'), unit(two, 'noir-0'), hit(100))).toBeCloseTo(75);
    const three = fight(3);
    expect(dealDamage(three, unit(three, 'ennemi'), unit(three, 'noir-0'), hit(100))).toBeCloseTo(65);
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
