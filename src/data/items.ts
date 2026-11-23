import type { StatBonus } from './definitions.ts';

/**
 * Matériaux et objets (docs/prototype-content.md). ✅ Les 36 objets sont validés et codés · ⚠️ valeurs provisoires.
 * Vocabulaire : 2 matériaux fusionnés sur une unité forment un objet.
 */

export type MaterialId = 'bone' | 'gem' | 'carapace' | 'membrane' | 'horn' | 'fang' | 'feather' | 'extract';

export interface MaterialDefinition {
  readonly id: MaterialId;
  readonly name: string;
  readonly description: string;
  readonly bonus: StatBonus;
}

export interface ObjectDefinition {
  readonly id: string;
  readonly name: string;
  readonly materials: readonly [MaterialId, MaterialId];
  /** Effet propre de l'objet, en plus des statistiques de ses deux matériaux. */
  readonly effect: StatBonus;
  readonly description: string;
  /** true = objet générique en attendant sa vraie conception. */
  readonly generic: boolean;
}

/** Contenu d'un emplacement d'objet : un matériau seul, ou un objet (deux matériaux fusionnés). */
export type EquipmentSlot =
  | { readonly kind: 'material'; readonly material: MaterialId }
  | { readonly kind: 'object'; readonly materials: readonly [MaterialId, MaterialId] };

export type Equipment = readonly EquipmentSlot[];

export const MATERIALS: Readonly<Record<MaterialId, MaterialDefinition>> = {
  bone: { id: 'bone', name: 'Os', description: '+15 attaque brute', bonus: { attack: 15 } },
  gem: { id: 'gem', name: 'Gemme', description: '+15 puissance élémentaire', bonus: { elementalPower: 15 } },
  carapace: { id: 'carapace', name: 'Carapace', description: '+150 PV', bonus: { hp: 150 } },
  membrane: { id: 'membrane', name: 'Membrane', description: '+10 % de chance de critique', bonus: { critChance: 0.1 } },
  horn: { id: 'horn', name: 'Corne', description: '+20 armure', bonus: { armor: 20 } },
  fang: { id: 'fang', name: 'Croc', description: '+20 résistance élémentaire', bonus: { elementalResist: 20 } },
  feather: { id: 'feather', name: 'Plume', description: '+10 % de vitesse d’attaque', bonus: { attackSpeedPercent: 0.1 } },
  extract: { id: 'extract', name: 'Extrait', description: '+1 énergie par seconde', bonus: { energyRegen: 1 } },
};

export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];

