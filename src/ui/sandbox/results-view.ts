import { ticksToSeconds, type CombatResult } from '../../combat/index.ts';
import { summarizeUnits, type UnitSummary } from '../../render/combat-summary.ts';
import { formatCombatLog } from '../../render/text-log.ts';
import { rankStars } from '../../rules/ranks.ts';
import { el } from '../dom.ts';

export interface BatchResult {
  readonly combats: number;
  readonly wins: number;
  readonly averageSeconds: number;
}

const round = (value: number): string => String(Math.round(value));

function summaryRow(unit: UnitSummary): HTMLElement {
  const knockedOut = unit.knockedOutAt === null ? '—' : `${ticksToSeconds(unit.knockedOutAt).toFixed(1)} s`;
  return el('tr', { className: unit.side }, [
    el('th', { text: unit.rank > 1 ? `${unit.name} ${rankStars(unit.rank)}` : unit.name, attrs: { scope: 'row' } }),
    el('td', { text: unit.side === 'player' ? 'Joueur' : 'Ennemi' }),
    el('td', { text: round(unit.damageDealt) }),
    el('td', { text: round(unit.damageTaken) }),
    el('td', { text: round(unit.healingDone) }),
    el('td', { text: round(unit.shieldingDone) }),
    el('td', { text: String(unit.skillCasts) }),
    el('td', { text: knockedOut }),
  ]);
}

/** Résultat du dernier combat (bilan par unité, journal) et des simulations en série. */
export function renderResults(result: CombatResult | null, batch: BatchResult | null, error: string | null): HTMLElement {
  const children: (HTMLElement | null)[] = [el('h2', { text: 'Résultats' })];

  if (error !== null) children.push(el('p', { className: 'notice', text: error }));
  if (batch !== null) {
    children.push(
      el('p', {
        className: 'batch',
        text: `Sur ${batch.combats} combats : ${Math.round((batch.wins / batch.combats) * 100)} % de victoires · durée moyenne ${batch.averageSeconds.toFixed(1)} s`,
      }),
    );
  }

  if (result === null) {
    children.push(el('p', { className: 'muted', text: 'Lance un combat pour voir le bilan de chaque unité.' }));
    return el('section', { className: 'panel results' }, children);
  }

  const outcome = result.winner === 'player' ? 'Victoire' : result.winner === 'enemy' ? 'Défaite' : 'Interrompu';
  const units = summarizeUnits(result.events).sort((a, b) => b.damageDealt - a.damageDealt);
  const headers = ['Unité', 'Camp', 'Dégâts infligés', 'Dégâts subis', 'Soins', 'Boucliers', 'Compétences', 'K.O.'];

  children.push(
    el('p', { className: 'outcome', text: `${outcome} en ${ticksToSeconds(result.durationTicks).toFixed(1)} s` }),
    el('div', { className: 'table-wrap' }, [
      el('table', {}, [
        el('thead', {}, [el('tr', {}, headers.map((header) => el('th', { text: header, attrs: { scope: 'col' } })))]),
        el('tbody', {}, units.map(summaryRow)),
      ]),
    ]),
    el('details', {}, [el('summary', { text: 'Journal du combat' }), el('pre', { className: 'log', text: formatCombatLog(result.events).join('\n') })]),
  );
  return el('section', { className: 'panel results' }, children);
}
