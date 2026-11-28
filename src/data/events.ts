import type { StatBonus } from './definitions.ts';
import type { TalentTier } from './talents.ts';

/**
 * Cases Événement (game-design §2.1) : une petite situation avec un choix, découverte en arrivant sur la case.
 * ✅ Les 10 événements et leurs choix sont validés (2026-11-28) · ⚠️ toutes les valeurs sont provisoires.
 */

/** Effet d'un choix. Chaque effet est appliqué par `run/events.ts`. */
export type EventEffect =
  /** Reprendre la route sans rien faire. */
  | { readonly kind: 'leave' }
  /** Payer, puis un objet complet au hasard (selon la chance), sinon un matériau au hasard. */
  | { readonly kind: 'mysteryBox'; readonly price: number; readonly objectChance: number }
  /** Des zennys tout de suite, mais la prochaine chasse (hors boss) est renforcée comme une quête urgente. */
  | { readonly kind: 'zennysForDanger'; readonly zennys: number }
  /** Payer, puis un chasseur ★1 tiré comme en boutique rejoint la réserve. */
  | { readonly kind: 'recruitHunter'; readonly price: number }
  /** Bonus de statistiques pour toute l'équipe au prochain combat. */
  | { readonly kind: 'nextCombatBonus'; readonly bonus: StatBonus }
  /** Un exemplaire de plus d'une unité possédée, au choix (pris dans le stock). */
  | { readonly kind: 'extraCopy' }
  /** Payer pour effacer une défaite. */
  | { readonly kind: 'healDefeat'; readonly price: number }
  /** Donner des matériaux de l'inventaire (au choix) contre des zennys. */
  | { readonly kind: 'tradeMaterials'; readonly materials: number; readonly zennys: number }
  /** Chance qu'un monstre de ce coût rejoigne la réserve au ★1 ; sinon, la prochaine chasse est renforcée. */
  | { readonly kind: 'captureGamble'; readonly chance: number; readonly cost: number }
  /** Des matériaux au hasard. */
  | { readonly kind: 'materials'; readonly amount: number }
  /** Des zennys. */
  | { readonly kind: 'zennys'; readonly amount: number }
  /** Miser des zennys : selon la chance, on gagne `win` zennys (la mise est perdue sinon). */
  | { readonly kind: 'bet'; readonly stake: number; readonly win: number; readonly chance: number }
  /** Payer, puis choisir un talent de cette rareté parmi 3 propositions, sans relance (en plus de ceux de la run). */
  | { readonly kind: 'buyTalent'; readonly price: number; readonly tier: TalentTier };

export interface EventChoice {
  readonly label: string;
  readonly description: string;
  readonly effect: EventEffect;
}

export interface EventDefinition {
  readonly id: string;
  readonly name: string;
  /** La situation, racontée au joueur. */
  readonly text: string;
  readonly choices: readonly EventChoice[];
}

const LEAVE = (label: string): EventChoice => ({ label, description: 'Tu reprends la route.', effect: { kind: 'leave' } });

