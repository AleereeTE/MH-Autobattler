/** ⚠️ Nombre de ticks par seconde de combat simulé (1 tick = 50 ms). */
export const TICKS_PER_SECOND = 20;

/**
 * Limite de sécurité : 10 minutes de combat simulé.
 * Ce n'est PAS une règle de jeu : elle protège seulement contre une boucle infinie en cas de bug.
 */
export const SAFETY_LIMIT_TICKS = 600 * TICKS_PER_SECOND;

/**
 * L'énergie des unités est relevée dans un événement toutes les 2 ticks (0,1 s) : elle change presque
 * à chaque tick (gain passif), un événement par changement serait trop lourd. Le replay remet aussi
 * l'énergie à 0 dès qu'une compétence est lancée, sans attendre le relevé suivant.
 */
export const ENERGY_SNAPSHOT_TICKS = 2;

export function ticksToSeconds(ticks: number): number {
  return ticks / TICKS_PER_SECOND;
}

export function secondsToTicks(seconds: number): number {
  return Math.round(seconds * TICKS_PER_SECOND);
}