export const SIGNATURE_OBJECTS: readonly ObjectDefinition[] = [
  {
    id: 'attack-boost',
    name: 'Bonus d’attaque',
    materials: ['bone', 'bone'],
    effect: { attack: 20 },
    description: '+20 attaque brute',
    generic: false,
  },
  {
    id: 'critical-eye',
    name: 'Œil critique',
    materials: ['membrane', 'membrane'],
    effect: { critChance: 0.2 },
    description: '+20 % de chance de critique',
    generic: false,
  },
  {
    id: 'critical-boost',
    name: 'Bonus critique',
    materials: ['bone', 'membrane'],
    effect: { critMultiplier: 0.3 },
    description: 'Coups critiques ×1,8 au lieu de ×1,5',
    generic: false,
  },
  {
    id: 'elemental-attack',
    name: 'Attaque élémentaire',
    materials: ['gem', 'gem'],
    effect: { elementalPower: 20 },
    description: '+20 puissance élémentaire',
    generic: false,
  },
  {
    id: 'accumulator',
    name: 'Accumulateur',
    materials: ['gem', 'extract'],
    effect: { energyRefundOnCast: 20 },
    description: 'Regagne 20 énergie après chaque compétence',
    generic: false,
  },
  {
    id: 'health-boost',
    name: 'Santé',
    materials: ['carapace', 'carapace'],
    effect: { hp: 300 },
    description: '+300 PV',
    generic: false,
  },
  {
    id: 'total-defense',
    name: 'Défense totale',
    materials: ['horn', 'fang'],
    effect: { armor: 20, elementalResist: 20 },
    description: '+20 armure et +20 résistance élémentaire',
    generic: false,
  },
  {
    id: 'agitator',
    name: 'Agitateur',
    materials: ['feather', 'bone'],
    effect: { attackSpeedRampPerSecond: 0.03, attackSpeedRampMax: 0.45 },
    description: '+3 % de vitesse d’attaque par seconde de combat (max +45 %)',
    generic: false,
  },
  // --- Lot 1 : effets au coup porté et statistiques simples ---
  {
    id: 'ballistics',
    name: 'Balistique',
    materials: ['feather', 'feather'],
    effect: { range: 1 },
    description: '+1 de portée',
    generic: false,
  },
  {
    id: 'focus',
    name: 'Concentration',
    materials: ['extract', 'extract'],
    effect: { maxEnergyPercent: -0.2 },
    description: 'Énergie maximale −20 % : la compétence part plus souvent',
    generic: false,
  },
  {
    id: 'critical-element',
    name: 'Élément critique',
    materials: ['gem', 'membrane'],
    effect: { skillsCanCrit: true, critMultiplier: 0.2 },
    description: 'Les compétences peuvent être critiques ; critiques ×1,7',
    generic: false,
  },
  {
    id: 'heroics',
    name: 'Héroïsme',
    materials: ['carapace', 'membrane'],
    effect: { lowHpDamageBonus: 0.3 },
    description: '+30 % de dégâts sous 50 % des PV',
    generic: false,
  },
  {
    id: 'elemental-awakening',
    name: 'Éveil élémentaire',
    materials: ['bone', 'gem'],
    effect: { onHitElementalRatio: 0.4 },
    description: 'Les attaques de base infligent en plus 40 % de la puissance élémentaire en dégâts élémentaires',
    generic: false,
  },
  {
    id: 'bloodlust',
    name: 'Soif de sang',
    materials: ['bone', 'carapace'],
    effect: { lifesteal: 0.15 },
    description: 'Soigne l’unité de 15 % des dégâts qu’elle inflige',
    generic: false,
  },
  {
    id: 'partbreaker',
    name: 'Briseur',
    materials: ['bone', 'fang'],
    effect: { armorShredPerAttack: 4, armorShredMax: 24 },
    description: 'Chaque attaque de base qui touche retire 4 armure à la cible, pour tout le combat (max −24)',
    generic: false,
  },
  {
    id: 'minds-eye',
    name: 'Œil de l’esprit',
    materials: ['membrane', 'horn'],
    effect: { armorPenetration: 0.5 },
    description: 'Les attaques de base ignorent 50 % de l’armure de la cible',
    generic: false,
  },
  {
    id: 'weakness-exploit',
    name: 'Faiblesse exploitée',
    materials: ['membrane', 'fang'],
    effect: { executeCritChance: 0.25 },
    description: '+25 % de chance de critique contre les cibles sous 50 % de leurs PV',
    generic: false,
  },
  {
    id: 'burst',
    name: 'Furie',
    materials: ['membrane', 'feather'],
    effect: { attackSpeedPerCrit: 0.06, attackSpeedPerCritMax: 0.36 },
    description: 'Chaque coup critique : +6 % de vitesse d’attaque (max +36 %)',
    generic: false,
  },
  {
    id: 'latent-power',
    name: 'Pouvoir latent',
    materials: ['bone', 'extract'],
    effect: { latentCritChance: 0.3, latentAttackSpeedPercent: 0.2 },
    description: 'Après 10 s de combat : +30 % de chance de critique et +20 % de vitesse d’attaque',
    generic: false,
  },
  {
    id: 'blast-attack',
    name: 'Attaque explosion',
    materials: ['gem', 'feather'],
    effect: { blastDamage: 60, blastElementalRatio: 0.6 },
    description: 'Toutes les 4 attaques de base qui touchent : explosion de 60 + 60 % de la puissance élémentaire sur la cible et ses voisins',
    generic: false,
  },
  // --- Lot 2 : effets quand l'unité est touchée, soins et compétences ---
  {
    id: 'guard',
    name: 'Garde',
    materials: ['horn', 'horn'],
    effect: { guardReduction: 0.2 },
    description: 'Les attaques de base subies ne sont jamais critiques et infligent −20 % de dégâts',
    generic: false,
  },
  {
    id: 'counterstrike',
    name: 'Contre-attaque',
    materials: ['bone', 'horn'],
    effect: { thornsRatio: 0.3 },
    description: 'Renvoie 30 % des dégâts des attaques de base subies à l’attaquant',
    generic: false,
  },
  {
    id: 'divine-blessing',
    name: 'Bénédiction divine',
    materials: ['carapace', 'horn'],
    effect: { divineBlessingChance: 0.25 },
    description: '25 % de chances de réduire de moitié les dégâts d’un coup subi',
    generic: false,
  },
  {
    id: 'recovery-speed',
    name: 'Récupération',
    materials: ['carapace', 'fang'],
    effect: { regenPercentPerSecond: 0.015 },
    description: 'Régénère 1,5 % des PV max par seconde',
    generic: false,
  },
  {
    id: 'resentment',
    name: 'Ressentiment',
    materials: ['carapace', 'feather'],
    effect: { attackSpeedPerHitTaken: 0.02, attackSpeedPerHitTakenMax: 0.4 },
    description: 'Chaque coup subi : +2 % de vitesse d’attaque (max +40 %)',
    generic: false,
  },
  {
    id: 'offensive-guard',
    name: 'Garde offensive',
    materials: ['carapace', 'extract'],
    effect: { energyPerHitTaken: 4 },
    description: '+4 énergie à chaque coup subi, quel que soit le rôle (pas à travers un bouclier)',
    generic: false,
  },
  {
    id: 'guard-up',
    name: 'Garde renforcée',
    materials: ['horn', 'extract'],
    effect: { postCastDefense: 30 },
    description: 'Après chaque compétence : +30 armure et +30 résistance élémentaire pendant 4 s',
    generic: false,
  },
  {
    id: 'recovery-up',
    name: 'Bonus soin',
    materials: ['gem', 'carapace'],
    effect: { healShieldBonus: 0.3 },
    description: 'Soins et boucliers de la compétence +30 %',
    generic: false,
  },
  {
    id: 'coalescence',
    name: 'Coalescence',
    materials: ['gem', 'horn'],
    effect: { skillDamagePerCast: 0.1, skillDamagePerCastMax: 0.5 },
    description: 'Chaque compétence lancée : +10 % de dégâts des compétences pour le reste du combat (max +50 %)',
    generic: false,
  },
  // --- Lot 3 : statuts et énergie ---
  {
    id: 'blight-resistance',
    name: 'Anti-fléaux',
    materials: ['fang', 'fang'],
    effect: { statusImmunity: 1 },
    description: 'Immunité à la brûlure, aux ralentissements, au poison et à la paralysie',
    generic: false,
  },
  {
    id: 'poison-attack',
    name: 'Attaque poison',
    materials: ['gem', 'fang'],
    effect: { poisonDamage: 20, poisonElementalRatio: 0.2 },
    description: 'Les compétences empoisonnent : 20 + 20 % de la puissance élémentaire par seconde pendant 4 s, et la cible reçoit −40 % de soins',
    generic: false,
  },
  {
    id: 'paralysis-attack',
    name: 'Attaque paralysie',
    materials: ['horn', 'feather'],
    effect: { paralysisChance: 0.1 },
    description: 'Les attaques de base ont 10 % de chances de paralyser la cible 1,5 s (elle n’agit plus)',
    generic: false,
  },
  {
    id: 'intimidator',
    name: 'Intimidateur',
    materials: ['fang', 'feather'],
    effect: { energyDrainPerAttack: 5 },
    description: 'Les attaques de base retirent 5 énergie à la cible',
    generic: false,
  },
  {
    id: 'wide-range',
    name: 'Grand rayon',
    materials: ['fang', 'extract'],
    effect: { allyEnergyOnCast: 10 },
    description: 'Quand l’unité lance sa compétence, les alliés à 2 cases ou moins gagnent 10 énergie',
    generic: false,
  },
  {
    id: 'chain-crit',
    name: 'Coups en chaîne',
    materials: ['membrane', 'extract'],
    effect: { energyPerCrit: 5 },
    description: 'Chaque coup critique rend 5 énergie',
    generic: false,
  },
  {
    id: 'stamina-surge',
    name: 'Récupération d’endurance',
    materials: ['feather', 'extract'],
    effect: { energyPerAttack: 3 },
    description: 'Les attaques de base donnent 3 énergie de plus',
    generic: false,
  },
];

