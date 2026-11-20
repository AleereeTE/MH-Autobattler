import type { StatBonus } from './definitions.ts';

/**
 * Matériaux et objets (docs/prototype-content.md). ⚠️ Valeurs provisoires.
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
];

/** ⚠️ Objet générique : les statistiques des deux matériaux, +50 %, sans effet spécial. */
export const GENERIC_OBJECT_EXTRA = 0.5;
