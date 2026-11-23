import { describe, expect, it } from 'vitest';
import type { MaterialId } from '../../data/items.ts';
import { makeUnit, place, type UnitOverrides } from '../../test-utils/factories.ts';
import { basicAttack } from '../actions/basic-attack.ts';
import { dealDamage } from '../actions/damage.ts';
import { TICKS_PER_SECOND } from '../constants.ts';
import { createCombatState } from '../setup.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { critChanceAgainst, itemAttackSpeedBonus, registerCrit } from './item-stats.ts';

/** Un attaquant portant un objet (deux matériaux), face à une cible et à un voisin de la cible. */
function duel(materials: readonly [MaterialId, MaterialId], attacker: UnitOverrides = {}, target: UnitOverrides = {}) {
  const state = createCombatState(
    {
      player: [place(makeUnit({ id: 'porteur', ...attacker }), 3, 4, [{ kind: 'object', materials }])],
      enemy: [place(makeUnit({ id: 'cible', ...target }), 3, 3), place(makeUnit({ id: 'voisin', ...target }), 4, 3)],
    },
    1,
  );
  const [holder, victim, neighbour] = state.units as [CombatUnit, CombatUnit, CombatUnit];
  return { state, holder, victim, neighbour };
}

const itemDamage = (state: CombatState) => state.events.filter((event) => event.type === 'damage' && event.cause === 'item');

describe('objets du lot 1 — statistiques simples', () => {
  it('Balistique : +1 de portée', () => {
    const { holder } = duel(['feather', 'feather'], { stats: { range: 2 } });
    expect(holder.stats.range).toBe(3);
  });

  it('Concentration : énergie maximale −20 %', () => {
    const { holder } = duel(['extract', 'extract'], { stats: { maxEnergy: 100 } });
    expect(holder.stats.maxEnergy).toBeCloseTo(80);
  });

  it('Élément critique : compétences critiques possibles, critiques ×1,7', () => {
    const { holder } = duel(['gem', 'membrane']);
    expect(holder.stats.skillsCanCrit).toBe(true);
    expect(holder.stats.critMultiplier).toBeCloseTo(1.7);
  });

  it('Héroïsme : +30 % de dégâts sous 50 % des PV', () => {
    const { state, holder, victim } = duel(['carapace', 'membrane']);
    const hit = { amount: 100, type: 'physical' as const, isCrit: false, cause: 'attack' as const };
    expect(dealDamage(state, holder, victim, hit)).toBeCloseTo(100);
    holder.hp = holder.stats.hp * 0.4;
    expect(dealDamage(state, holder, victim, hit)).toBeCloseTo(130);
  });
});

