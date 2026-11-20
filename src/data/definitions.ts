/**
 * Formes des données de gameplay (les « fiches »).
 * Une fiche décrit une unité telle qu'elle est conçue ; elle ne change jamais pendant un combat.
 */

export type Element = 'fire' | 'water' | 'thunder' | 'ice' | 'dragon';
export type Role = 'tank' | 'bruiser' | 'dps' | 'support';
export type UnitKind = 'hunter' | 'monster';
export type DamageType = 'physical' | 'elemental';
export type TraitId = string;

export interface Stats {
  readonly hp: number;
  /** Attaque brute : dégâts des attaques de base. */
  readonly attack: number;
  /** Puissance élémentaire : amplifie les compétences élémentaires. */
  readonly elementalPower: number;
  /** Chance de critique, entre 0 et 1. */
  readonly critChance: number;
  /** Réduit les dégâts physiques. */
  readonly armor: number;
  /** Réduit les dégâts élémentaires. */
  readonly elementalResist: number;
  /** Attaques par seconde. */
  readonly attackSpeed: number;
  /** Portée d'attaque, en hexagones. */
  readonly range: number;
  /** Énergie nécessaire pour lancer la compétence. */
  readonly maxEnergy: number;
  /** Énergie gagnée chaque seconde en plus du gain passif du rôle (l'Extrait donne +1). */
  readonly energyRegenBonus: number;
}

/**
 * Bonus de statistiques apportés par les matériaux, les objets et les traits.
 * Les champs « Percent » sont des pourcentages (0,15 = +15 %) ; les autres s'ajoutent tels quels.
 */
export interface StatBonus {
  readonly hp?: number;
  readonly hpPercent?: number;
  readonly attack?: number;
  readonly attackPercent?: number;
  readonly elementalPower?: number;
  readonly elementalPowerPercent?: number;
  readonly critChance?: number;
  /** S'ajoute au multiplicateur critique de base (×1,5). */
  readonly critMultiplier?: number;
  readonly armor?: number;
  readonly elementalResist?: number;
  readonly attackSpeedPercent?: number;
  /** Énergie passive supplémentaire par seconde. */
  readonly energyRegen?: number;
  /** Part des dégâts subis ignorée (0,15 = −15 %). */
  readonly damageReduction?: number;
  /** Les compétences peuvent faire des coups critiques. */
  readonly skillsCanCrit?: boolean;
  /** Énergie regagnée après chaque compétence. */
  readonly energyRefundOnCast?: number;
  /** Vitesse d'attaque gagnée par seconde de combat (0,03 = +3 %/s)… */
  readonly attackSpeedRampPerSecond?: number;
  /** … jusqu'à ce maximum (0,45 = +45 %). */
  readonly attackSpeedRampMax?: number;
}

/** Statistique sur laquelle un ratio de compétence peut s'appuyer ('hp' = PV max). */
export type ScalingStat = 'attack' | 'elementalPower' | 'hp';

export interface Ratio {
  readonly stat: ScalingStat;
  readonly ratio: number;
}

/** Qui une compétence vise. 'self' = zone centrée sur le lanceur. */
export type TargetRule = 'currentTarget' | 'lowestHpEnemy' | 'farthestEnemy' | 'self';

export interface SlowSpec {
  /** Négatif : −0,3 = −30 % de vitesse d'attaque. */
  readonly attackSpeedPercent: number;
  readonly duration: number;
}

export interface DamageEffect {
  readonly kind: 'damage';
  readonly target: TargetRule;
  readonly damageType: DamageType;
  readonly base: number;
  readonly ratios: readonly Ratio[];
  /** Touche aussi les ennemis à cette distance du centre (cible principale, ou lanceur pour 'self'). */
  readonly radius?: number;
  /** Ralentit chaque ennemi touché. */
  readonly slow?: SlowSpec;
  /** Le lanceur bondit à côté de la cible avant de frapper. */
  readonly leap?: boolean;
}

/** Bouclier sur le lanceur. */
export interface ShieldEffect {
  readonly kind: 'shield';
  readonly base: number;
  readonly ratios: readonly Ratio[];
  readonly duration: number;
}

/** Soin des alliés autour du lanceur (lui compris). */
export interface HealEffect {
  readonly kind: 'heal';
  readonly base: number;
  readonly ratios: readonly Ratio[];
  readonly radius: number;
}

/** Bonus temporaire de vitesse d'attaque sur le lanceur. */
export interface BuffEffect {
  readonly kind: 'buff';
  readonly attackSpeedPercent: number;
  readonly duration: number;
}

export type SkillEffect = DamageEffect | ShieldEffect | HealEffect | BuffEffect;

export interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Temps d'incantation en secondes (0 = effet immédiat). */
  readonly castTime: number;
  readonly effects: readonly SkillEffect[];
}

export interface UnitDefinition {
  readonly id: string;
  readonly name: string;
  readonly kind: UnitKind;
  /** Arme fixe d'un chasseur (texte affiché). */
  readonly weapon?: string;
  readonly role: Role;
  /** null = sans élément. */
  readonly element: Element | null;
  readonly cost: 1 | 2 | 3 | 4 | 5;
  /** Traits secondaires ; le trait d'élément est déduit de `element`. */
  readonly traits: readonly TraitId[];
  /** Statistiques de base (rang ★1). */
  readonly stats: Stats;
  readonly skill: SkillDefinition;
}
