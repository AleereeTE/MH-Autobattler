import { describe, expect, it } from 'vitest';
import { recipesWith, objectBonuses } from './recipes.ts';
import { sumBonuses } from './stats.ts';

describe('recettes', () => {
  it('donne les 8 objets possibles avec un matériau, tous avec leur effet propre', () => {
    const recipes = recipesWith('fang');
    expect(recipes).toHaveLength(8);
    expect(recipes.map((recipe) => recipe.other).sort()).toEqual(['bone', 'carapace', 'extract', 'fang', 'feather', 'gem', 'horn', 'membrane']);
    expect(recipes.every((recipe) => !recipe.object.generic)).toBe(true);
  });

  it('additionne les deux matériaux et l’effet propre de l’objet', () => {
    // Os + Os : 15 + 15 (matériaux) + 20 (Bonus d'attaque) = 50 attaque brute
    expect(sumBonuses(objectBonuses(['bone', 'bone'])).attack).toBe(50);
  });
});
