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

/** Nombre de ticks entre deux mises à jour du bilan pendant le replay (2 ticks = 0,1 s de combat). */
const REFRESH_TICKS = 2;

const HEADERS = ['Unité', 'Camp', 'Dégâts infligés', 'Dégâts subis', 'Soins', 'Boucliers', 'Compétences', 'K.O.'];

/** Ligne d'état : « Combat en cours · 12,3 s » pendant le replay, le résultat une fois la fin atteinte. */
export function outcomeLine(result: CombatResult, tick: number): string {
  if (tick < result.durationTicks) return `Combat en cours · ${ticksToSeconds(tick).toFixed(1)} s`;
  const outcome = result.winner === 'player' ? 'Victoire' : result.winner === 'enemy' ? 'Défaite' : 'Interrompu';
  return `${outcome} en ${ticksToSeconds(result.durationTicks).toFixed(1)} s`;
}

function summaryRow(unit: UnitSummary): HTMLElement {
  const knockedOut = unit.knockedOutAt === null ? '—' : `${ticksToSeconds(unit.knockedOutAt).toFixed(1)} s`;
  return el('tr', { className: unit.knockedOutAt === null ? unit.side : `${unit.side} ko` }, [
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

/**
 * Panneau « Résultats » : bilan par unité, journal du combat et simulations en série.
 * Pendant le replay, le bilan et le journal suivent l'instant affiché sur le plateau ;
 * ils sont mis à jour sur place, pour que le journal garde son ouverture et son défilement.
 */
export class ResultsView {
  readonly element = el('section', { className: 'panel results' });
  private readonly outcome = el('p', { className: 'outcome' });
  private readonly rows = el('tbody');
  private readonly log = el('pre', { className: 'log' });
  private readonly logDetails = el('details', {}, [el('summary', { text: 'Journal du combat' }), this.log]);
  private result: CombatResult | null = null;
  private lastStep: number | null = null;

  /** Affiche un nouveau contenu ; `tick` = instant du combat à montrer (tout le combat par défaut). */
  show(result: CombatResult | null, batch: BatchResult | null, error: string | null, tick = Infinity): void {
    if (result !== this.result) this.log.scrollTop = 0;
    this.result = result;
    const children: HTMLElement[] = [el('h2', { text: 'Résultats' })];
    if (error !== null) children.push(el('p', { className: 'notice', text: error }));
    if (batch !== null) {
      const winRate = Math.round((batch.wins / batch.combats) * 100);
      children.push(
        el('p', {
          className: 'batch',
          text: `Sur ${batch.combats} combats : ${winRate} % de victoires · durée moyenne ${batch.averageSeconds.toFixed(1)} s`,
        }),
      );
    }

    if (result === null) {
      children.push(el('p', { className: 'muted', text: 'Lance un combat pour voir le bilan de chaque unité.' }));
    } else {
      children.push(
        this.outcome,
        el('div', { className: 'table-wrap' }, [
          el('table', {}, [
            el('thead', {}, [el('tr', {}, HEADERS.map((header) => el('th', { text: header, attrs: { scope: 'col' } })))]),
            this.rows,
          ]),
        ]),
        this.logDetails,
      );
    }
    this.element.replaceChildren(...children);
    this.lastStep = null;
    this.showUntil(tick);
  }

  /** Fait suivre au bilan l'instant du replay (mis à jour toutes les 0,1 s de combat au plus). */
  showUntil(tick: number): void {
    const result = this.result;
    if (result === null) return;
    const finished = tick >= result.durationTicks;
    const step = finished ? Infinity : Math.floor(tick / REFRESH_TICKS);
    if (step === this.lastStep) return;
    this.lastStep = step;

    this.outcome.textContent = outcomeLine(result, tick);
    const units = summarizeUnits(result.events, tick).sort((a, b) => b.damageDealt - a.damageDealt);
    this.rows.replaceChildren(...units.map(summaryRow));

    // Le journal défile tout seul s'il était déjà en bas (on suit le combat), sinon il reste où il est.
    const followsEnd = this.log.scrollTop + this.log.clientHeight >= this.log.scrollHeight - 8;
    this.log.textContent = formatCombatLog(result.events, tick).join('\n');
    if (followsEnd) this.log.scrollTop = this.log.scrollHeight;
  }
}
