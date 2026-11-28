import { RUN_STRUCTURE } from '../../data/run-balance.ts';
import { TOTAL_HUNTS, type RunState } from '../../run/index.ts';
import { button, el } from '../dom.ts';

/** Où en est une run sauvegardée : « Stage 2 · étape 14 / 30 », ou « Mode infini · étape 34 ». */
export function savedRunPosition(state: RunState): string {
  return state.infinite ? `Mode infini · étape ${state.hunt}` : `Stage ${state.map.stage} · étape ${state.hunt} / ${TOTAL_HUNTS}`;
}

/** Résumé chiffré d'une run sauvegardée. */
export function savedRunSummary(state: RunState): string {
  const units = state.units.length;
  return [
    `${state.defeats} / ${RUN_STRUCTURE.maxDefeats} défaite${state.defeats > 1 ? 's' : ''}`,
    `${state.zennys} zennys`,
    `niveau ${state.level}`,
    `${units} unité${units > 1 ? 's' : ''}`,
  ].join(' · ');
}

/** ✅ Écran de choix à l'ouverture, quand une run est sauvegardée : la continuer, ou en commencer une nouvelle. */
export function renderResumeScreen(saved: RunState, onResume: () => void, onNewRun: () => void): HTMLElement {
  return el('section', { className: 'panel resume-panel' }, [
    el('h2', { text: 'Run sauvegardée' }),
    el('p', {}, [el('strong', { text: savedRunPosition(saved) })]),
    el('p', { className: 'muted', text: savedRunSummary(saved) }),
    saved.phase === 'reward' ? el('p', { className: 'small', text: 'Une récompense t’attend.' }) : null,
    el('div', { className: 'outcome-actions' }, [
      button('Continuer la run', onResume, 'button primary'),
      button('Nouvelle run', onNewRun, 'button'),
    ]),
    el('p', { className: 'muted small', text: 'Une nouvelle run remplace la sauvegarde.' }),
  ]);
}
