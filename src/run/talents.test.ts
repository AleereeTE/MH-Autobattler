import { describe, expect, it } from 'vitest';
import { createCombatState } from '../combat/index.ts';
import { TALENT_TRAIT_EXCLUDED, findTalent } from '../data/talents.ts';
import { findUnit } from '../data/units/index.ts';
import { bench, board, giveUnit, makeRun } from '../test-utils/run.ts';
import { combatSetup, createRun, startRound } from './flow.ts';
import { moveUnit } from './roster.ts';
import { reroll } from './shop.ts';
import type { RunState, TalentOffer } from './state.ts';
import { boardCapacity, maxInterest } from './talent-effects.ts';
import { canTakeTalent, chooseTalent, openTalentChoice, rerollTalent } from './talents.ts';

/** Propose directement un talent (avec son trait ou son unité), puis le prend. */
function take(state: RunState, talentId: string, extra: Partial<TalentOffer> = {}) {
  state.talentChoice = { tier: findTalent(talentId)?.tier ?? 'silver', offers: [{ talentId, traitId: null, unitId: null, rerolled: false, ...extra }] };
  state.phase = 'talent';
  return chooseTalent(state, 0);
}

describe('talents — choix au début du stage', () => {
  it('une run commence par 3 propositions distinctes de la même rareté', () => {
    const state = createRun(4);
    const choice = state.talentChoice;
    expect(state.phase).toBe('talent');
    expect(choice?.offers).toHaveLength(3);
    expect(new Set(choice?.offers.map((offer) => offer.talentId)).size).toBe(3);
    expect(choice?.offers.every((offer) => findTalent(offer.talentId)?.tier === choice.tier && !offer.rerolled)).toBe(true);
  });

  it('chaque rareté sort environ une fois sur trois', () => {
    const tiers = Array.from({ length: 600 }, (_, seed) => createRun(seed + 1).talentChoice?.tier);
    for (const tier of ['silver', 'gold', 'prismatic']) {
      const share = tiers.filter((candidate) => candidate === tier).length / tiers.length;
      expect(share).toBeGreaterThan(0.27);
      expect(share).toBeLessThan(0.4);
    }
  });

  it('les propositions tirent leur trait (hors Dragon ancien et Dragon noir) et leur unité', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const offer of createRun(seed).talentChoice?.offers ?? []) {
        const talent = findTalent(offer.talentId);
        if (talent?.description.includes('{trait}')) {
          expect(offer.traitId).not.toBeNull();
          expect(TALENT_TRAIT_EXCLUDED).not.toContain(offer.traitId);
        } else expect(offer.traitId).toBeNull();
        if (offer.talentId === 'new-recruit') expect(findUnit(offer.unitId ?? '')?.cost).toBe(3);
        if (offer.talentId === 'guild-reinforcement') expect(findUnit(offer.unitId ?? '')?.cost).toBe(4);
        if (offer.talentId === 'elder-call') expect(findUnit(offer.unitId ?? '')?.traits).toContain('elder-dragon');
      }
    }
  });

  it('chaque proposition se relance une seule fois, sans toucher aux autres', () => {
    const state = createRun(4);
    const before = [...(state.talentChoice?.offers ?? [])];
    expect(rerollTalent(state, 1).ok).toBe(true);
    const after = state.talentChoice?.offers ?? [];
    expect(after[1]?.rerolled).toBe(true);
    expect(before.map((offer) => offer.talentId)).not.toContain(after[1]?.talentId);
    expect([after[0], after[2]]).toEqual([before[0], before[2]]);
    expect(rerollTalent(state, 1)).toMatchObject({ ok: false });
    expect(rerollTalent(state, 0).ok).toBe(true);
  });

  it('prendre un talent ouvre la carte ; il n’est plus jamais proposé', () => {
    const state = createRun(4);
    const taken = state.talentChoice?.offers[0]?.talentId;
    expect(chooseTalent(state, 0).ok).toBe(true);
    expect(state).toMatchObject({ phase: 'map', talentChoice: null });
    expect(state.talents.map((owned) => owned.talentId)).toEqual([taken]);
    expect(chooseTalent(state, 0)).toMatchObject({ ok: false });
    for (let i = 0; i < 30; i++) {
      openTalentChoice(state);
      expect(state.talentChoice?.offers.map((offer) => offer.talentId)).not.toContain(taken);
    }
  });
});

