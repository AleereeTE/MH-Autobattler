import type { CombatResult } from '../../combat/index.ts';
import { findUnit } from '../../data/units/index.ts';
import type { BoardScene } from '../../render/board-canvas.ts';
import { createReplay } from '../../render/replay.ts';
import { hexKey } from '../../core/hex.ts';
import { boardUnits, talentTraitBonus, unitAt } from '../../run/index.ts';
import { button, el, select } from '../dom.ts';
import { BoardView } from '../shared/board-view.ts';
import { PortraitStore } from '../shared/portraits.ts';
import { ReplayPlayer } from '../shared/replay-player.ts';
import { ResultsView } from '../shared/results-view.ts';
import { showPopover } from '../shared/popover.ts';
import { combatUnitPreview } from '../shared/previews.ts';
import { frameScene, frameUnitAt, staticUnitScene } from '../shared/scenes.ts';
import { unitCard } from '../shared/unit-card.ts';
import { renderTraits } from '../shared/traits-view.ts';
import { openPlanner } from '../planner/planner-dialog.ts';
import { renderPlanPanel } from '../planner/plan-panel.ts';
import { teamPlan } from '../planner/team-plan.ts';
import { renderBench } from './bench-view.ts';
import { RunController } from './controller.ts';
import { renderHud } from './hud-view.ts';
import { renderOutcome } from './outcome-view.ts';
import { renderOwnedTalents, renderTalentChoice } from './talent-view.ts';
import { renderShop } from './shop-view.ts';
import { renderMap } from './map-view.ts';
import { renderInventory, renderSelection } from './side-panels.ts';
import { renderStop } from './stop-views.ts';

const SPEEDS = [1, 2, 4];

/** Graine d'une nouvelle run (le hasard de l'interface ; le jeu, lui, ne dépend que de cette graine). */
function newSeed(): number {
  return Date.now() % 2_147_483_647;
}

/** La run en cours survit aux changements d'onglet (elle n'est pas encore sauvegardée entre deux visites). */
let controller: RunController | null = null;

/**
 * Page « Mode run » : préparation (boutique, réserve, plateau, équipement), combat regardé sur le plateau,
 * puis récompense ou défaite, jusqu'à la fin de la run.
 */
