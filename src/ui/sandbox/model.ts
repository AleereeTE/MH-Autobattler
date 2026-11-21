import { isInSideArea, type CombatSetup, type Side } from '../../combat/index.ts';
import { hexKey, type Hex } from '../../core/hex.ts';
import type { StarRank, UnitDefinition } from '../../data/definitions.ts';
import type { Equipment, MaterialId } from '../../data/items.ts';
import type { SquadDefinition } from '../../data/squads.ts';
import { findUnit } from '../../data/units/index.ts';
import { SLOT_CAPACITY, addMaterial, addObject, removeSlot } from '../../rules/equipment.ts';
import { BLACK_DRAGON_LIMIT_MESSAGE, exceedsBlackDragonLimit } from '../../rules/board-limits.ts';
import { isStarRank } from '../../rules/ranks.ts';

/**
 * État du bac à sable : quelles unités sont posées où, avec quel équipement, et ce qui est sélectionné.
 * Les vues lisent cet état et appellent ses méthodes ; elles sont prévenues à chaque changement.
 */

export interface PlacedUnit {
  readonly unit: UnitDefinition;
  readonly position: Hex;
  readonly equipment: Equipment;
  readonly rank: StarRank;
}

export type Selection =
  | { readonly kind: 'palette'; readonly unitId: string }
  | { readonly kind: 'board'; readonly key: string }
  | null;

export interface SavedPlacement {
  readonly unitId: string;
  readonly col: number;
  readonly row: number;
  readonly equipment: Equipment;
  /** Absent dans les compositions enregistrées avant l'arrivée des rangs : ★1. */
  readonly rank?: StarRank;
}

export function sideOf(hex: Hex): Side {
  return isInSideArea('enemy', hex) ? 'enemy' : 'player';
}

export class SandboxModel {
  private readonly cells = new Map<string, PlacedUnit>();
  private currentSelection: Selection = null;
  private readonly listeners = new Set<() => void>();
  /** Message d'information affiché à l'utilisateur (emplacements pleins…). */
  notice: string | null = null;

  subscribe(listener: () => void): void {
    this.listeners.add(listener);
  }

  private changed(notice: string | null = null): void {
    this.notice = notice;
    for (const listener of this.listeners) listener();
  }

  get selection(): Selection {
    return this.currentSelection;
  }

  placedUnits(): PlacedUnit[] {
    return [...this.cells.values()];
  }

  unitsOf(side: Side): PlacedUnit[] {
    return this.placedUnits().filter((placed) => sideOf(placed.position) === side);
  }

  selectedPlaced(): PlacedUnit | null {
    return this.currentSelection?.kind === 'board' ? (this.cells.get(this.currentSelection.key) ?? null) : null;
  }

  selectedDefinition(): UnitDefinition | null {
    if (this.currentSelection?.kind === 'palette') return findUnit(this.currentSelection.unitId) ?? null;
    return this.selectedPlaced()?.unit ?? null;
  }

  selectPalette(unitId: string): void {
    const same = this.currentSelection?.kind === 'palette' && this.currentSelection.unitId === unitId;
    this.currentSelection = same ? null : { kind: 'palette', unitId };
    this.changed();
  }

  /**
   * Clic sur une case :
   * - unité choisie dans la liste + case libre → on la pose ;
   * - unité du plateau sélectionnée + case libre → on la déplace ;
   * - case occupée → on sélectionne (ou désélectionne) l'unité qui s'y trouve.
   */
  clickCell(hex: Hex): void {
    const key = hexKey(hex);
    const occupant = this.cells.get(key);
    const selection = this.currentSelection;

    if (occupant !== undefined) {
      const same = selection?.kind === 'board' && selection.key === key;
      this.currentSelection = same ? null : { kind: 'board', key };
    } else if (selection?.kind === 'palette') {
      const unit = findUnit(selection.unitId);
      if (unit !== undefined && this.breaksBlackDragonLimit(unit, hex, null)) {
        this.changed(BLACK_DRAGON_LIMIT_MESSAGE);
        return;
      }
      if (unit !== undefined) this.cells.set(key, { unit, position: hex, equipment: [], rank: 1 });
    } else if (selection?.kind === 'board') {
      const moving = this.cells.get(selection.key);
      if (moving !== undefined && this.breaksBlackDragonLimit(moving.unit, hex, moving)) {
        this.changed(BLACK_DRAGON_LIMIT_MESSAGE);
        return;
      }
      if (moving !== undefined) {
        this.cells.delete(selection.key);
        this.cells.set(key, { ...moving, position: hex });
        this.currentSelection = { kind: 'board', key };
      }
    }
    this.changed();
  }