/** ⚠️ Pouvoir latent : délai avant que le bonus s'active, en secondes de combat. */
export const LATENT_POWER_DELAY_SECONDS = 10;

/** ⚠️ Attaque explosion : une explosion toutes les N attaques de base qui touchent. */
export const BLAST_EVERY_ATTACKS = 4;

/** ⚠️ Garde renforcée : durée du bonus d'armure et de résistance après une compétence, en secondes. */
export const POST_CAST_DEFENSE_SECONDS = 4;

/** ✅ Bénédiction divine : un coup « béni » n'inflige que la moitié de ses dégâts. */
export const DIVINE_BLESSING_DAMAGE_FACTOR = 0.5;

/** ✅ Attaque poison : durée du poison (secondes) et baisse des soins reçus par une unité empoisonnée. */
export const POISON_SECONDS = 4;
export const POISON_HEALING_REDUCTION = 0.4;

/** ✅ Attaque paralysie : durée de la paralysie, en secondes. */
export const PARALYSIS_SECONDS = 1.5;

/** ✅ Grand rayon : distance (en cases) des alliés qui reçoivent de l'énergie. */
export const WIDE_RANGE_RADIUS = 2;

/** Objet générique (filet de sécurité de `objectFor`, plus utilisé depuis que les 36 objets sont codés) : matériaux +50 %. */
export const GENERIC_OBJECT_EXTRA = 0.5;
