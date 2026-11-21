import { simulateCombat, ticksToSeconds, type CombatResult } from '../../combat/index.ts';
import { hexKey } from '../../core/hex.ts';
import { DEMO_PLAYER_TEAM, ENEMY_SQUADS } from '../../data/squads.ts';
import type { BoardScene } from '../../render/board-canvas.ts';
import { createReplay } from '../../render/replay.ts';
import { button, el, select } from '../dom.ts';
import { BoardView } from '../shared/board-view.ts';
import { SandboxModel, sideOf } from './model.ts';
import { renderPalette } from './palette-view.ts';
import { PortraitStore } from '../shared/portraits.ts';
import { ReplayPlayer } from '../shared/replay-player.ts';
import { ResultsView, type BatchResult } from '../shared/results-view.ts';
import { loadComposition, saveComposition } from './storage.ts';
import { renderTraits } from '../shared/traits-view.ts';
import { renderUnitPanel } from './unit-panel.ts';
import { showPopover } from '../shared/popover.ts';
import { combatUnitPreview } from '../shared/previews.ts';
import { frameScene, frameUnitAt, staticUnitScene } from '../shared/scenes.ts';
import { unitCard } from '../shared/unit-card.ts';

const BATCH_SIZE = 100;
const SPEEDS = [0.5, 1, 2, 4];

/**
 * Page « bac à sable » : composer les deux camps, lancer un combat, le regarder,
 * et lancer des séries de combats pour repérer les unités trop fortes.
 */
