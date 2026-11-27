import { describe, expect, it } from 'vitest';
import { simulateCombat } from '../../combat/simulate.ts';
import { createReplay } from '../../render/replay.ts';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { findUnit } from '../../data/units/index.ts';
import { frameScene, frameUnitAt, staticUnitScene } from './scenes.ts';

describe('frameUnitAt', () => {
  const result = simulateCombat(
    {
      player: [place(makeUnit({ id: 'joueur', stats: { range: 1 } }), 3, 7, [{ kind: 'material', material: 'bone' }])],
      enemy: [place(makeUnit({ id: 'ennemi' }), 3, 0)],
    },
    1,
  );
  const replay = createReplay(result.events);

  it('trouve l’unité affichée sur une case, avec ses statistiques et son équipement de départ', () => {
    const unit = frameUnitAt(replay.frameAt(0), { col: 3, row: 7 });
    expect(unit?.defId).toBe('joueur');
    expect(unit?.equipment).toEqual([{ kind: 'material', material: 'bone' }]);
    expect(unit?.stats.attack).toBe(65); // 50 + Os (15)
  });

  it('ne trouve rien sur une case vide', () => {
    expect(frameUnitAt(replay.frameAt(0), { col: 0, row: 5 })).toBeUndefined();
  });

  it('suit une unité qui se déplace (sur sa case d’arrivée passé la moitié du trajet)', () => {
    const move = result.events.find((event) => event.type === 'move');
    if (move === undefined || move.type !== 'move') throw new Error('aucun déplacement');
    const late = replay.frameAt(move.tick + Math.ceil(move.durationTicks * 0.75));
    expect(frameUnitAt(late, move.to)?.uid).toBe(move.uid);
  });
});

describe('version boss sur le plateau', () => {
  const portraits = { get: () => null, url: () => null } as unknown as Parameters<typeof frameScene>[1];
  const rathalos = findUnit('rathalos');
  if (rathalos === undefined) throw new Error('Rathalos manquant');

  it('marque le jeton du boss en préparation', () => {
    const scene = staticUnitScene({ key: 'e0', unit: rathalos, rank: 3, side: 'enemy', position: { col: 3, row: 1 }, boss: true }, portraits);
    expect(scene.boss).toBe(true);
  });

  it('en combat : anneau du boss, puis rage et bandeau « s’enrage ! »', () => {
    const team = [0, 2, 4, 6].map((col) => place(makeUnit({ id: `chasseur-${col}`, stats: { hp: 5000, attack: 60, attackSpeed: 1 } }), col, 5));
    const fight = simulateCombat({ player: team, enemy: [{ ...place(rathalos, 3, 1), rank: 3, boss: true }] }, 3);
    const rage = fight.events.find((event) => event.type === 'enrage');
    if (rage === undefined) throw new Error('pas de rage');
    const replay = createReplay(fight.events);
    const bossUnit = (tick: number) => frameScene(replay.frameAt(tick), portraits).units.find((unit) => unit.boss === true);
    expect(bossUnit(0)).toMatchObject({ boss: true, enraged: false });
    expect(bossUnit(rage.tick)).toMatchObject({ boss: true, enraged: true });
    expect(frameScene(replay.frameAt(rage.tick), portraits).ultimate).toMatchObject({ headline: 'Rathalos s’enrage !', skillName: 'Triple boule de feu' });
  });
});
