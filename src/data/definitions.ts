/**
 * Formes des données de gameplay (les « fiches »).
 * Une fiche décrit une unité telle qu'elle est conçue ; elle ne change jamais pendant un combat.
 */

export type Element = 'fire' | 'water' | 'thunder' | 'ice' | 'dragon';
export type Role = 'tank' | 'bruiser' | 'dps' | 'support';
export type UnitKind = 'hunter' | 'monster';
/** Coût en zennys, de 1 à 5 ; 6 pour les Dragons noirs. */
export type UnitCost = 1 | 2 | 3 | 4 | 5 | 6;
/** Rang ★ : 1 = Rang Bas, 2 = Rang Haut, 3 = Rang Maître. */
export type StarRank = 1 | 2 | 3;
/** Une valeur par rang : [★1, ★2, ★3]. */
export type RankValues = readonly [number, number, number];
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
  /** Part des dégâts infligés rendue en soin à l'allié le plus blessé (Eau : 0,15 = 15 %). */
  readonly lifeSourceRatio?: number;
  /** Dégâts en plus quand l'unité est sous le seuil de PV de la Rage (Dragon : 0,2 = +20 %). */
  readonly lowHpDamageBonus?: number;
  /** Énergie au début du combat, en part de l'énergie maximale (Dragon ancien : 0,4 = 40 %). */
  readonly startingEnergyRatio?: number;
  /** Chance d'esquiver une attaque de base (Léviathan : 0,15 = 15 %). */
  readonly dodgeChance?: number;
  /** Portée en plus, en hexagones (Balistique). */
  readonly range?: number;
  /** Énergie maximale en plus ou en moins (Concentration : −0,2 = −20 %). */
  readonly maxEnergyPercent?: number;
  /** Les attaques de base infligent en plus cette part de la puissance élémentaire (Éveil élémentaire : 0,4). */
  readonly onHitElementalRatio?: number;
  /** Part des dégâts infligés rendue en soin à l'unité elle-même (Soif de sang : 0,15). */
  readonly lifesteal?: number;
  /** Armure retirée à la cible par attaque de base qui touche (Briseur : 4)… */
  readonly armorShredPerAttack?: number;
  /** … jusqu'à ce total (Briseur : 24). */
  readonly armorShredMax?: number;
  /** Part de l'armure ignorée par les attaques de base (Œil de l'esprit : 0,5). */
  readonly armorPenetration?: number;
  /** Chance de critique en plus contre une cible sous 50 % de ses PV (Faiblesse exploitée : 0,25). */
  readonly executeCritChance?: number;
  /** Vitesse d'attaque gagnée à chaque coup critique (Furie : 0,06)… */
  readonly attackSpeedPerCrit?: number;
  /** … jusqu'à ce maximum (Furie : 0,36). */
  readonly attackSpeedPerCritMax?: number;
  /** Après quelques secondes de combat : chance de critique en plus (Pouvoir latent : 0,3)… */
  readonly latentCritChance?: number;
  /** … et vitesse d'attaque en plus (Pouvoir latent : 0,2). */
  readonly latentAttackSpeedPercent?: number;
  /** Explosion régulière des attaques de base : dégâts de base (Attaque explosion : 60)… */
  readonly blastDamage?: number;
  /** … plus cette part de la puissance élémentaire (Attaque explosion : 0,6). */
  readonly blastElementalRatio?: number;
  /** Attaques de base subies : jamais critiques, et dégâts réduits de cette part (Garde : 0,2). */
  readonly guardReduction?: number;
  /** Part des dégâts des attaques de base subies renvoyée à l'attaquant (Contre-attaque : 0,3). */
  readonly thornsRatio?: number;
  /** Chance de réduire de moitié les dégâts d'un coup subi (Bénédiction divine : 0,25). */
  readonly divineBlessingChance?: number;
  /** PV max régénérés chaque seconde (Récupération : 0,015). */
  readonly regenPercentPerSecond?: number;
  /** Vitesse d'attaque gagnée à chaque coup subi (Ressentiment : 0,02)… */
  readonly attackSpeedPerHitTaken?: number;
  /** … jusqu'à ce maximum (Ressentiment : 0,4). */
  readonly attackSpeedPerHitTakenMax?: number;
  /** Énergie gagnée à chaque coup subi, quel que soit le rôle (Garde offensive : 4). */
  readonly energyPerHitTaken?: number;
  /** Armure et résistance élémentaire gagnées pendant quelques secondes après chaque compétence (Garde renforcée : 30). */
  readonly postCastDefense?: number;
  /** Soins et boucliers de la compétence en plus (Bonus soin : 0,3). */
  readonly healShieldBonus?: number;
  /** Dégâts des compétences gagnés à chaque compétence lancée (Coalescence : 0,1)… */
  readonly skillDamagePerCast?: number;
  /** … jusqu'à ce maximum (Coalescence : 0,5). */
  readonly skillDamagePerCastMax?: number;
  /** 1 = immunité à la brûlure, aux ralentissements, au poison et à la paralysie (Anti-fléaux). */
  readonly statusImmunity?: number;
  /** Les compétences empoisonnent : dégâts par seconde (Attaque poison : 20)… */
  readonly poisonDamage?: number;
  /** … plus cette part de la puissance élémentaire par seconde (Attaque poison : 0,2). */
  readonly poisonElementalRatio?: number;
  /** Chance qu'une attaque de base qui touche paralyse la cible (Attaque paralysie : 0,1). */
  readonly paralysisChance?: number;
  /** Énergie retirée à la cible par attaque de base qui touche (Intimidateur : 5). */
  readonly energyDrainPerAttack?: number;
  /** Énergie donnée aux alliés proches quand l'unité lance sa compétence (Grand rayon : 10). */
  readonly allyEnergyOnCast?: number;
  /** Énergie gagnée à chaque coup critique (Coups en chaîne : 5). */
  readonly energyPerCrit?: number;
  /** Énergie en plus à chaque attaque de base (Récupération d'endurance : 3). */
  readonly energyPerAttack?: number;
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
  /** Valeur de base selon le rang ★ ; les ratios, eux, ne changent pas. */
  readonly base: RankValues;
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
  readonly base: RankValues;
  readonly ratios: readonly Ratio[];
  readonly duration: number;
}

/** Soin des alliés autour du lanceur (lui compris). */
export interface HealEffect {
  readonly kind: 'heal';
  readonly base: RankValues;
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
  readonly cost: UnitCost;
  /** Traits secondaires ; le trait d'élément est déduit de `element`. */
  readonly traits: readonly TraitId[];
  /** Statistiques de base (rang ★1). */
  readonly stats: Stats;
  readonly skill: SkillDefinition;
}
