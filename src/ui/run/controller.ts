import type { CombatResult } from '../../combat/index.ts';
import { hexKey, type Hex } from '../../core/hex.ts';
import {
  buy,
  chooseReward,
  createRun,
  equipFromInventory,
  fight,
  findRunUnit,
  huntInfo,
  isPlayerHex,
  levelUp,
  moveUnit,
  reroll,
  sellUnit,
  unequip,
  unitAt,
  type ActionResult,
  type RunState,
  type RunUnit,
} from '../../run/index.ts';

/**
 * État de la page « Mode run » : la run, ce qui est sélectionné, le combat regardé.
 * Les vues lisent cet état et appellent ses méthodes ; elles sont prévenues à chaque changement.
 */

export type RunSelection = { readonly kind: 'unit'; readonly uid: number } | { readonly kind: 'enemy'; readonly index: number } | null;

/** Combat qu'on est en train de regarder (la run, elle, a déjà avancé). */
export interface WatchedFight {
  readonly result: CombatResult;
  readonly hunt: number;
  readonly boss: boolean;
  /** Valeurs d'avant le combat, affichées pendant le replay pour ne pas dévoiler l'issue. */
  readonly before: { readonly zennys: number; readonly defeats: number; readonly itemRemovers: number };
}

export class RunController {
  state: RunState;
  selection: RunSelection = null;
  /** Message affiché après une action refusée (zennys insuffisants, réserve pleine…). */
  notice: string | null = null;
  /** Combat en cours de visionnage ; null pendant la préparation. */
  watching: WatchedFight | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(seed: number) {
    this.state = createRun(seed);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private changed(): void {
    for (const listener of this.listeners) listener();
  }

  private apply(result: ActionResult): void {
    this.notice = result.ok ? null : result.reason;
    this.changed();
  }

  /** La préparation est possible : pas de combat regardé, run en cours. */
  get canPrepare(): boolean {
    return this.watching === null && this.state.phase === 'prep';
  }

  selectedUnit(): RunUnit | null {
    return this.selection?.kind === 'unit' ? (findRunUnit(this.state, this.selection.uid) ?? null) : null;
  }

  newRun(seed: number): void {
    this.state = createRun(seed);
    this.selection = null;
    this.watching = null;
    this.notice = null;
    this.changed();
  }

  buy(slot: number): void {
    if (this.canPrepare) this.apply(buy(this.state, slot));
  }

  reroll(): void {
    if (this.canPrepare) this.apply(reroll(this.state));
  }

  levelUp(): void {
    if (this.canPrepare) this.apply(levelUp(this.state));
  }

  sellSelected(): void {
    const unit = this.selectedUnit();
    if (unit === null || !this.canPrepare) return;
    this.selection = null;
    this.apply(sellUnit(this.state, unit.uid));
  }

  /** Pose sur l'unité sélectionnée un matériau ou un objet de l'inventaire. */
  equip(inventoryIndex: number): void {
    if (!this.canPrepare) return;
    const unit = this.selectedUnit();
    if (unit === null) {
      this.apply({ ok: false, reason: 'Sélectionne d’abord une de tes unités, puis clique sur un matériau ou un objet.' });
      return;
    }
    this.apply(equipFromInventory(this.state, inventoryIndex, unit.uid));
  }

  unequip(slotIndex: number): void {
    const unit = this.selectedUnit();
    if (unit !== null && this.canPrepare) this.apply(unequip(this.state, unit.uid, slotIndex));
  }

  /**
   * Clic sur une case du plateau :
   * - camp ennemi → on inspecte le monstre ;
   * - une de tes unités → on la sélectionne (ou désélectionne) ;
   * - case libre de ton camp avec une unité sélectionnée → on l'y déplace.
   */
  clickBoard(hex: Hex): void {
    if (!this.canPrepare) return;
    this.notice = null;
    if (!isPlayerHex(hex)) {
      const index = this.state.enemy.findIndex((placement) => hexKey(placement.position) === hexKey(hex));
      const same = this.selection?.kind === 'enemy' && this.selection.index === index;
      this.selection = index < 0 || same ? null : { kind: 'enemy', index };
      this.changed();
      return;
    }
    const occupant = unitAt(this.state, { area: 'board', hex });
    const selected = this.selectedUnit();
    if (occupant !== undefined) {
      this.selection = selected?.uid === occupant.uid ? null : { kind: 'unit', uid: occupant.uid };
      this.changed();
    } else if (selected !== null) {
      this.apply(moveUnit(this.state, selected.uid, { area: 'board', hex }));
    }
  }

  /** Clic sur une place de réserve : sélectionner l'unité qui s'y trouve, ou y ranger l'unité sélectionnée. */
  clickBench(index: number): void {
    if (!this.canPrepare) return;
    this.notice = null;
    const occupant = unitAt(this.state, { area: 'bench', index });
    const selected = this.selectedUnit();
    if (occupant !== undefined) {
      this.selection = selected?.uid === occupant.uid ? null : { kind: 'unit', uid: occupant.uid };
      this.changed();
    } else if (selected !== null) {
      this.apply(moveUnit(this.state, selected.uid, { area: 'bench', index }));
    }
  }

  /** Lance la chasse : le combat est simulé tout de suite, puis regardé sur le plateau. */
  launchFight(): void {
    if (!this.canPrepare) return;
    const hunt = this.state.hunt;
    const boss = huntInfo(hunt).isBoss;
    const { zennys, defeats, itemRemovers } = this.state;
    const outcome = fight(this.state);
    if (!outcome.ok) {
      this.apply(outcome);
      return;
    }
    this.selection = null;
    this.notice = null;
    this.watching = { result: outcome.result, hunt, boss, before: { zennys, defeats, itemRemovers } };
    this.changed();
  }

  /** Après une défaite (ou une fois la récompense choisie) : retour à la préparation. */
  stopWatching(): void {
    if (this.state.phase === 'reward') return;
    this.watching = null;
    this.changed();
  }

  chooseReward(index: number): void {
    const result = chooseReward(this.state, index);
    if (result.ok) this.watching = null;
    this.apply(result);
  }
}