  /** Poser `unit` sur `hex` (en déplaçant éventuellement `moving`) donnerait-il 2 Dragons noirs dans ce camp ? */
  private breaksBlackDragonLimit(unit: UnitDefinition, hex: Hex, moving: PlacedUnit | null): boolean {
    const side = sideOf(hex);
    const others = this.unitsOf(side).filter((placed) => placed !== moving).map((placed) => placed.unit);
    return exceedsBlackDragonLimit([...others, unit]);
  }

  removeSelected(): void {
    if (this.currentSelection?.kind !== 'board') return;
    this.cells.delete(this.currentSelection.key);
    this.currentSelection = null;
    this.changed();
  }

  private updateSelectedEquipment(update: (equipment: Equipment, capacity: number) => Equipment | null): void {
    const placed = this.selectedPlaced();
    if (placed === null || this.currentSelection?.kind !== 'board') return;
    const next = update(placed.equipment, SLOT_CAPACITY[placed.unit.kind]);
    if (next === null) {
      this.changed('Tous les emplacements sont occupés.');
      return;
    }
    this.cells.set(this.currentSelection.key, { ...placed, equipment: next });
    this.changed();
  }

  setSelectedRank(rank: StarRank): void {
    const placed = this.selectedPlaced();
    if (placed === null || this.currentSelection?.kind !== 'board') return;
    this.cells.set(this.currentSelection.key, { ...placed, rank });
    this.changed();
  }

  addMaterial(material: MaterialId): void {
    this.updateSelectedEquipment((equipment, capacity) => addMaterial(equipment, material, capacity));
  }

  addObject(materials: readonly [MaterialId, MaterialId]): void {
    this.updateSelectedEquipment((equipment, capacity) => addObject(equipment, materials, capacity));
  }

  removeSlot(index: number): void {
    this.updateSelectedEquipment((equipment) => removeSlot(equipment, index));
  }

  clearSide(side: Side): void {
    for (const [key, placed] of this.cells) if (sideOf(placed.position) === side) this.cells.delete(key);
    if (this.selectedPlaced() === null && this.currentSelection?.kind === 'board') this.currentSelection = null;
    this.changed();
  }

  loadSquad(side: Side, squad: SquadDefinition): void {
    for (const [key, placed] of this.cells) if (sideOf(placed.position) === side) this.cells.delete(key);
    for (const member of squad.members) {
      const unit = findUnit(member.unitId);
      const position = { col: member.col, row: member.row };
      if (unit !== undefined && sideOf(position) === side) {
        this.cells.set(hexKey(position), { unit, position, equipment: member.equipment ?? [], rank: member.rank ?? 1 });
      }
    }
    this.currentSelection = null;
    this.changed();
  }

  toSetup(): CombatSetup {
    const toPlacements = (side: Side) =>
      this.unitsOf(side).map(({ unit, position, equipment, rank }) => ({ unit, position, equipment, rank }));
    return { player: toPlacements('player'), enemy: toPlacements('enemy') };
  }

  save(): SavedPlacement[] {
    return this.placedUnits().map(({ unit, position, equipment, rank }) => ({
      unitId: unit.id,
      col: position.col,
      row: position.row,
      equipment,
      rank,
    }));
  }

  restore(saved: readonly SavedPlacement[]): void {
    this.cells.clear();
    for (const entry of saved) {
      const unit = findUnit(entry.unitId);
      const position = { col: entry.col, row: entry.row };
      const rank = isStarRank(entry.rank) ? entry.rank : 1;
      if (unit !== undefined) this.cells.set(hexKey(position), { unit, position, equipment: entry.equipment, rank });
    }
    this.currentSelection = null;
    this.changed();
  }
}