export function mountSandbox(root: HTMLElement): () => void {
  const model = new SandboxModel();
  let mode: 'edit' | 'replay' = 'edit';
  let result: CombatResult | null = null;
  let batch: BatchResult | null = null;
  let error: string | null = null;

  const board = new BoardView(
    (hex) => {
      if (mode === 'edit') model.clickCell(hex);
    },
    (hex, x, y) => {
      // Clic droit : fiche de l'unité posée, ou son état en plein combat.
      if (mode === 'edit') {
        const placed = model.placedUnits().find((candidate) => hexKey(candidate.position) === hexKey(hex));
        if (placed !== undefined) showPopover(unitCard(placed.unit, placed.equipment, placed.rank), x, y);
        return;
      }
      const frame = player.currentFrame();
      const unit = frame === null ? undefined : frameUnitAt(frame, hex);
      if (unit !== undefined) showPopover(combatUnitPreview(unit), x, y);
    },
  );
  const player = new ReplayPlayer(
    (frame) => {
      board.render(frameScene(frame, portraits));
      results.showUntil(frame.tick);
      status.textContent = `${ticksToSeconds(frame.tick).toFixed(1)} s${frame.suddenDeath ? ' · mort subite' : ''}`;
    },
    () => renderToolbar(),
  );
  // Chaque portrait chargé redessine le plateau.
  const portraits = new PortraitStore(() => {
    if (mode === 'edit') board.render(editScene());
    else player.redraw();
  });

  const toolbar = el('div', { className: 'toolbar' });
  const status = el('span', { className: 'status' });
  const paletteColumn = el('aside', { className: 'palette-column' });
  const detailsColumn = el('aside', { className: 'details-column' });
  const results = new ResultsView();
  const seedInput = el('input', { attrs: { type: 'number', step: '1', value: '1', 'aria-label': 'Graine du combat' } });
  const squadSelect = select(
    ENEMY_SQUADS.map((squad) => ({ value: squad.id, label: `Escouade ${squad.name}` })),
    'medium',
  );

  function editScene(): BoardScene {
    const selected = model.selectedPlaced();
    return {
      units: model.placedUnits().map((placed) =>
        staticUnitScene(
          {
            key: hexKey(placed.position),
            unit: placed.unit,
            rank: placed.rank,
            side: sideOf(placed.position),
            position: placed.position,
            selected: placed === selected,
          },
          portraits,
        ),
      ),
      highlight: selected?.position ?? null,
    };
  }

  function backToEdit(): void {
    player.stop();
    mode = 'edit';
    board.render(editScene());
    renderToolbar();
    renderResultsSlot();
  }

  function renderToolbar(): void {
    if (mode === 'edit') {
      const counts = `${model.unitsOf('player').length} unités joueur · ${model.unitsOf('enemy').length} ennemies`;
      toolbar.replaceChildren(el('span', { className: 'mode', text: 'Composition' }), el('span', { className: 'status', text: counts }));
      return;
    }
    const speedSelect = select(SPEEDS.map((speed) => ({ value: String(speed), label: `×${speed}` })), String(player.speed));
    speedSelect.setAttribute('aria-label', 'Vitesse du replay');
    speedSelect.addEventListener('change', () => {
      player.speed = Number(speedSelect.value);
    });
    toolbar.replaceChildren(
      el('span', { className: 'mode', text: 'Replay' }),
      button(player.isPlaying ? 'Pause' : 'Lecture', () => player.toggle(), 'button small'),
      speedSelect,
      status,
      button('Modifier les équipes', backToEdit, 'button small'),
    );
  }

  function renderSidebars(): void {
    paletteColumn.replaceChildren(renderPalette(model));
    detailsColumn.replaceChildren(renderUnitPanel(model), renderTraits(
        model.unitsOf('player').map((placed) => placed.unit),
        model.unitsOf('enemy').map((placed) => placed.unit),
      ));
  }

  /** Pendant le replay, le bilan suit l'instant affiché ; sinon il montre tout le combat. */
  function renderResultsSlot(): void {
    results.show(result, batch, error, mode === 'replay' && player.isLoaded ? player.currentTick : Infinity);
  }

  function seed(): number {
    return Math.trunc(Number(seedInput.value) || 0);
  }

  function runCombat(): void {
    try {
      result = simulateCombat(model.toSetup(), seed());
      error = null;
      mode = 'replay';
      player.load(createReplay(result.events));
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
    renderResultsSlot();
    renderToolbar();
  }

  function runBatch(): void {
    try {
      const setup = model.toSetup();
      let wins = 0;
      let ticks = 0;
      for (let index = 1; index <= BATCH_SIZE; index++) {
        const outcome = simulateCombat(setup, index);
        if (outcome.winner === 'player') wins += 1;
        ticks += outcome.durationTicks;
      }
      batch = { combats: BATCH_SIZE, wins, averageSeconds: ticksToSeconds(ticks / BATCH_SIZE) };
      error = null;
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
    renderResultsSlot();
  }

  model.subscribe(() => {
    saveComposition(model.save());
    batch = null;
    if (mode === 'replay') player.stop();
    mode = 'edit';
    board.render(editScene());
    renderSidebars();
    renderToolbar();
    renderResultsSlot();
  });

  root.replaceChildren(
    el('header', { className: 'page-header' }, [
      el('p', {
        className: 'muted',
        text: 'Compose les deux camps, lance un combat et regarde-le. Clic droit sur une unité (même en combat) ou un matériau pour son aperçu. Même graine = même combat. Les valeurs sont provisoires.',
      }),
    ]),
    el('div', { className: 'sandbox' }, [
      paletteColumn,
      el('section', { className: 'board-column' }, [
        toolbar,
        board.element,
        el('div', { className: 'controls' }, [
          el('label', { className: 'seed' }, ['Graine ', seedInput]),
          button('Lancer le combat', runCombat, 'button primary'),
          button(`Simuler ${BATCH_SIZE} combats`, runBatch),
        ]),
        el('div', { className: 'controls' }, [
          squadSelect,
          button('Charger l’escouade', () => {
            const squad = ENEMY_SQUADS.find((candidate) => candidate.id === squadSelect.value);
            if (squad !== undefined) model.loadSquad('enemy', squad);
          }),
          button('Équipe de démo', () => model.loadSquad('player', DEMO_PLAYER_TEAM)),
          button('Vider le joueur', () => model.clearSide('player')),
          button('Vider l’ennemi', () => model.clearSide('enemy')),
        ]),
        results.element,
      ]),
      detailsColumn,
    ]),
  );

  const saved = loadComposition();
  if (saved !== null && saved.length > 0) {
    model.restore(saved);
  } else {
    model.loadSquad('player', DEMO_PLAYER_TEAM);
    const medium = ENEMY_SQUADS.find((squad) => squad.id === 'medium');
    if (medium !== undefined) model.loadSquad('enemy', medium);
  }
  // En quittant la page : arrêter le replay en cours.
  return () => player.stop();
}
