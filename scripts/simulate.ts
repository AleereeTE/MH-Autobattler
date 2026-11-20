/**
 * Simule l'équipe de démonstration contre une escouade ennemie et affiche le journal.
 * Usage : npm run simulate               (graine 1, escouade Moyenne)
 *         npm run simulate -- 42 hard    (graine 42, escouade Difficile : easy, medium ou hard)
 */
import { simulateCombat, ticksToSeconds } from '../src/combat/index.ts';
import { formatCombatLog } from '../src/render/text-log.ts';
import { createDemoSetup } from '../src/sandbox/presets.ts';

const seed = Number(process.argv[2] ?? 1);
if (!Number.isInteger(seed)) {
  console.error('La graine doit être un nombre entier. Exemple : npm run simulate -- 42');
  process.exit(1);
}

const result = simulateCombat(createDemoSetup(process.argv[3]), seed);
console.log(formatCombatLog(result.events).join('\n'));
console.log(`\nGraine ${seed} · ${result.events.length} événements · ${ticksToSeconds(result.durationTicks).toFixed(2)} s simulées`);
