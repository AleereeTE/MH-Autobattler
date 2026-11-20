import { RUN_STRUCTURE } from '../data/run-balance.ts';

/** ✅ 30 chasses : 3 stages de 9 chasses classiques suivies d'un boss. */
export const TOTAL_HUNTS = RUN_STRUCTURE.stages * RUN_STRUCTURE.huntsPerStage;

export interface HuntInfo {
  /** Stage de 1 à 3. */
  readonly stage: number;
  /** Numéro de la chasse dans son stage, de 1 à 10. */
  readonly indexInStage: number;
  readonly isBoss: boolean;
  readonly isLast: boolean;
}

export function huntInfo(hunt: number): HuntInfo {
  const stage = Math.floor((hunt - 1) / RUN_STRUCTURE.huntsPerStage) + 1;
  const indexInStage = ((hunt - 1) % RUN_STRUCTURE.huntsPerStage) + 1;
  return { stage, indexInStage, isBoss: indexInStage === RUN_STRUCTURE.huntsPerStage, isLast: hunt === TOTAL_HUNTS };
}