describe('talents — effets immédiats', () => {
  it('zennys, niveau (9 au plus), matériaux, objets et retire-objets', () => {
    const state = makeRun({ zennys: 0, level: 4 });
    take(state, 'guild-purse');
    expect(state.zennys).toBe(10);
    take(state, 'higher-rank');
    expect(state.level).toBe(5);
    take(state, 'gathering-kit');
    expect(state.inventory.filter((slot) => slot.kind === 'material')).toHaveLength(3);
    take(state, 'guild-arsenal');
    expect(state.inventory.filter((slot) => slot.kind === 'object')).toHaveLength(2);
    expect(state.itemRemovers).toBe(2);

    const maxed = makeRun({ level: 9 });
    take(maxed, 'higher-rank');
    expect(maxed.level).toBe(9);
  });

  it('une unité donnée rejoint la réserve en sortant du stock ; refusée si la réserve est pleine', () => {
    const state = makeRun();
    const copies = state.pool.get('rathalos') ?? 0;
    expect(take(state, 'new-recruit', { unitId: 'rathalos' }).ok).toBe(true);
    expect(state.units.filter((unit) => unit.unitId === 'rathalos')).toHaveLength(2);
    expect(state.pool.get('rathalos')).toBe(copies - 2);

    const full = makeRun();
    for (let index = 0; index < 10; index++) giveUnit(full, 'minoto', bench(index), 3);
    const offer: TalentOffer = { talentId: 'guild-reinforcement', traitId: null, unitId: 'tigrex', rerolled: false };
    expect(canTakeTalent(full, offer)).toBe(false);
    expect(take(full, 'guild-reinforcement', { unitId: 'tigrex' })).toMatchObject({ ok: false });
    expect(full.phase).toBe('talent');
  });
});

describe('talents — effets durables', () => {
  it('Commerce félyne : une relance gratuite à chaque tour', () => {
    const state = makeRun({ zennys: 10 });
    take(state, 'felyne-trader');
    state.phase = 'prep';
    startRound(state);
    const zennys = state.zennys;
    expect(state.freeRerolls).toBe(1);
    expect(reroll(state).ok).toBe(true);
    expect(state.zennys).toBe(zennys);
    expect(reroll(state).ok).toBe(true);
    expect(state.zennys).toBe(zennys - 2);
  });

  it('Banquier félyne : intérêts jusqu’à 8 ; Fortune du Commandant : +4 par tour', () => {
    const state = makeRun({ zennys: 100 });
    take(state, 'felyne-banker');
    expect(state.zennys).toBe(105);
    expect(maxInterest(state)).toBe(8);
    take(state, 'commander-fortune');
    startRound(state);
    // 105 + 5 de base + 8 d'intérêts + 4 de Fortune.
    expect(state.zennys).toBe(105 + 5 + 8 + 4);
  });

  it('Grand chasseur : une place de plus sur le plateau', () => {
    const state = makeRun({ level: 2 });
    take(state, 'great-hunter');
    expect(boardCapacity(state)).toBe(3);
    state.phase = 'prep';
    const units = ['barroth', 'khezu', 'aiden'].map((unitId, index) => giveUnit(state, unitId, bench(index)));
    units.forEach((unit, index) => expect(moveUnit(state, unit.uid, board(2 + index, 5)).ok).toBe(true));
  });

  it('bonus de combat : toute l’équipe, les chasseurs seulement, les unités du trait tiré', () => {
    const state = makeRun();
    const hunter = giveUnit(state, 'fugen', board(3, 5));
    const monster = giveUnit(state, 'khezu', board(4, 5));
    take(state, 'elder-blood');
    take(state, 'elite-hunters');
    take(state, 'trait-crest', { traitId: 'thunder' });
    const placements = combatSetup(state).player;
    const bonusOf = (uid: number) => placements[state.units.findIndex((unit) => unit.uid === uid)]?.bonus;
    // Fugen : chasseur Foudre (Sang + Chasseurs d'élite + Blason) ; Khezu : monstre Foudre (Sang + Blason).
    expect(bonusOf(hunter.uid)?.hpPercent).toBeCloseTo(0.2 + 0.2 + 0.1);
    expect(bonusOf(monster.uid)?.hpPercent).toBeCloseTo(0.2 + 0.1);
    expect(bonusOf(monster.uid)?.attackPercent).toBeCloseTo(0.2);
  });

  it('Éveil draconique : l’équipe commence le combat avec 40 % de son énergie', () => {
    const state = makeRun();
    giveUnit(state, 'barroth', board(3, 5));
    take(state, 'draconic-awakening');
    const combat = createCombatState(combatSetup(state), 1);
    const barroth = combat.units.find((unit) => unit.side === 'player');
    expect(barroth?.energy).toBeCloseTo((barroth?.stats.maxEnergy ?? 0) * 0.4);
  });

  it('Insigne de trait : le trait tiré compte une unité de plus en combat', () => {
    const state = makeRun();
    giveUnit(state, 'kulu-ya-ku', board(3, 5));
    const alone = createCombatState(combatSetup(state), 1).units[0]?.stats.critChance ?? 0;
    take(state, 'trait-insignia', { traitId: 'berserker' });
    expect(combatSetup(state).traitBonus).toEqual({ player: { berserker: 1 } });
    // Berserker palier 2 : +15 % de chance de critique.
    expect(createCombatState(combatSetup(state), 1).units[0]?.stats.critChance).toBeCloseTo(alone + 0.15);
  });
});
