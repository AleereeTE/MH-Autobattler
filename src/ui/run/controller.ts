import type { CombatResult } from '../../combat/index.ts';
import { hexKey, type Hex } from '../../core/hex.ts';
import type { MaterialId } from '../../data/items.ts';
import {
  buy,
  buyItemRemover,
  canContinueInfinite,
  buyMaterial,
  chooseEvent,
  chooseNode,
  chooseReward,
  chooseTalent,
  continueInfinite,
  createRun,
  currentNode,
  equipFromInventory,
  fight,
  findRunUnit,
  huntInfo,
  isPlayerHex,
  leaveNode,
  levelUp,
  moveUnit,
  reforge,
  reroll,
  rerollTalent,
  restoreRun,
  sellUnit,
  serializeRun,
  unequip,
  unitAt,
  type ActionResult,
  type MapNodeKind,
  type RunState,
  type RunUnit,
} from '../../run/index.ts';
import { browserRecordStore, type RecordStore } from './infinite-record.ts';
import { browserRunSaveStore, type RunSaveStore } from './run-save.ts';

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
  /** Type de la case (chasse, quête urgente, boss). */
  readonly kind: MapNodeKind | null;
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
  /** À la forge : matériau de l'inventaire choisi pour être reforgé (sa position), ou null. */
  reforgeIndex: number | null = null;
  /**
   * Sur une case Événement : choix qui demande une précision avant d'être validé (unité à copier, matériaux à donner),
   * avec les matériaux déjà désignés ; null sinon.
   */
  eventSelection: { readonly choice: number; readonly materials: readonly number[] } | null = null;
  /** Record du mode infini : la plus haute étape atteinte (0 = aucun). */
  infiniteRecord: number;
  /** Le mode infini qui vient de se terminer a battu le record. */
  newRecord = false;
  /**
   * Run sauvegardée trouvée à l'ouverture, en attendant que le joueur choisisse : la continuer ou en commencer
   * une nouvelle. Tant qu'elle attend, rien n'est sauvegardé (elle n'est pas écrasée).
   */
  pendingSave: RunState | null;
  private readonly listeners = new Set<() => void>();
  private readonly records: RecordStore;
  private readonly saves: RunSaveStore;

  constructor(seed: number, records: RecordStore = browserRecordStore, saves: RunSaveStore = browserRunSaveStore) {
    this.state = createRun(seed);
    this.records = records;
    this.saves = saves;
    this.infiniteRecord = records.load();
    this.pendingSave = restoreRun(saves.load());
  }

  /** Reprend la run sauvegardée, exactement où elle s'était arrêtée. */
  resumeSave(): void {
    if (this.pendingSave === null) return;
    this.state = this.pendingSave;
    this.pendingSave = null;
    this.selection = null;
    this.watching = null;
    this.notice = null;
    this.reforgeIndex = null;
    this.eventSelection = null;
    this.changed();
  }

  /** Abandonne la run sauvegardée : la nouvelle run la remplace. */
  discardSave(): void {
    this.pendingSave = null;
    this.saves.clear();
    this.changed();
  }

  /**
   * ✅ Sauvegarde après chaque changement (reprise exacte). Une run finie est effacée, sauf une run gagnée
   * qui peut encore passer en mode infini.
   */
  private persist(): void {
    if (this.pendingSave !== null) return;
    if (this.state.phase === 'over' && !canContinueInfinite(this.state)) this.saves.clear();
    else this.saves.save(serializeRun(this.state));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private changed(): void {
    this.persist();
    for (const listener of this.listeners) listener();
  }

  private apply(result: ActionResult): void {
    this.notice = result.ok ? null : result.reason;
    // Toute action ferme la précision d'un choix d'événement (l'inventaire a pu bouger).
    this.eventSelection = null;
    this.changed();
  }

  /** La préparation est possible : pas de combat regardé, run en cours. */
  get canPrepare(): boolean {
    return this.watching === null && this.state.phase === 'prep';
  }

  /** On peut choisir la prochaine case de la carte. */
  get canChooseNode(): boolean {
    return this.watching === null && this.state.phase === 'map';
  }

  selectedUnit(): RunUnit | null {
    return this.selection?.kind === 'unit' ? (findRunUnit(this.state, this.selection.uid) ?? null) : null;
  }

  newRun(seed: number): void {
    this.state = createRun(seed);
    this.selection = null;
    this.watching = null;
    this.notice = null;
    this.reforgeIndex = null;
    this.eventSelection = null;
    this.newRecord = false;
    this.changed();
  }

  /** Début de stage : prend un des talents de chasseur proposés. */
  chooseTalent(index: number): void {
    this.apply(chooseTalent(this.state, index));
  }

  /** Début de stage : relance une des propositions de talent (une fois chacune). */
  rerollTalent(index: number): void {
    this.apply(rerollTalent(this.state, index));
  }

  /** Fin d'une run gagnée : continue en mode infini (récompenses du boss, puis carte du stage 4). */
  continueInfinite(): void {
    this.apply(continueInfinite(this.state));
  }

  /** Choisit la prochaine case de la carte (sa position dans l'étape suivante). */
  chooseNode(index: number): void {
    if (!this.canChooseNode) return;
    this.selection = null;
    this.reforgeIndex = null;
    this.apply(chooseNode(this.state, index));
  }

  /** Quitte une forge ou un marchand pour reprendre la route. */
  leaveNode(): void {
    if (!this.canPrepare) return;
    this.selection = null;
    this.reforgeIndex = null;
    this.apply(leaveNode(this.state));
  }

  /** Forge : choisit le matériau de l'inventaire à reforger (ou annule en le choisissant de nouveau). */
  selectReforge(inventoryIndex: number): void {
    this.reforgeIndex = this.reforgeIndex === inventoryIndex ? null : inventoryIndex;
    this.notice = null;
    this.changed();
  }

  /** Forge : transforme le matériau choisi en `material`. */
  reforge(material: MaterialId): void {
    if (!this.canPrepare || this.reforgeIndex === null) return;
    const result = reforge(this.state, this.reforgeIndex, material);
    if (result.ok) this.reforgeIndex = null;
    this.apply(result);
  }

  buyMaterial(offerIndex: number): void {
    if (this.canPrepare) this.apply(buyMaterial(this.state, offerIndex));
  }

  buyItemRemover(): void {
    if (this.canPrepare) this.apply(buyItemRemover(this.state));
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
    this.reforgeIndex = null;
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
    const kind = currentNode(this.state)?.kind ?? null;
    const { zennys, defeats, itemRemovers } = this.state;
    const outcome = fight(this.state);
    if (!outcome.ok) {
      this.apply(outcome);
      return;
    }
    this.selection = null;
    this.notice = null;
    this.watching = { result: outcome.result, hunt, boss, kind, before: { zennys, defeats, itemRemovers } };
    if (this.state.phase === 'over' && this.state.infinite) this.recordInfiniteEnd();
    this.changed();
  }

  /** Fin du mode infini : l'étape atteinte devient le record si elle le bat. */
  private recordInfiniteEnd(): void {
    const reached = this.state.hunt;
    this.newRecord = reached > this.infiniteRecord;
    if (!this.newRecord) return;
    this.infiniteRecord = reached;
    this.records.save(reached);
  }

  /** Après une défaite (ou une fois la récompense choisie) : retour à la préparation. */
  stopWatching(): void {
    if (this.state.phase === 'reward') return;
    this.watching = null;
    this.changed();
  }

  /** Choisit une récompense ; `unitId` désigne le monstre d'une capture. */
  chooseReward(index: number, unitId?: string): void {
    const result = chooseReward(this.state, index, unitId);
    if (result.ok) this.watching = null;
    this.apply(result);
  }

  /** Case Événement : fait un choix (avec l'unité ou les matériaux désignés s'il en faut). */
  chooseEvent(index: number, params: { readonly unitId?: string; readonly materialIndexes?: readonly number[] } = {}): void {
    const result = chooseEvent(this.state, index, params);
    if (result.ok) this.eventSelection = null;
    this.apply(result);
  }

  /** Case Événement : ouvre la précision d'un choix (Entraînement, Commission), ou la referme. */
  selectEventChoice(index: number | null): void {
    this.eventSelection = index === null ? null : { choice: index, materials: [] };
    this.changed();
  }

  /** Commission : désigne (ou retire) un matériau de l'inventaire à donner. */
  toggleEventMaterial(inventoryIndex: number): void {
    const selection = this.eventSelection;
    if (selection === null) return;
    const materials = selection.materials.includes(inventoryIndex)
      ? selection.materials.filter((index) => index !== inventoryIndex)
      : [...selection.materials, inventoryIndex];
    this.eventSelection = { choice: selection.choice, materials };
    this.changed();
  }
}