export const EVENTS: readonly EventDefinition[] = [
  {
    id: 'felyne-box',
    name: 'Boîte du Felyne',
    text: 'Un Felyne marchand te tend une boîte fermée en ronronnant : « Surprise garantie, nya ! »',
    choices: [
      {
        label: 'Acheter la boîte',
        description: '5 zennys : un objet complet au hasard (1 chance sur 2), sinon un matériau.',
        effect: { kind: 'mysteryBox', price: 5, objectChance: 0.5 },
      },
      LEAVE('Partir'),
    ],
  },
  {
    id: 'wyvern-egg',
    name: 'Œuf de wyverne',
    text: 'Un nid sans surveillance, et un œuf de wyverne encore chaud. La Guilde paie bien ce genre de trouvaille…',
    choices: [
      {
        label: 'Rapporter l’œuf',
        description: '+12 zennys, mais la prochaine chasse (hors boss) est renforcée comme une quête urgente.',
        effect: { kind: 'zennysForDanger', zennys: 12 },
      },
      LEAVE('Le laisser'),
    ],
  },
  {
    id: 'wounded-hunter',
    name: 'Chasseur blessé',
    text: 'Un chasseur de la Guilde est étendu au bord du chemin, à bout de forces.',
    choices: [
      {
        label: 'Le soigner',
        description: '3 zennys de remèdes : un chasseur ★1 tiré au hasard (comme en boutique) rejoint ta réserve.',
        effect: { kind: 'recruitHunter', price: 3 },
      },
      LEAVE('Passer son chemin'),
    ],
  },
  {
    id: 'camp-canteen',
    name: 'Cantine du campement',
    text: 'Le campement de la Guilde est installé pour la nuit. Les cuisiniers Felynes s’affairent.',
    choices: [
      {
        label: 'Repas de chasse',
        description: 'Toute l’équipe +20 % de PV au prochain combat.',
        effect: { kind: 'nextCombatBonus', bonus: { hpPercent: 0.2 } },
      },
      {
        label: 'Entraînement',
        description: 'Un exemplaire de plus d’une unité que tu possèdes, au choix.',
        effect: { kind: 'extraCopy' },
      },
    ],
  },
  {
    id: 'guild-doctor',
    name: 'Médecin de la Guilde',
    text: 'Un médecin de la Guilde propose de remettre ton équipe sur pied, moyennant finances.',
    choices: [
      { label: 'Se faire soigner', description: '15 zennys : efface une défaite.', effect: { kind: 'healDefeat', price: 15 } },
      LEAVE('Partir'),
    ],
  },
  {
    id: 'research-commission',
    name: 'Commission de recherche',
    text: 'Un chercheur de la Commission cherche des échantillons pour ses travaux.',
    choices: [
      {
        label: 'Donner 2 matériaux',
        description: 'Deux matériaux de ton inventaire, au choix : +12 zennys.',
        effect: { kind: 'tradeMaterials', materials: 2, zennys: 12 },
      },
      LEAVE('Refuser'),
    ],
  },
  {
    id: 'sleeping-monster',
    name: 'Monstre endormi',
    text: 'Un grand monstre dort profondément au milieu du chemin.',
    choices: [
      {
        label: 'Tenter la capture',
        description: '60 % de chances qu’un monstre de coût 3 au hasard rejoigne ta réserve au ★1 ; sinon, il se réveille et la prochaine chasse (hors boss) est renforcée.',
        effect: { kind: 'captureGamble', chance: 0.6, cost: 3 },
      },
      { label: 'Prélever un matériau en douce', description: '+1 matériau au hasard.', effect: { kind: 'materials', amount: 1 } },
    ],
  },
  {
    id: 'overturned-caravan',
    name: 'Caravane renversée',
    text: 'Une caravane de marchands a été renversée par un monstre. Les marchands, sonnés, ramassent ce qu’ils peuvent.',
    choices: [
      { label: 'Fouiller l’épave', description: '2 matériaux au hasard.', effect: { kind: 'materials', amount: 2 } },
      { label: 'Escorter les marchands', description: '+8 zennys.', effect: { kind: 'zennys', amount: 8 } },
    ],
  },
  {
    id: 'felyne-bet',
    name: 'Pari des Felynes',
    text: 'Des Felynes parient sur la course de deux Aptonoth. « Tu mises, nya ? »',
    choices: [
      {
        label: 'Miser 5 zennys',
        description: '1 chance sur 2 de gagner 12 zennys (la mise est perdue sinon).',
        effect: { kind: 'bet', stake: 5, win: 12, chance: 0.5 },
      },
      LEAVE('Ne pas jouer'),
    ],
  },
  {
    id: 'ancient-stele',
    name: 'Stèle ancienne',
    text: 'Une stèle couverte de runes anciennes vibre d’une énergie étrange.',
    choices: [
      {
        label: 'Faire une offrande',
        description: '10 zennys : choisis un talent de chasseur argent parmi 3 (sans relance), en plus des talents de la run.',
        effect: { kind: 'buyTalent', price: 10, tier: 'silver' },
      },
      LEAVE('Partir'),
    ],
  },
];

export function findEvent(id: string): EventDefinition | undefined {
  return EVENTS.find((event) => event.id === id);
}
