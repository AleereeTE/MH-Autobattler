import { ticksToSeconds, type CombatEvent, type UnitSnapshot, type Winner } from '../combat/index.ts';
import { rankStars } from '../rules/ranks.ts';

/**
 * Rendu texte d'un combat : transforme les événements en lignes lisibles.
 * C'est un « rendu » au même titre que le rendu Canvas : il ne fait que lire les événements.
 */

const DAMAGE_LABELS = { physical: 'physiques', elemental: 'élémentaires' } as const;
const CAUSE_LABELS = { attack: '', skill: '', burn: ' (brûlure)', lightning: ' (éclair)' } as const;

function unitLabel(unit: UnitSnapshot): string {
  const stars = unit.rank > 1 ? ` ${rankStars(unit.rank)}` : '';
  return `${unit.name}${stars} [${unit.side === 'player' ? 'J' : 'E'}${unit.uid}]`;
}

function winnerLabel(winner: Winner): string {
  if (winner === 'player') return 'victoire du joueur';
  if (winner === 'enemy') return 'défaite du joueur';
  return 'interrompu par la limite de sécurité (bug probable)';
}

/** Lignes du journal, jusqu'à `untilTick` (tout le combat par défaut). */
export function formatCombatLog(events: readonly CombatEvent[], untilTick = Infinity): string[] {
  const labels = new Map<number, string>();
  const name = (uid: number): string => labels.get(uid) ?? `#${uid}`;
  const lines: string[] = [];

  for (const event of events) {
    if (event.tick > untilTick) break;
    const time = `[${ticksToSeconds(event.tick).toFixed(2).padStart(6)} s]`;
    switch (event.type) {
      case 'combatStart': {
        for (const unit of event.units) labels.set(unit.uid, unitLabel(unit));
        lines.push(`${time} Début du combat : ${event.units.map(unitLabel).join(', ')}`);
        for (const [side, traits] of Object.entries(event.traits)) {
          const active = traits.filter((trait) => trait.activeCount !== null).map((trait) => `${trait.name} (${trait.count})`);
          lines.push(`${time}   Traits actifs ${side === 'player' ? 'joueur' : 'ennemi'} : ${active.join(', ') || 'aucun'}`);
        }
        break;
      }
      case 'move':
        lines.push(`${time} ${name(event.uid)} se déplace (${event.from.col},${event.from.row}) → (${event.to.col},${event.to.row})`);
        break;
      case 'leap':
        lines.push(`${time} ${name(event.uid)} bondit en (${event.to.col},${event.to.row})`);
        break;
      case 'attack':
        lines.push(`${time} ${name(event.uid)} attaque ${name(event.targetUid)}`);
        break;
      case 'damage':
        lines.push(
          `${time}    ${name(event.targetUid)} subit ${Math.round(event.amount)} dégâts ${DAMAGE_LABELS[event.damageType]}` +
            `${CAUSE_LABELS[event.cause]}${event.isCrit ? ' (critique !)' : ''}` +
            `${event.absorbed > 0 ? `, dont ${Math.round(event.absorbed)} absorbés` : ''} — PV : ${Math.round(event.hpAfter)}`,
        );
        break;
      case 'heal':
        lines.push(`${time}    ${name(event.targetUid)} récupère ${Math.round(event.amount)} PV — PV : ${Math.round(event.hpAfter)}`);
        break;
      case 'shield':
        lines.push(`${time}    ${name(event.uid)} gagne un bouclier de ${Math.round(event.amount)}`);
        break;
      case 'status':
        if (event.status === 'haste') lines.push(`${time}    ${name(event.uid)} accélère`);
        break; // brûlure et ralentissement : trop fréquents pour le journal
      case 'skillCast':
        lines.push(`${time} ${name(event.uid)} prépare « ${event.skillName} »`);
        break;
      case 'skillResolve':
        lines.push(`${time} ${name(event.uid)} déclenche « ${event.skillName} » !`);
        break;
      case 'lightning':
        lines.push(`${time} Un éclair frappe ${name(event.targetUid)}`);
        break;
      case 'dodge':
        lines.push(`${time}    ${name(event.targetUid)} esquive l’attaque de ${name(event.sourceUid)}`);
        break;
      case 'death':
        lines.push(`${time} ${name(event.uid)} est K.O.`);
        break;
      case 'suddenDeath':
        lines.push(`${time} MORT SUBITE : les dégâts augmentent, les soins diminuent`);
        break;
      case 'combatEnd':
        lines.push(`${time} Fin du combat : ${winnerLabel(event.winner)}`);
        break;
    }
  }
  return lines;
}
