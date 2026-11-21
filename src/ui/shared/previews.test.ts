import { describe, expect, it } from 'vitest';
import { energyLine } from './previews.ts';
import { energyRatio } from './scenes.ts';

const unit = { energy: 45.7, maxEnergy: 100, shield: 0, casting: false, alive: true };

describe('énergie dans l’aperçu d’une unité en combat', () => {
  it('affiche l’énergie actuelle et le maximum', () => {
    expect(energyLine(unit)).toBe('Énergie : 45 / 100');
  });

  it('précise pourquoi l’énergie est bloquée', () => {
    expect(energyLine({ ...unit, shield: 120 })).toBe('Énergie : 45 / 100 · bloquée (bouclier)');
    expect(energyLine({ ...unit, energy: 0, casting: true })).toBe('Énergie : 0 / 100 · bloquée (compétence en cours)');
    expect(energyLine({ ...unit, shield: 120, alive: false })).toBe('Énergie : 45 / 100');
  });

  it('remplit la barre entre 0 et 1', () => {
    expect(energyRatio(unit)).toBeCloseTo(0.457);
    expect(energyRatio({ energy: 150, maxEnergy: 100 })).toBe(1);
    expect(energyRatio({ energy: 10, maxEnergy: 0 })).toBe(0);
  });
});
