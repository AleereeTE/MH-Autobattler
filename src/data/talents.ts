import type { StatBonus, TraitId, UnitCost } from './definitions.ts';

/**
 * Talents de chasseur (game-design §11.1) : l'équivalent des augments de TFT.
 * ✅ Règles validées le 2026-11-24 : un choix au début des stages 1, 2 et 3 (pas en mode infini), 3 propositions
 * de la même rareté (argent, or ou prismatique, 1 chance sur 3 chacune), un reroll par proposition,
 * un talent déjà pris n'est plus proposé.
 * ✅ Les 24 talents sont validés · ⚠️ toutes leurs valeurs sont provisoires.
 */

export type TalentTier = 'silver' | 'gold' | 'prismatic';

export const TALENT_TIERS: readonly TalentTier[] = ['silver', 'gold', 'prismatic'];

export const TALENT_TIER_NAMES: Readonly<Record<TalentTier, string>> = { silver: 'Argent', gold: 'Or', prismatic: 'Prismatique' };

/** ✅ Chances de chaque rareté à chaque choix de talent : 1 sur 3 chacune. */
export const TALENT_TIER_WEIGHTS: Readonly<Record<TalentTier, number>> = { silver: 1, gold: 1, prismatic: 1 };

/** ✅ 3 propositions par choix, au début des stages 1 à 3. */
export const TALENT_CHOICE = { offers: 3, lastStage: 3 } as const;

export type TalentFamily = 'combat' | 'economy' | 'items' | 'units' | 'traits';

export const TALENT_FAMILY_NAMES: Readonly<Record<TalentFamily, string>> = {
  combat: 'Combat',
  economy: 'Économie',
  items: 'Objets',
  units: 'Unités',
  traits: 'Traits',
};

/** Unités qui reçoivent un bonus de combat : toute l'équipe, les chasseurs, ou les unités du trait tiré. */
export type TalentTarget = 'team' | 'hunters' | 'traitMembers';

export type TalentEffect =
  /** Bonus de statistiques en combat pour les unités ciblées. */
  | { readonly kind: 'combatBonus'; readonly target: TalentTarget; readonly bonus: StatBonus }
  /** Zennys tout de suite. */
  | { readonly kind: 'zennys'; readonly amount: number }
  /** Zennys en plus au début de chaque tour. */
  | { readonly kind: 'incomePerRound'; readonly amount: number }
  /** Relances gratuites de la boutique à chaque tour. */
  | { readonly kind: 'freeRerollsPerRound'; readonly amount: number }
  /** Nouveau plafond des intérêts. */
  | { readonly kind: 'maxInterest'; readonly value: number }
  /** Niveaux de boutique gratuits, tout de suite. */
  | { readonly kind: 'levels'; readonly amount: number }
  /** Places en plus sur le plateau, sans changer le niveau. */
  | { readonly kind: 'boardSlots'; readonly amount: number }
  /** Matériaux tirés au hasard. */
  | { readonly kind: 'materials'; readonly amount: number }
  /** Objets complets tirés au hasard. */
  | { readonly kind: 'objects'; readonly amount: number }
  | { readonly kind: 'itemRemovers'; readonly amount: number }
  /** Exemplaires d'une unité tirée parmi celles de ce coût ou de ce trait, quand le talent est proposé. */
  | { readonly kind: 'unit'; readonly cost?: UnitCost; readonly trait?: TraitId; readonly copies: number }
  /** Le trait tiré compte des unités en plus, s'il a au moins une unité sur le plateau. */
  | { readonly kind: 'traitCount'; readonly amount: number };

export interface TalentDefinition {
  readonly id: string;
  readonly name: string;
  readonly tier: TalentTier;
  readonly family: TalentFamily;
  /** Texte affiché ; « {trait} » et « {unit} » sont remplacés par le trait ou l'unité tirés. */
  readonly description: string;
  readonly effects: readonly TalentEffect[];
}

/** Traits que les talents Insigne, Blason et Couronne ne tirent jamais. */
export const TALENT_TRAIT_EXCLUDED: readonly TraitId[] = ['elder-dragon', 'black-dragon'];

const team = (bonus: StatBonus): TalentEffect => ({ kind: 'combatBonus', target: 'team', bonus });