export function mountRun(root: HTMLElement): () => void {
  const run = (controller ??= new RunController(newSeed()));
  const plan = teamPlan();
  let shownFight: CombatResult | null = null;
  let lastFight: CombatResult | null = null;
  let confirmRestart = false;

  const board = new BoardView(
    (hex) => run.clickBoard(hex),
    (hex, x, y) => {
      // Clic droit : état de l'unité en plein combat, ou fiche d'une unité posée (la tienne ou un monstre ennemi).
      if (run.watching !== null) {
        const frame = player.currentFrame();
        const unit = frame === null ? undefined : frameUnitAt(frame, hex);
        if (unit !== undefined) showPopover(combatUnitPreview(unit), x, y);
        return;
      }
      const own = unitAt(run.state, { area: 'board', hex });
      const definition = own === undefined ? undefined : findUnit(own.unitId);
      if (own !== undefined && definition !== undefined) {
        showPopover(unitCard(definition, own.equipment, own.rank), x, y);
        return;
      }
      const enemy = run.state.enemy.find((placement) => hexKey(placement.position) === hexKey(hex));
      if (enemy !== undefined) showPopover(unitCard(enemy.unit, enemy.equipment ?? [], enemy.rank ?? 1, enemy.bonus), x, y);
    },
  );
  const results = new ResultsView();
  const player = new ReplayPlayer(
    (frame) => {
      board.render(frameScene(frame, portraits));
      results.showUntil(frame.tick);
    },
    () => renderPanels(),
  );
  const portraits = new PortraitStore(() => (run.watching === null ? board.render(prepScene()) : player.redraw()));

  const hudSlot = el('div');
  const noticeSlot = el('div');
  const benchSlot = el('div');
  const shopSlot = el('div');
  const outcomeSlot = el('div');
  const selectionSlot = el('div');
  const inventorySlot = el('div');
  const traitsSlot = el('div');
  const planSlot = el('div');
  const mapSlot = el('div');
  const stopSlot = el('div');
  const talentsSlot = el('div');

  /** Plateau pendant la préparation : tes unités posées et l'escouade de la chasse. */
  function prepScene(): BoardScene {
    const { state, selection } = run;
    const selected = run.selectedUnit();
    const player = boardUnits(state).flatMap((unit) => {
      const definition = findUnit(unit.unitId);
      if (definition === undefined || unit.location.area !== 'board') return [];
      const position = unit.location.hex;
      return [staticUnitScene({ key: `p${unit.uid}`, unit: definition, rank: unit.rank, side: 'player', position, selected: unit.uid === selected?.uid }, portraits)];
    });
    const enemy = state.enemy.map((placement, index) =>
      staticUnitScene(
        {
          key: `e${index}`,
          unit: placement.unit,
          rank: placement.rank ?? 1,
          side: 'enemy',
          position: placement.position,
          selected: selection?.kind === 'enemy' && selection.index === index,
        },
        portraits,
      ),
    );
    const highlight =
      selected?.location.area === 'board'
        ? selected.location.hex
        : selection?.kind === 'enemy'
          ? (state.enemy[selection.index]?.position ?? null)
          : null;
    return { units: [...player, ...enemy], highlight };
  }

  function replayControls(): HTMLElement | null {
    if (run.watching === null || player.isFinished) return null;
    const speed = select(SPEEDS.map((value) => ({ value: String(value), label: `×${value}` })), String(player.speed));
    speed.setAttribute('aria-label', 'Vitesse du combat');
    speed.addEventListener('change', () => {
      player.speed = Number(speed.value);
    });
    return el('div', { className: 'row' }, [
      button(player.isPlaying ? 'Pause' : 'Lecture', () => player.toggle(), 'button small'),
      speed,
      button('Passer', () => player.skipToEnd(), 'button small'),
    ]);
  }

  function restartButton(): HTMLElement {
    if (run.state.phase === 'over') return el('span');
    return button(
      confirmRestart ? 'Confirmer : abandonner la run' : 'Recommencer',
      () => {
        if (!confirmRestart) {
          confirmRestart = true;
          renderPanels();
          return;
        }
        startNewRun();
      },
      confirmRestart ? 'button small danger' : 'button small',
    );
  }

  function startNewRun(): void {
    confirmRestart = false;
    lastFight = null;
    results.show(null, null, null);
    run.newRun(newSeed());
  }

  function renderPanels(): void {
    hudSlot.replaceChildren(renderHud(run, replayControls(), restartButton(), run.watching === null || player.isFinished));
    noticeSlot.replaceChildren(...(run.notice === null ? [] : [el('p', { className: 'notice', text: run.notice })]));
    benchSlot.replaceChildren(renderBench(run, portraits));
    shopSlot.replaceChildren(renderShop(run, portraits, plan));
    const outcome = renderTalentChoice(run, portraits) ?? renderOutcome(run, run.watching === null || player.isFinished, portraits, startNewRun);
    outcomeSlot.replaceChildren(...(outcome === null ? [] : [outcome]));
    const owned = renderOwnedTalents(run);
    talentsSlot.replaceChildren(...(owned === null ? [] : [owned]));
    mapSlot.replaceChildren(...(run.state.phase === 'over' ? [] : [renderMap(run, portraits)]));
    const stop = renderStop(run);
    stopSlot.replaceChildren(...(stop === null ? [] : [stop]));
    selectionSlot.replaceChildren(renderSelection(run));
    inventorySlot.replaceChildren(renderInventory(run));
    const ownedIds = new Set(run.state.units.map((unit) => unit.unitId));
    planSlot.replaceChildren(renderPlanPanel(plan, ownedIds, portraits, () => openPlanner(plan, portraits)));
    const playerUnits = boardUnits(run.state).flatMap((unit) => findUnit(unit.unitId) ?? []);
    traitsSlot.replaceChildren(renderTraits(playerUnits, run.state.enemy.map((placement) => placement.unit), talentTraitBonus(run.state)));
  }

  function render(): void {
    const watched = run.watching?.result ?? null;
    if (watched !== null && watched !== shownFight) {
      // Nouveau combat à regarder : on le rejoue depuis le début, bilan en direct.
      shownFight = watched;
      lastFight = watched;
      results.show(watched, null, null, 0);
      player.load(createReplay(watched.events));
    } else if (watched === null && shownFight !== null) {
      // Retour à la préparation : le bilan du dernier combat reste affiché en entier.
      shownFight = null;
      player.stop();
      results.show(lastFight, null, null);
    }
    if (run.watching === null) board.render(prepScene());
    confirmRestart = false;
    renderPanels();
  }

  const unsubscribe = run.subscribe(render);
  // Le plan change depuis le planificateur : boutique et encadré « Plan » suivent.
  const unsubscribePlan = plan.subscribe(renderPanels);
  root.replaceChildren(
    el('header', { className: 'page-header' }, [
      el('p', {
        className: 'muted',
        text: '30 étapes en 3 stages : choisis ta route sur la carte (chasses, quêtes urgentes, forges, marchands), un boss à la fin de chaque stage. 3 défaites et la run s’arrête. Clic droit sur une unité (même en combat), un matériau ou une case de la carte pour son aperçu. Les valeurs sont provisoires.',
      }),
    ]),
    hudSlot,
    noticeSlot,
    el('div', { className: 'run' }, [
      el('section', { className: 'board-column' }, [mapSlot, board.element, benchSlot, shopSlot, results.element]),
      el('aside', { className: 'details-column' }, [outcomeSlot, stopSlot, selectionSlot, inventorySlot, talentsSlot, planSlot, traitsSlot]),
    ]),
  );
  results.show(lastFight, null, null);
  render();

  return () => {
    unsubscribe();
    unsubscribePlan();
    player.stop();
  };
}