describe('objets du lot 1 — au coup porté', () => {
  it('Éveil élémentaire : l’attaque inflige en plus 40 % de la puissance élémentaire', () => {
    const { state, holder, victim } = duel(['bone', 'gem'], { stats: { elementalPower: 50 } });
    basicAttack(state, holder, victim);
    // 50 + 15 (Gemme) = 65 de puissance élémentaire → 26 dégâts élémentaires en plus.
    expect(itemDamage(state)).toMatchObject([{ targetUid: victim.uid, amount: 26, damageType: 'elemental' }]);
  });

  it('Soif de sang : soigne l’unité de 15 % des dégâts infligés', () => {
    const { state, holder, victim } = duel(['bone', 'carapace']);
    holder.hp = 100;
    basicAttack(state, holder, victim);
    // Attaque : 50 + 15 (Os) = 65 dégâts sur une cible sans armure → 9,75 PV rendus.
    expect(holder.hp).toBeCloseTo(100 + 65 * 0.15);
  });

  it('Soif de sang : aucun soin (ni ligne de journal) quand l’unité a tous ses PV', () => {
    const { state, holder, victim } = duel(['bone', 'carapace']);
    basicAttack(state, holder, victim);
    expect(state.events.some((event) => event.type === 'heal')).toBe(false);
  });

  it('Briseur : retire 4 armure par attaque qui touche, 24 au plus, pour tout le combat', () => {
    const { state, holder, victim } = duel(['bone', 'fang'], {}, { stats: { armor: 40 } });
    basicAttack(state, holder, victim);
    expect(victim.armorShred).toBe(4);
    for (let i = 0; i < 10; i++) basicAttack(state, holder, victim);
    expect(victim.armorShred).toBe(24);
    // Armure restante : 40 − 24 = 16.
    const last = state.events.filter((event) => event.type === 'damage').at(-1);
    expect(last?.type === 'damage' ? last.amount : 0).toBeCloseTo((65 * 100) / 116);
  });

  it('Œil de l’esprit : les attaques de base ignorent 50 % de l’armure, pas les autres dégâts', () => {
    const { state, holder, victim } = duel(['membrane', 'horn'], {}, { stats: { armor: 100 } });
    basicAttack(state, holder, victim);
    const attack = state.events.find((event) => event.type === 'damage');
    if (attack?.type !== 'damage') throw new Error('pas de dégâts');
    // Armure 100 dont la moitié ignorée → réduction de 100 / 150 (l'attaque peut être critique : Membrane).
    expect(attack.amount).toBeCloseTo(((attack.isCrit ? 50 * 1.5 : 50) * 100) / 150);
    // Une compétence (sans pénétration) subit toute l'armure.
    expect(dealDamage(state, holder, victim, { amount: 100, type: 'physical', isCrit: false, cause: 'skill' })).toBeCloseTo(50);
  });

  it('Attaque explosion : toutes les 4 attaques qui touchent, explosion sur la cible et ses voisins', () => {
    const { state, holder, victim, neighbour } = duel(['gem', 'feather'], { stats: { elementalPower: 50 } });
    for (let i = 0; i < 3; i++) basicAttack(state, holder, victim);
    expect(itemDamage(state)).toEqual([]);
    basicAttack(state, holder, victim);
    // 60 + 60 % de 65 de puissance élémentaire = 99, sur la cible et son voisin.
    expect(itemDamage(state).map((event) => (event.type === 'damage' ? [event.targetUid, event.amount] : []))).toEqual([
      [victim.uid, 99],
      [neighbour.uid, 99],
    ]);
    expect(state.events.some((event) => event.type === 'skillArea' && event.uid === holder.uid && event.radius === 1)).toBe(true);
  });
});

describe('objets du lot 1 — critiques et vitesse d’attaque', () => {
  it('Faiblesse exploitée : +25 % de critique contre une cible sous 50 % de ses PV', () => {
    const { holder, victim } = duel(['membrane', 'fang']);
    expect(critChanceAgainst(holder, victim, 0)).toBeCloseTo(0.1); // Membrane : 10 %
    victim.hp = victim.stats.hp * 0.4;
    expect(critChanceAgainst(holder, victim, 0)).toBeCloseTo(0.35);
  });

  it('Furie : +6 % de vitesse d’attaque par coup critique, 36 % au plus', () => {
    const { holder } = duel(['membrane', 'feather']);
    registerCrit(holder);
    registerCrit(holder);
    expect(itemAttackSpeedBonus(holder, 0)).toBeCloseTo(0.12);
    for (let i = 0; i < 10; i++) registerCrit(holder);
    expect(itemAttackSpeedBonus(holder, 0)).toBeCloseTo(0.36);
  });

  it('Pouvoir latent : +30 % de critique et +20 % de vitesse d’attaque après 10 s de combat', () => {
    const { holder, victim } = duel(['bone', 'extract']);
    expect(critChanceAgainst(holder, victim, 9.9)).toBe(0);
    expect(itemAttackSpeedBonus(holder, 9.9)).toBe(0);
    expect(critChanceAgainst(holder, victim, 10)).toBeCloseTo(0.3);
    expect(itemAttackSpeedBonus(holder, 10)).toBeCloseTo(0.2);
  });

  it('Pouvoir latent : la vraie vitesse d’attaque du combat augmente à 10 s', async () => {
    const { attackSpeedOf } = await import('../status/modifiers.ts');
    const { holder } = duel(['bone', 'extract'], { stats: { attackSpeed: 1 } });
    expect(attackSpeedOf(holder, (10 * TICKS_PER_SECOND - 1) / TICKS_PER_SECOND)).toBeCloseTo(1);
    expect(attackSpeedOf(holder, 10)).toBeCloseTo(1.2);
  });
});