export const TALENTS: readonly TalentDefinition[] = [
  // --- Argent ---
  { id: 'canteen-meal', name: 'Repas de cantine', tier: 'silver', family: 'combat', description: 'Toute l’équipe : +10 % PV en combat.', effects: [team({ hpPercent: 0.1 })] },
  {
    id: 'might-seed',
    name: 'Graine de puissance',
    tier: 'silver',
    family: 'combat',
    description: 'Toute l’équipe : +8 % attaque brute et puissance élémentaire en combat.',
    effects: [team({ attackPercent: 0.08, elementalPowerPercent: 0.08 })],
  },
  {
    id: 'hunter-reflexes',
    name: 'Réflexes de chasseur',
    tier: 'silver',
    family: 'combat',
    description: 'Toute l’équipe : +8 % vitesse d’attaque en combat.',
    effects: [team({ attackSpeedPercent: 0.08 })],
  },
  { id: 'guild-purse', name: 'Bourse de la Guilde', tier: 'silver', family: 'economy', description: '+10 zennys tout de suite.', effects: [{ kind: 'zennys', amount: 10 }] },
  {
    id: 'felyne-trader',
    name: 'Commerce félyne',
    tier: 'silver',
    family: 'economy',
    description: 'Une relance gratuite de la boutique à chaque tour.',
    effects: [{ kind: 'freeRerollsPerRound', amount: 1 }],
  },
  { id: 'gathering-kit', name: 'Kit de récolte', tier: 'silver', family: 'items', description: '3 matériaux tirés au hasard.', effects: [{ kind: 'materials', amount: 3 }] },
  {
    id: 'new-recruit',
    name: 'Nouvelle recrue',
    tier: 'silver',
    family: 'units',
    description: '2 exemplaires de {unit} (unité de coût 3 tirée au hasard).',
    effects: [{ kind: 'unit', cost: 3, copies: 2 }],
  },
  {
    id: 'trait-insignia',
    name: 'Insigne de trait',
    tier: 'silver',
    family: 'traits',
    description: '{trait} compte une unité de plus (avec au moins une unité {trait} sur le plateau).',
    effects: [{ kind: 'traitCount', amount: 1 }],
  },

  // --- Or ---
  {
    id: 'demon-powder',
    name: 'Poudre démoniaque',
    tier: 'gold',
    family: 'combat',
    description: 'Toute l’équipe : +15 % attaque brute et puissance élémentaire en combat.',
    effects: [team({ attackPercent: 0.15, elementalPowerPercent: 0.15 })],
  },
  {
    id: 'hardshell-powder',
    name: 'Poudre de carapace',
    tier: 'gold',
    family: 'combat',
    description: 'Toute l’équipe : +25 armure et +25 résistance élémentaire en combat.',
    effects: [team({ armor: 25, elementalResist: 25 })],
  },
  {
    id: 'elite-hunters',
    name: 'Chasseurs d’élite',
    tier: 'gold',
    family: 'combat',
    description: 'Les chasseurs : +20 % PV, attaque brute et puissance élémentaire en combat.',
    effects: [{ kind: 'combatBonus', target: 'hunters', bonus: { hpPercent: 0.2, attackPercent: 0.2, elementalPowerPercent: 0.2 } }],
  },
  {
    id: 'felyne-banker',
    name: 'Banquier félyne',
    tier: 'gold',
    family: 'economy',
    description: 'Intérêts plafonnés à 8 zennys au lieu de 5, et +5 zennys tout de suite.',
    effects: [
      { kind: 'maxInterest', value: 8 },
      { kind: 'zennys', amount: 5 },
    ],
  },
  { id: 'higher-rank', name: 'Rang supérieur', tier: 'gold', family: 'economy', description: '+1 niveau de boutique tout de suite, gratuit.', effects: [{ kind: 'levels', amount: 1 }] },
  {
    id: 'smithy-order',
    name: 'Commande au forgeron',
    tier: 'gold',
    family: 'items',
    description: 'Un objet complet tiré au hasard et un retire-objet.',
    effects: [
      { kind: 'objects', amount: 1 },
      { kind: 'itemRemovers', amount: 1 },
    ],
  },
  {
    id: 'guild-reinforcement',
    name: 'Renfort de la Guilde',
    tier: 'gold',
    family: 'units',
    description: '{unit} (unité de coût 4 tirée au hasard).',
    effects: [{ kind: 'unit', cost: 4, copies: 1 }],
  },
  {
    id: 'trait-crest',
    name: 'Blason de trait',
    tier: 'gold',
    family: 'traits',
    description: '{trait} compte une unité de plus (avec au moins une unité {trait} sur le plateau), et les unités {trait} gagnent +10 % PV en combat.',
    effects: [
      { kind: 'traitCount', amount: 1 },
      { kind: 'combatBonus', target: 'traitMembers', bonus: { hpPercent: 0.1 } },
    ],
  },

  // --- Prismatique ---
  {
    id: 'elder-blood',
    name: 'Sang de l’Ancien',
    tier: 'prismatic',
    family: 'combat',
    description: 'Toute l’équipe : +20 % PV, attaque brute et puissance élémentaire en combat.',
    effects: [team({ hpPercent: 0.2, attackPercent: 0.2, elementalPowerPercent: 0.2 })],
  },
  {
    id: 'draconic-awakening',
    name: 'Éveil draconique',
    tier: 'prismatic',
    family: 'combat',
    description: 'Toute l’équipe commence le combat avec 40 % de son énergie.',
    effects: [team({ startingEnergyRatio: 0.4 })],
  },
  {
    id: 'predator-instinct',
    name: 'Instinct du prédateur',
    tier: 'prismatic',
    family: 'combat',
    description: 'Toute l’équipe : +20 % vitesse d’attaque et +15 % de chance de critique en combat.',
    effects: [team({ attackSpeedPercent: 0.2, critChance: 0.15 })],
  },
  {
    id: 'commander-fortune',
    name: 'Fortune du Commandant',
    tier: 'prismatic',
    family: 'economy',
    description: '+4 zennys à chaque tour, pour le reste de la run.',
    effects: [{ kind: 'incomePerRound', amount: 4 }],
  },
  {
    id: 'great-hunter',
    name: 'Grand chasseur',
    tier: 'prismatic',
    family: 'economy',
    description: '+1 place sur le plateau, sans changer le niveau.',
    effects: [{ kind: 'boardSlots', amount: 1 }],
  },
  {
    id: 'guild-arsenal',
    name: 'Arsenal de la Guilde',
    tier: 'prismatic',
    family: 'items',
    description: '2 objets complets tirés au hasard et 2 retire-objets.',
    effects: [
      { kind: 'objects', amount: 2 },
      { kind: 'itemRemovers', amount: 2 },
    ],
  },
  {
    id: 'elder-call',
    name: 'Appel de l’Ancien',
    tier: 'prismatic',
    family: 'units',
    description: '{unit} (Dragon ancien tiré au hasard, coût 5).',
    effects: [{ kind: 'unit', trait: 'elder-dragon', copies: 1 }],
  },
  {
    id: 'trait-crown',
    name: 'Couronne de trait',
    tier: 'prismatic',
    family: 'traits',
    description: '{trait} compte deux unités de plus (avec au moins une unité {trait} sur le plateau).',
    effects: [{ kind: 'traitCount', amount: 2 }],
  },
];

const TALENTS_BY_ID = new Map(TALENTS.map((talent) => [talent.id, talent]));

export function findTalent(id: string): TalentDefinition | undefined {
  return TALENTS_BY_ID.get(id);
}

/** Le talent tire-t-il un trait (Insigne, Blason, Couronne) ? */
export function talentNeedsTrait(talent: TalentDefinition): boolean {
  return talent.effects.some((effect) => effect.kind === 'traitCount' || (effect.kind === 'combatBonus' && effect.target === 'traitMembers'));
}

/** Effet « unité » du talent (Nouvelle recrue, Renfort, Appel de l'Ancien), s'il en a un. */
export function talentUnitEffect(talent: TalentDefinition): Extract<TalentEffect, { kind: 'unit' }> | undefined {
  return talent.effects.find((effect): effect is Extract<TalentEffect, { kind: 'unit' }> => effect.kind === 'unit');
}
